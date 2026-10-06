"use client";

import { IntegrationPage } from "@/components/admin/IntegrationPage";
import { FiMail } from "react-icons/fi";

export default function SmtpIntegrationPage() {
  return (
    <IntegrationPage
      provider="smtp"
      title="E-mail — SMTP"
      description="Configuração de envio de e-mails transacionais e marketing"
      icon={<FiMail className="h-6 w-6 text-primary" />}
      fields={[
        { key: "host", label: "Servidor SMTP (Host)", type: "text", placeholder: "smtp.gmail.com", required: true, hint: "Endereço do servidor de e-mail. Ex: smtp.gmail.com, smtp.hostinger.com" },
        { key: "port", label: "Porta", type: "select", required: true, options: [
          { value: "25", label: "25 (não seguro)" },
          { value: "465", label: "465 (SSL)" },
          { value: "587", label: "587 (TLS — recomendado)" },
          { value: "2525", label: "2525 (alternativa)" },
        ], hint: "Porta 587 (TLS) é a mais recomendada" },
        { key: "secure", label: "Usar SSL/TLS", type: "toggle", hint: "Ative para conexão segura (obrigatório para porta 465)" },
        { key: "username", label: "Usuário / E-mail", type: "text", placeholder: "noreply@C7drop.com.br", required: true },
        { key: "password", label: "Senha / App Password", type: "password", placeholder: "Senha do e-mail ou senha de app", required: true, hint: "Para Gmail, use uma Senha de App gerada nas configurações de segurança" },
        { key: "from_name", label: "Nome do Remetente", type: "text", placeholder: "C7 Drop", required: true },
        { key: "from_email", label: "E-mail do Remetente", type: "text", placeholder: "noreply@C7drop.com.br", required: true, hint: "E-mail que aparecerá como remetente" },
        { key: "reply_to", label: "Responder Para (Reply-To)", type: "text", placeholder: "contato@C7drop.com.br", hint: "E-mail que receberá respostas dos clientes" },
        { key: "bcc", label: "Cópia Oculta (BCC)", type: "text", placeholder: "admin@C7drop.com.br", hint: "Receber cópia de todos os e-mails enviados" },
        { key: "send_order_confirmation", label: "Enviar confirmação de pedido", type: "toggle", hint: "E-mail automático quando pedido é criado" },
        { key: "send_payment_confirmed", label: "Enviar confirmação de pagamento", type: "toggle", hint: "E-mail automático quando pagamento é confirmado" },
        { key: "send_shipped", label: "Enviar notificação de envio", type: "toggle", hint: "E-mail automático com código de rastreamento" },
        { key: "send_delivered", label: "Enviar confirmação de entrega", type: "toggle", hint: "E-mail automático quando pedido é entregue" },
        { key: "send_abandoned_cart", label: "Enviar recuperação de carrinho", type: "toggle", hint: "E-mail automático para carrinhos abandonados" },
        { key: "abandoned_cart_delay_hours", label: "Delay carrinho abandonado (horas)", type: "text", placeholder: "2", hint: "Tempo de espera antes de enviar e-mail de recuperação" },
      ]}
    />
  );
}
