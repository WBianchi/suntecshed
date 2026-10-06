import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  try {
    const { campaignId } = await req.json();
    if (!campaignId) return NextResponse.json({ error: "Campaign ID obrigatório" }, { status: 400 });

    const campaign = await prisma.whatsAppCampaign.findUnique({
      where: { id: campaignId },
      include: { template: true },
    });

    if (!campaign) return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
    if (campaign.status === "sent") return NextResponse.json({ error: "Campanha já enviada" }, { status: 400 });

    const config = await prisma.whatsAppConfig.findFirst();
    if (!config || config.status !== "connected") {
      return NextResponse.json({ error: "WhatsApp não está conectado" }, { status: 400 });
    }

    const wahaUrl = config.wahaUrl || process.env.WAHA_API_URL || "http://localhost:9000";
    const wahaApiKey = config.wahaApiKey || process.env.WAHA_API_KEY || "";
    const sessionName = config.sessionName || "default";

    // Get recipients
    let recipients: { id: string; phone: string | null; name: string }[];
    if (campaign.recipientType === "specific" && campaign.recipientIds.length > 0) {
      recipients = await prisma.user.findMany({
        where: { id: { in: campaign.recipientIds }, role: "CLIENT", phone: { not: null } },
        select: { id: true, phone: true, name: true },
      });
    } else {
      recipients = await prisma.user.findMany({
        where: { role: "CLIENT", phone: { not: null } },
        select: { id: true, phone: true, name: true },
      });
    }

    if (recipients.length === 0) {
      return NextResponse.json({ error: "Nenhum destinatário com telefone encontrado" }, { status: 400 });
    }

    await prisma.whatsAppCampaign.update({ where: { id: campaignId }, data: { status: "sending" } });

    let totalSent = 0;
    let totalFailed = 0;

    for (const r of recipients) {
      if (!r.phone) continue;
      try {
        const phone = r.phone.replace(/\D/g, "");
        const chatId = phone.length <= 12 ? `55${phone}@c.us` : `${phone}@c.us`;
        const message = campaign.template.message
          .replace(/\{\{nome\}\}/gi, r.name)
          + (campaign.template.footer ? `\n\n${campaign.template.footer}` : "");

        await fetch(`${wahaUrl}/api/sendText`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Api-Key": wahaApiKey },
          body: JSON.stringify({ session: sessionName, chatId, text: message }),
        });

        totalSent++;
        // Small delay between messages
        await new Promise((r) => setTimeout(r, 1500));
      } catch (err) {
        console.error(`Failed to send WhatsApp to ${r.phone}:`, err);
        totalFailed++;
      }
    }

    await prisma.whatsAppCampaign.update({
      where: { id: campaignId },
      data: { status: "sent", sentAt: new Date(), totalSent, totalFailed },
    });

    return NextResponse.json({ ok: true, totalSent, totalFailed });
  } catch (error: any) {
    console.error("Send WhatsApp campaign error:", error);
    return NextResponse.json({ error: "Erro ao enviar campanha" }, { status: 500 });
  }
}
