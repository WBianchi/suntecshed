import nodemailer from "nodemailer";

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
    secure: process.env.EMAIL_SERVER_SECURE === "true",
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });
}

// Template padrão da marca pra e-mails transacionais — topo com degradê
// dourado/amarelo, corpo branco, rodapé preto. Reaproveitável pra outros
// e-mails do site (confirmação de pedido, etc), não só redefinição de senha.
function brandedEmailHtml({ title, bodyHtml }: { title: string; bodyHtml: string }): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:600px;">
        <tr>
          <td style="background:linear-gradient(135deg,#7530fa,#9d6bff);padding:32px 24px;text-align:center;">
            <h1 style="color:#111111;margin:0;font-size:26px;font-weight:900;letter-spacing:0.5px;">SUNTECSHED</h1>
            <p style="color:#3a3a3a;margin:6px 0 0;font-size:13px;font-weight:600;">${title}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 28px;color:#333333;font-size:15px;line-height:1.6;">
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 24px;background:#111111;color:#999999;font-size:11px;text-align:center;">
            &copy; ${new Date().getFullYear()} Suntecshed. Todos os direitos reservados.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  const html = brandedEmailHtml({
    title: "Redefinição de senha",
    bodyHtml: `
      <p style="margin:0 0 16px;">Olá, ${name || "cliente"}!</p>
      <p style="margin:0 0 24px;">Recebemos um pedido para redefinir a senha da sua conta na Suntecshed. Clique no botão abaixo pra criar uma nova senha:</p>
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
        <tr><td style="border-radius:999px;background:#7530fa;">
          <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;color:#111111;font-weight:800;font-size:14px;text-decoration:none;border-radius:999px;">
            Redefinir Senha
          </a>
        </td></tr>
      </table>
      <p style="margin:0 0 8px;color:#666666;font-size:13px;">Se o botão não funcionar, copie e cole este link no seu navegador:</p>
      <p style="margin:0 0 24px;word-break:break-all;color:#7530fa;font-size:13px;">${resetUrl}</p>
      <p style="margin:0;color:#999999;font-size:12px;">Esse link expira em 1 hora. Se você não pediu essa redefinição, pode ignorar este e-mail com segurança.</p>
    `,
  });

  await sendBrandedEmail({ to, subject: "Redefinição de senha — Suntecshed", html });
}

// Genérico — qualquer outro e-mail transacional da plataforma (status de
// pedido, etc) usa isso pra sair com a mesma cara de marca.
export async function sendBrandedEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Suntecshed" <${process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER}>`,
    to,
    subject,
    html,
  });
}

export { brandedEmailHtml };
