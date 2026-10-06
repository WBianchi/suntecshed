import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { buyShippingLabel, fetchLabelPdf, MelhorEnvioError } from "@/lib/melhor-envio";

const PENDING_MARKER = "__pending__";

// POST — Compra a etiqueta de envio direto no Melhor Envio (carrinho +
// pagamento com saldo da conta + geração + impressão), igual o plugin do
// WooCommerce fazia. Só funciona pra pedidos com um serviço real cotado
// no checkout (meServiceId) — pedidos com etiqueta anexada pelo cliente
// ou frete de regra própria não passam por aqui.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const { id } = await params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        address: true,
        items: { include: { product: { select: { weight: true, width: true, height: true, length: true } } } },
      },
    });

    if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    if (order.labelUrl) return NextResponse.json({ error: "Este pedido já tem uma etiqueta" }, { status: 400 });
    if (!order.meServiceId) {
      return NextResponse.json(
        { error: "Este pedido não tem um serviço de transportadora do Melhor Envio associado (etiqueta própria do cliente ou frete customizado)." },
        { status: 400 }
      );
    }

    // O envio já foi comprado/pago numa tentativa anterior (o dinheiro já
    // saiu da conta) e só o PDF não tinha sido obtido ainda — rebusca o PDF
    // desse MESMO envio em vez de comprar de novo.
    if (order.meCartId && order.meCartId !== PENDING_MARKER) {
      const { labelUrl, trackingCode } = await fetchLabelPdf(order.meCartId);
      await prisma.order.update({
        where: { id },
        data: { labelUrl, trackingCode: trackingCode || order.trackingCode },
      });
      return NextResponse.json({ labelUrl, trackingCode });
    }

    const snapshot = order.shippingSnapshot as Record<string, string> | null;
    const addr = order.address || {
      street: snapshot?.street || "",
      number: snapshot?.number || "",
      complement: snapshot?.complement || "",
      neighborhood: snapshot?.neighborhood || "",
      city: snapshot?.city || "",
      state: snapshot?.state || "",
      zipCode: snapshot?.zipCode || "",
      phone: null as string | null,
      name: order.recipientName || "",
    };

    if (!addr.street || !addr.city || !addr.state || !addr.zipCode) {
      return NextResponse.json({ error: "Endereço de entrega do pedido está incompleto." }, { status: 400 });
    }

    // Embalagem padrão pra itens sem dimensão/peso próprios cadastrados —
    // mesmo fallback usado no cálculo de frete do checkout. Boa parte do
    // catálogo migrado do WooCommerce tem peso cadastrado implausivelmente
    // baixo (< 10g) — piso mínimo evita 422 por peso/dimensão perto de zero.
    const volumes = order.items.map((item) => ({
      width: Math.max(item.product?.width || 15, 11),
      height: Math.max(item.product?.height || 20, 2),
      length: Math.max(item.product?.length || 16, 16),
      weight: Math.max((item.product?.weight || 1000) / 1000, 0.3),
    }));
    if (volumes.length === 0) {
      volumes.push({ width: 15, height: 20, length: 16, weight: 0.3 });
    }

    // Lista de produtos pra declaração de conteúdo — sem isso o Melhor
    // Envio recusa o carrinho ("é necessário informar ao menos um produto").
    const products = order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitaryValue: item.price,
    }));

    // Trava atômica: só segue pra compra se nenhuma outra requisição (ex:
    // duplo clique) já reivindicou esse pedido. Se outra já reivindicou,
    // essa aqui simplesmente para — a que ganhou a corrida é quem compra.
    const claim = await prisma.order.updateMany({
      where: { id, labelUrl: null, meCartId: null },
      data: { meCartId: PENDING_MARKER },
    });
    if (claim.count === 0) {
      return NextResponse.json(
        { error: "Já existe uma compra de etiqueta em andamento pra esse pedido. Aguarde e tente de novo em alguns segundos." },
        { status: 409 }
      );
    }

    try {
      const result = await buyShippingLabel(
        {
          serviceId: order.meServiceId,
          recipient: {
            name: order.recipientName || addr.name || "Cliente",
            document: order.recipientDocument || snapshot?.document || "",
            phone: addr.phone || snapshot?.phone || undefined,
            postalCode: addr.zipCode.replace(/\D/g, ""),
            address: addr.street,
            number: addr.number,
            complement: addr.complement || undefined,
            district: addr.neighborhood,
            city: addr.city,
            stateAbbr: addr.state,
          },
          volumes,
          products,
          insuranceValue: order.total,
        },
        {
          // Chamado assim que o saldo é debitado de verdade — persiste o
          // cartId antes de tentar buscar o PDF, pra nunca comprar de novo
          // só porque esse passo seguinte falhou.
          onPurchased: async (cartId) => {
            await prisma.order.update({ where: { id }, data: { meCartId: cartId } });
          },
        }
      );

      await prisma.order.update({
        where: { id },
        data: {
          labelUrl: result.labelUrl,
          trackingCode: result.trackingCode || order.trackingCode,
        },
      });

      return NextResponse.json({ labelUrl: result.labelUrl, trackingCode: result.trackingCode });
    } catch (err) {
      // Se a compra nem chegou a debitar o saldo (falhou antes do
      // onPurchased), libera a trava pra poder tentar de novo. Se já
      // debitou (meCartId real já salvo), deixa como está — a próxima
      // tentativa cai no caminho de só rebuscar o PDF, lá em cima.
      const fresh = await prisma.order.findUnique({ where: { id }, select: { meCartId: true } });
      if (fresh?.meCartId === PENDING_MARKER) {
        await prisma.order.update({ where: { id }, data: { meCartId: null } });
      }
      throw err;
    }
  } catch (error) {
    if (error instanceof MelhorEnvioError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Buy label error:", error);
    return NextResponse.json({ error: "Erro ao comprar etiqueta no Melhor Envio" }, { status: 500 });
  }
}
