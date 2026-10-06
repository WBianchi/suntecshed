import {
  FiGrid, FiShoppingCart, FiTag, FiUsers, FiSend,
  FiTool, FiBarChart2, FiSettings, FiBox, FiList,
  FiPercent, FiUserCheck, FiMail, FiMessageSquare,
  FiSmartphone, FiImage, FiFileText, FiTruck,
  FiDollarSign, FiPieChart, FiTrendingUp, FiShoppingBag, FiSliders,
  FiLock, FiDatabase, FiLayers, FiLayout, FiMenu, FiSearch,
  FiVideo,
} from "react-icons/fi";

export interface AdminSubItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface AdminMenuItem {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: AdminSubItem[];
}

// Fonte única do menu admin — usado pela sidebar (/admin) e pelo dropdown
// de perfil no header, pra nunca ficarem dessincronizados.
export const adminMenuItems: AdminMenuItem[] = [
  { label: "Visão Geral", href: "/admin", icon: FiGrid },
  { label: "Vendas", href: "/admin/vendas/pedidos", icon: FiShoppingCart },
  { label: "Carrinho Abandonado", href: "/admin/vendas/abandonados", icon: FiShoppingBag },
  { label: "Frete", href: "/admin/frete", icon: FiTruck },
  { label: "Recargas", href: "/admin/recargas", icon: FiDollarSign },
  {
    label: "Produtos",
    icon: FiBox,
    children: [
      { label: "Todos os Produtos", href: "/admin/produtos", icon: FiList },
      { label: "Marcas", href: "/admin/produtos/marcas", icon: FiTag },
      { label: "Estoque", href: "/admin/produtos/estoque", icon: FiDatabase },
    ],
  },
  { label: "Avaliações", href: "/admin/avaliacoes", icon: FiMessageSquare },
  {
    label: "Cupons",
    icon: FiTag,
    children: [
      { label: "Todos os Cupons", href: "/admin/cupons", icon: FiPercent },
    ],
  },
  {
    label: "Clientes",
    icon: FiUsers,
    children: [
      { label: "Todos os Clientes", href: "/admin/clientes", icon: FiUserCheck },
    ],
  },
  {
    label: "Disparos",
    icon: FiSend,
    children: [
      { label: "E-mail Marketing", href: "/admin/disparos/email", icon: FiMail },
      { label: "WhatsApp", href: "/admin/disparos/whatsapp", icon: FiMessageSquare },
      { label: "Push / SMS", href: "/admin/disparos/push", icon: FiSmartphone },
    ],
  },
  { label: "Treinamento", href: "/admin/treinamento", icon: FiVideo },
  {
    label: "Ferramentas",
    icon: FiTool,
    children: [
      { label: "Categorias Home", href: "/admin/ferramentas/categorias-home", icon: FiLayers },
      { label: "Banners", href: "/admin/ferramentas/banners", icon: FiImage },
      { label: "Cabeçalho", href: "/admin/ferramentas/cabecalho", icon: FiMenu },
      { label: "Rodapé", href: "/admin/ferramentas/rodape", icon: FiLayout },
      { label: "Blog", href: "/admin/ferramentas/blog", icon: FiFileText },
      { label: "SEO", href: "/admin/ferramentas/seo", icon: FiSearch },
    ],
  },
  {
    label: "Relatórios",
    icon: FiBarChart2,
    children: [
      { label: "Visão Geral", href: "/admin/relatorios", icon: FiTrendingUp },
      { label: "Vendas", href: "/admin/relatorios/vendas", icon: FiDollarSign },
      { label: "Produtos", href: "/admin/relatorios/produtos", icon: FiPieChart },
      { label: "Clientes", href: "/admin/relatorios/clientes", icon: FiUsers },
    ],
  },
  {
    label: "Configurações",
    icon: FiSettings,
    children: [
      { label: "Loja", href: "/admin/configuracoes/loja", icon: FiSliders },
      { label: "Segurança", href: "/admin/configuracoes/seguranca", icon: FiLock },
    ],
  },
];

export type AdminMenuEntry =
  | { type: "link"; label: string; href: string; icon: React.ComponentType<{ className?: string }> }
  | { type: "heading"; label: string };

// Achata adminMenuItems num array pronto pra listar num dropdown (sem os
// grupos expansíveis da sidebar): grupos viram um título pequeno seguido
// dos filhos, itens diretos viram link.
export function flattenAdminMenu(): AdminMenuEntry[] {
  return adminMenuItems.flatMap((item): AdminMenuEntry[] => {
    if (item.href) return [{ type: "link", label: item.label, href: item.href, icon: item.icon }];
    if (item.children) {
      return [
        { type: "heading", label: item.label },
        ...item.children.map((child): AdminMenuEntry => ({ type: "link", label: child.label, href: child.href, icon: child.icon })),
      ];
    }
    return [];
  });
}
