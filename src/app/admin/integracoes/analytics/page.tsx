"use client";

import { IntegrationPage } from "@/components/admin/IntegrationPage";
import { FiBarChart2 } from "react-icons/fi";

export default function AnalyticsIntegrationPage() {
  return (
    <IntegrationPage
      provider="google_analytics"
      title="Analytics & Tags"
      description="Google Analytics, Tag Manager, Adsense, Facebook Pixel e conversões"
      icon={<FiBarChart2 className="h-6 w-6 text-primary" />}
      docsUrl="https://support.google.com/analytics"
      fields={[
        { key: "ga_measurement_id", label: "Google Analytics — Measurement ID", type: "text", placeholder: "G-XXXXXXXXXX", required: true, hint: "ID de mensuração do GA4. Ex: G-AB12CD34EF" },
        { key: "ga_enabled", label: "Ativar Google Analytics", type: "toggle" },
        { key: "gtm_container_id", label: "Google Tag Manager — Container ID", type: "text", placeholder: "GTM-XXXXXXX", hint: "ID do container GTM. Ex: GTM-ABC1234" },
        { key: "gtm_enabled", label: "Ativar GTM", type: "toggle" },
        { key: "adsense_client_id", label: "Google AdSense — Client ID", type: "text", placeholder: "ca-pub-XXXXXXXXXXXXXXXX", hint: "ID do editor AdSense. Ex: ca-pub-1234567890123456" },
        { key: "adsense_enabled", label: "Ativar AdSense", type: "toggle" },
        { key: "fb_pixel_id", label: "Facebook Pixel ID", type: "text", placeholder: "123456789012345", required: true, hint: "ID do Pixel encontrado no Meta Events Manager" },
        { key: "fb_pixel_enabled", label: "Ativar Facebook Pixel", type: "toggle" },
        { key: "fb_conversions_api_token", label: "Facebook Conversions API Token", type: "password", placeholder: "EAAxxxxxxx...", hint: "Token de acesso para Conversions API (server-side)" },
        { key: "fb_test_event_code", label: "Facebook Test Event Code", type: "text", placeholder: "TEST12345", hint: "Código de teste para validar eventos (remova em produção)" },
        { key: "ig_pixel_enabled", label: "Instagram Shopping Pixel", type: "toggle", hint: "Usa o mesmo Pixel do Facebook para rastrear compras no Instagram" },
        { key: "google_ads_conversion_id", label: "Google Ads — Conversion ID", type: "text", placeholder: "AW-XXXXXXXXX", hint: "ID de conversão do Google Ads" },
        { key: "google_ads_conversion_label", label: "Google Ads — Conversion Label", type: "text", placeholder: "xxxxxxxxx", hint: "Label de conversão para rastreamento de compras" },
        { key: "google_ads_enabled", label: "Ativar Google Ads Conversion", type: "toggle" },
        { key: "tiktok_pixel_id", label: "TikTok Pixel ID", type: "text", placeholder: "XXXXXXXXXXXXXXXX", hint: "ID do Pixel TikTok (opcional)" },
        { key: "tiktok_pixel_enabled", label: "Ativar TikTok Pixel", type: "toggle" },
        { key: "custom_head_scripts", label: "Scripts Personalizados (<head>)", type: "textarea", placeholder: "<!-- Cole scripts adicionais aqui -->", hint: "Scripts injetados no <head> de todas as páginas. Ex: chat widget, outros pixels" },
        { key: "custom_body_scripts", label: "Scripts Personalizados (<body>)", type: "textarea", placeholder: "<!-- Cole scripts adicionais aqui -->", hint: "Scripts injetados antes do fechamento do </body>" },
      ]}
    />
  );
}
