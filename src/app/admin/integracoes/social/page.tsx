"use client";

import { IntegrationPage } from "@/components/admin/IntegrationPage";
import { FiGlobe } from "react-icons/fi";

export default function SocialIntegrationPage() {
  return (
    <IntegrationPage
      provider="social_media"
      title="Redes Sociais"
      description="Links e integrações com Facebook, Instagram, TikTok, YouTube e Pinterest"
      icon={<FiGlobe className="h-6 w-6 text-primary" />}
      fields={[
        { key: "facebook_page_url", label: "Facebook — URL da Página", type: "text", placeholder: "https://facebook.com/Suntecshed" },
        { key: "facebook_app_id", label: "Facebook — App ID", type: "text", placeholder: "123456789012345", hint: "App ID para login social e compartilhamento (Meta for Developers)" },
        { key: "facebook_app_secret", label: "Facebook — App Secret", type: "password", placeholder: "Secret do App" },
        { key: "instagram_url", label: "Instagram — URL do Perfil", type: "text", placeholder: "https://instagram.com/Suntecshed" },
        { key: "instagram_access_token", label: "Instagram — Access Token (Graph API)", type: "password", placeholder: "Token para feed do Instagram na loja", hint: "Token de longa duração para exibir feed de fotos do Instagram no site" },
        { key: "instagram_business_id", label: "Instagram — Business Account ID", type: "text", placeholder: "ID da conta business" },
        { key: "tiktok_url", label: "TikTok — URL do Perfil", type: "text", placeholder: "https://tiktok.com/@Suntecshed" },
        { key: "youtube_url", label: "YouTube — URL do Canal", type: "text", placeholder: "https://youtube.com/@Suntecshed" },
        { key: "pinterest_url", label: "Pinterest — URL do Perfil", type: "text", placeholder: "https://pinterest.com/Suntecshed" },
        { key: "pinterest_tag_id", label: "Pinterest Tag ID", type: "text", placeholder: "XXXXXXXXXXXXXXX", hint: "Para rastreamento de conversões no Pinterest" },
        { key: "pinterest_tag_enabled", label: "Ativar Pinterest Tag", type: "toggle" },
        { key: "twitter_url", label: "Twitter/X — URL", type: "text", placeholder: "https://x.com/Suntecshedenx" },
        { key: "show_social_in_footer", label: "Exibir redes sociais no rodapé", type: "toggle", hint: "Mostrar ícones com links das redes sociais no footer do site" },
        { key: "show_instagram_feed", label: "Exibir feed do Instagram na Home", type: "toggle", hint: "Mostrar últimas fotos do Instagram na página inicial" },
        { key: "instagram_feed_count", label: "Quantidade de fotos no feed", type: "select", options: [
          { value: "4", label: "4 fotos" }, { value: "6", label: "6 fotos" },
          { value: "8", label: "8 fotos" }, { value: "12", label: "12 fotos" },
        ]},
      ]}
    />
  );
}
