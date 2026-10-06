"use client";

import { IntegrationPage } from "@/components/admin/IntegrationPage";
import { FiTruck } from "react-icons/fi";

export default function FreteIntegrationPage() {
  return (
    <IntegrationPage
      provider="melhor_envio"
      title="Frete — Melhor Envio"
      description="Calcule fretes, gere etiquetas e rastreie entregas automaticamente"
      icon={<FiTruck className="h-6 w-6 text-primary" />}
      docsUrl="https://docs.melhorenvio.com.br"
      fields={[
        { key: "client_id", label: "Client ID", type: "text", placeholder: "Seu Client ID do Melhor Envio", required: true, hint: "Obtido no painel de desenvolvedor do Melhor Envio" },
        { key: "client_secret", label: "Client Secret", type: "password", placeholder: "Seu Client Secret", required: true },
        { key: "access_token", label: "Access Token", type: "password", placeholder: "Token de acesso (gerado após autorização OAuth)", required: true },
        { key: "refresh_token", label: "Refresh Token", type: "password", placeholder: "Refresh Token" },
        { key: "sandbox", label: "Modo Sandbox (teste)", type: "toggle", hint: "Ative para usar o ambiente de testes antes de ir para produção" },
        { key: "sender_name", label: "Nome do Remetente (opcional)", type: "text", placeholder: "C7 Drop", hint: "Se vazio, usa o nome cadastrado na sua conta Melhor Envio" },
        { key: "sender_phone", label: "Telefone do Remetente (opcional)", type: "text", placeholder: "(62) 99999-9999" },
        { key: "sender_email", label: "E-mail do Remetente (opcional)", type: "text", placeholder: "contato@C7drop.com.br" },
        { key: "sender_document", label: "CPF/CNPJ do Remetente (opcional)", type: "text", placeholder: "00.000.000/0001-00" },
        { key: "sender_zipcode", label: "CEP de Origem", type: "text", placeholder: "74000-000", required: true, hint: "CEP do local de onde os produtos saem (usado pra cotação de frete)" },
        { key: "sender_address", label: "Endereço de Origem", type: "text", placeholder: "Rua Exemplo, 123", hint: "Rua e número separados por vírgula — esse é o endereço real de despacho, tem prioridade sobre o cadastro da conta Melhor Envio" },
        { key: "sender_complement", label: "Complemento", type: "text", placeholder: "Apto 22, Bloco B, etc" },
        { key: "sender_district", label: "Bairro de Origem", type: "text", placeholder: "Centro" },
        { key: "sender_city", label: "Cidade de Origem", type: "text", placeholder: "São Paulo" },
        { key: "sender_state", label: "Estado de Origem", type: "select", options: [
          { value: "AC", label: "AC" }, { value: "AL", label: "AL" }, { value: "AP", label: "AP" },
          { value: "AM", label: "AM" }, { value: "BA", label: "BA" }, { value: "CE", label: "CE" },
          { value: "DF", label: "DF" }, { value: "ES", label: "ES" }, { value: "GO", label: "GO" },
          { value: "MA", label: "MA" }, { value: "MT", label: "MT" }, { value: "MS", label: "MS" },
          { value: "MG", label: "MG" }, { value: "PA", label: "PA" }, { value: "PB", label: "PB" },
          { value: "PR", label: "PR" }, { value: "PE", label: "PE" }, { value: "PI", label: "PI" },
          { value: "RJ", label: "RJ" }, { value: "RN", label: "RN" }, { value: "RS", label: "RS" },
          { value: "RO", label: "RO" }, { value: "RR", label: "RR" }, { value: "SC", label: "SC" },
          { value: "SP", label: "SP" }, { value: "SE", label: "SE" }, { value: "TO", label: "TO" },
        ]},
        { key: "carriers", label: "Transportadoras Ativas", type: "textarea", placeholder: "correios,jadlog,azul,latam\n(separe por vírgula)", hint: "Transportadoras habilitadas para cotação. Ex: correios,jadlog,azul,latam" },
        { key: "free_shipping_min", label: "Frete Grátis a partir de (R$)", type: "text", placeholder: "299.90", hint: "Deixe vazio para não oferecer frete grátis" },
        { key: "insurance", label: "Seguro de envio", type: "toggle", hint: "Adicionar seguro automaticamente a todos os envios" },
        { key: "receipt", label: "Aviso de Recebimento (AR)", type: "toggle", hint: "Solicitar aviso de recebimento nos Correios" },
        { key: "own_hand", label: "Mão Própria", type: "toggle", hint: "Entregar apenas ao destinatário" },
      ]}
    />
  );
}
