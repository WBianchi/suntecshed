"use client";

import { IntegrationPage } from "@/components/admin/IntegrationPage";
import { FiDollarSign } from "react-icons/fi";

export default function PagamentosIntegrationPage() {
  return (
    <IntegrationPage
      provider="asaas"
      title="Pagamentos — Asaas"
      description="Gateway de pagamento com PIX, Boleto e Cartão de Crédito"
      icon={<FiDollarSign className="h-6 w-6 text-primary" />}
      docsUrl="https://docs.asaas.com"
      fields={[
        { key: "api_key", label: "API Key", type: "password", placeholder: "$aact_...", required: true, hint: "Chave de API obtida no painel Asaas > Integrações" },
        { key: "sandbox", label: "Modo Sandbox (teste)", type: "toggle", hint: "Ative para usar o ambiente sandbox antes de ir para produção" },
        { key: "sandbox_api_key", label: "API Key Sandbox", type: "password", placeholder: "$aact_...", hint: "Chave de API do ambiente sandbox (se modo sandbox ativo)" },
        { key: "webhook_token", label: "Token do Webhook", type: "password", placeholder: "Token para validar webhooks recebidos", hint: "Usado para autenticar notificações do Asaas" },
        { key: "enable_pix", label: "Habilitar PIX", type: "toggle", hint: "Aceitar pagamentos via PIX (aprovação instantânea)" },
        { key: "pix_expiration_hours", label: "Expiração do PIX (horas)", type: "text", placeholder: "24", hint: "Tempo em horas para o QR Code do PIX expirar" },
        { key: "enable_boleto", label: "Habilitar Boleto", type: "toggle", hint: "Aceitar pagamentos via boleto bancário" },
        { key: "boleto_days_due", label: "Vencimento do Boleto (dias)", type: "text", placeholder: "3", hint: "Dias após a compra para vencimento do boleto" },
        { key: "boleto_instructions", label: "Instruções do Boleto", type: "textarea", placeholder: "Não receber após o vencimento.\nMulta de 2% após o vencimento.", hint: "Instruções impressas no boleto" },
        { key: "enable_credit_card", label: "Habilitar Cartão de Crédito", type: "toggle", hint: "Aceitar pagamentos via cartão de crédito" },
        { key: "max_installments", label: "Máximo de Parcelas", type: "select", options: [
          { value: "1", label: "À vista" }, { value: "2", label: "2x" }, { value: "3", label: "3x" },
          { value: "6", label: "6x" }, { value: "10", label: "10x" }, { value: "12", label: "12x" },
        ], hint: "Número máximo de parcelas no cartão" },
        { key: "min_installment_value", label: "Valor Mínimo da Parcela (R$)", type: "text", placeholder: "30.00", hint: "Valor mínimo para cada parcela" },
        { key: "interest_free_installments", label: "Parcelas sem Juros", type: "select", options: [
          { value: "1", label: "Nenhuma" }, { value: "2", label: "Até 2x" }, { value: "3", label: "Até 3x" },
          { value: "6", label: "Até 6x" }, { value: "10", label: "Até 10x" }, { value: "12", label: "Até 12x" },
        ]},
        { key: "auto_confirm_pix", label: "Auto-confirmar pedido no PIX", type: "toggle", hint: "Confirmar pedido automaticamente quando PIX for pago" },
        { key: "notification_email", label: "E-mail para Notificações", type: "text", placeholder: "financeiro@C7drop.com.br" },
      ]}
    />
  );
}
