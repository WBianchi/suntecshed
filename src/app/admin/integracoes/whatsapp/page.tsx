"use client";

import { IntegrationPage } from "@/components/admin/IntegrationPage";
import { FiMessageSquare } from "react-icons/fi";

export default function WhatsAppIntegrationPage() {
  return (
    <IntegrationPage
      provider="whatsapp_api"
      title="WhatsApp API"
      description="Envio de mensagens automáticas e notificações via WhatsApp Business API"
      icon={<FiMessageSquare className="h-6 w-6 text-primary" />}
      docsUrl="https://developers.facebook.com/docs/whatsapp"
      fields={[
        { key: "provider_type", label: "Provedor", type: "select", required: true, options: [
          { value: "meta_cloud", label: "Meta Cloud API (oficial)" },
          { value: "z_api", label: "Z-API" },
          { value: "evolution_api", label: "Evolution API" },
          { value: "wppconnect", label: "WPPConnect" },
        ], hint: "Selecione o provedor de API do WhatsApp" },
        { key: "api_url", label: "URL da API", type: "text", placeholder: "https://graph.facebook.com/v18.0 ou URL do seu servidor", required: true, hint: "URL base da API. Para Meta Cloud: https://graph.facebook.com/v18.0" },
        { key: "access_token", label: "Access Token", type: "password", placeholder: "Token de acesso à API", required: true },
        { key: "phone_number_id", label: "Phone Number ID", type: "text", placeholder: "ID do número de telefone", hint: "Para Meta Cloud API — encontrado no painel Meta Business" },
        { key: "business_account_id", label: "Business Account ID", type: "text", placeholder: "ID da conta business", hint: "Para Meta Cloud API" },
        { key: "instance_id", label: "Instance ID / Client Token", type: "text", placeholder: "ID da instância", hint: "Para Z-API, Evolution API ou WPPConnect" },
        { key: "webhook_verify_token", label: "Webhook Verify Token", type: "password", placeholder: "Token de verificação do webhook" },
        { key: "default_country_code", label: "Código do País Padrão", type: "text", placeholder: "55", hint: "Código do país sem +. Ex: 55 para Brasil" },
        { key: "send_order_confirmation", label: "Notificar pedido criado", type: "toggle", hint: "Enviar mensagem ao cliente quando um pedido é criado" },
        { key: "send_payment_confirmed", label: "Notificar pagamento confirmado", type: "toggle", hint: "Enviar mensagem quando o pagamento for aprovado" },
        { key: "send_shipped", label: "Notificar envio", type: "toggle", hint: "Enviar mensagem com código de rastreamento" },
        { key: "send_delivered", label: "Notificar entrega", type: "toggle", hint: "Enviar mensagem de confirmação de entrega" },
        { key: "send_abandoned_cart", label: "Recuperação de carrinho", type: "toggle", hint: "Enviar mensagem para carrinhos abandonados" },
        { key: "abandoned_cart_delay_hours", label: "Delay recuperação de carrinho (horas)", type: "text", placeholder: "1" },
        { key: "admin_notifications_number", label: "WhatsApp do Admin (notificações)", type: "text", placeholder: "5562999999999", hint: "Número que receberá notificações de novos pedidos e alertas" },
        { key: "send_admin_new_order", label: "Notificar admin em novo pedido", type: "toggle" },
        { key: "send_admin_payment", label: "Notificar admin em pagamento", type: "toggle" },
      ]}
    />
  );
}
