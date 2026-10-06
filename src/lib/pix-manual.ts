import QRCode from "qrcode";

// ============================================
// PIX manual (chave estática) — sem gateway.
// O pagamento é feito direto na chave da loja e a confirmação é manual
// (o admin marca o pedido como pago depois de ver o valor cair na conta),
// igual ao fluxo antigo do WooCommerce (plugin "Pix por Piggly").
// ============================================

const PIX_KEY = "60354224000123"; // CNPJ 60.354.224/0001-23
const MERCHANT_NAME = "SUNTECSHED LTDA";
const MERCHANT_CITY = "BRASILIA";

function tlv(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

// CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF) — exigido pelo
// padrão BR Code do Banco Central ao final do payload (campo 63).
function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

// txid do BR Code aceita só [A-Za-z0-9], até 25 caracteres.
function sanitizeTxid(txid: string): string {
  const clean = txid.replace(/[^A-Za-z0-9]/g, "").slice(0, 25);
  return clean || "***";
}

function buildPixPayload({ amount, txid }: { amount: number; txid: string }): string {
  const merchantAccountInfo =
    tlv("00", "br.gov.bcb.pix") + tlv("01", PIX_KEY);

  const additionalData = tlv("05", sanitizeTxid(txid));

  const payload =
    tlv("00", "01") + // Payload Format Indicator
    tlv("26", merchantAccountInfo) + // Merchant Account Information
    tlv("52", "0000") + // Merchant Category Code
    tlv("53", "986") + // Moeda: BRL
    tlv("54", amount.toFixed(2)) + // Valor da transação
    tlv("58", "BR") + // País
    tlv("59", MERCHANT_NAME.slice(0, 25)) + // Nome do recebedor
    tlv("60", MERCHANT_CITY.slice(0, 15)) + // Cidade do recebedor
    tlv("62", additionalData) + // Additional Data Field (txid)
    "6304"; // Início do campo CRC (sem o valor ainda)

  return payload + crc16(payload);
}

export interface ManualPixResult {
  id: string;
  status: string;
  pixQrCode: string; // base64 PNG (sem prefixo data:)
  pixCopyPaste: string;
  pixKey: string;
  pixKeyLabel: string;
}

export async function generateManualPix({
  value,
  orderNumber,
}: {
  value: number;
  orderNumber: string;
}): Promise<ManualPixResult> {
  const payload = buildPixPayload({ amount: value, txid: orderNumber });
  const qrBuffer = await QRCode.toBuffer(payload, { errorCorrectionLevel: "M", margin: 1, width: 400 });

  return {
    id: `MANUAL-${orderNumber}`,
    status: "PENDING",
    pixQrCode: qrBuffer.toString("base64"),
    pixCopyPaste: payload,
    pixKey: PIX_KEY,
    pixKeyLabel: "CNPJ",
  };
}
