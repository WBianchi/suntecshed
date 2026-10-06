import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  try {
    const { campaignId } = await req.json();
    if (!campaignId) return NextResponse.json({ error: "Campaign ID obrigatório" }, { status: 400 });

    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: campaignId },
      include: { template: true },
    });

    if (!campaign) return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
    if (campaign.status === "sent") return NextResponse.json({ error: "Campanha já enviada" }, { status: 400 });

    // Get recipients
    let recipients: { id: string; email: string; name: string }[];
    if (campaign.recipientType === "specific" && campaign.recipientIds.length > 0) {
      recipients = await prisma.user.findMany({
        where: { id: { in: campaign.recipientIds }, role: "CLIENT" },
        select: { id: true, email: true, name: true },
      });
    } else {
      recipients = await prisma.user.findMany({
        where: { role: "CLIENT" },
        select: { id: true, email: true, name: true },
      });
    }

    if (recipients.length === 0) {
      return NextResponse.json({ error: "Nenhum destinatário encontrado" }, { status: 400 });
    }

    // Update status
    await prisma.emailCampaign.update({ where: { id: campaignId }, data: { status: "sending" } });

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: parseInt(process.env.EMAIL_SERVER_PORT || "465"),
      secure: process.env.EMAIL_SERVER_SECURE === "true",
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    let totalSent = 0;
    let totalFailed = 0;

    for (const r of recipients) {
      try {
        const html = buildEmailHtml(campaign.template.body, campaign.template.footer, r.name);
        await transporter.sendMail({
          from: `"C7 Drop" <${process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER}>`,
          to: r.email,
          subject: campaign.template.subject,
          html,
        });
        totalSent++;
      } catch (err) {
        console.error(`Failed to send to ${r.email}:`, err);
        totalFailed++;
      }
    }

    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: { status: "sent", sentAt: new Date(), totalSent, totalFailed },
    });

    return NextResponse.json({ ok: true, totalSent, totalFailed });
  } catch (error: any) {
    console.error("Send campaign error:", error);
    return NextResponse.json({ error: "Erro ao enviar campanha" }, { status: 500 });
  }
}

function buildEmailHtml(body: string, footer: string | null, recipientName: string): string {
  const processedBody = body.replace(/\{\{nome\}\}/gi, recipientName);
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#1a1a2e;padding:24px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:22px;">C7 Drop</h1>
        </td></tr>
        <tr><td style="padding:32px 24px;color:#333333;font-size:15px;line-height:1.6;">
          ${processedBody}
        </td></tr>
        ${footer ? `<tr><td style="padding:16px 24px;background:#f9f9f9;color:#888888;font-size:12px;text-align:center;border-top:1px solid #eee;">
          ${footer}
        </td></tr>` : ""}
        <tr><td style="padding:16px 24px;background:#1a1a2e;color:#888888;font-size:11px;text-align:center;">
          &copy; ${new Date().getFullYear()} C7 Drop. Todos os direitos reservados.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
