// Mapa de nomes de cor (PT-BR, como cadastrados no catálogo) pro gradiente
// exibido no seletor de variação — normaliza acentos/caixa antes de buscar.
const COLOR_GRADIENTS: Record<string, string> = {
  "azul": "linear-gradient(135deg, #60a5fa, #1d4ed8)",
  "azul bebe": "linear-gradient(135deg, #dbeafe, #60a5fa)",
  "azul marinho": "linear-gradient(135deg, #1e3a8a, #0f172a)",
  "azul escuro": "linear-gradient(135deg, #1e40af, #172554)",
  "azul ciano": "linear-gradient(135deg, #67e8f9, #0891b2)",
  "vermelho": "linear-gradient(135deg, #f87171, #b91c1c)",
  "preto": "linear-gradient(135deg, #4b5563, #0f172a)",
  "branco": "linear-gradient(135deg, #ffffff, #e5e7eb)",
  "rosa": "linear-gradient(135deg, #f9a8d4, #db2777)",
  "roxo": "linear-gradient(135deg, #c084fc, #7c3aed)",
  "lilas": "linear-gradient(135deg, #ddd6fe, #a78bfa)",
  "verde": "linear-gradient(135deg, #4ade80, #15803d)",
  "amarelo": "linear-gradient(135deg, #fde047, #ca8a04)",
  "laranja": "linear-gradient(135deg, #fb923c, #c2410c)",
  "marrom": "linear-gradient(135deg, #a16207, #78350f)",
  "madeira": "linear-gradient(135deg, #b45309, #78350f)",
  "dourado": "linear-gradient(135deg, #fde68a, #b45309)",
  "prata": "linear-gradient(135deg, #f1f5f9, #94a3b8)",
  "cinza": "linear-gradient(135deg, #d1d5db, #6b7280)",
  "rose gold": "linear-gradient(135deg, #fecdd3, #fb7185)",
  "colorido": "linear-gradient(135deg, #f87171, #fde047, #4ade80, #60a5fa, #c084fc)",
};

const LIGHT_COLORS = new Set(["branco", "prata", "amarelo", "dourado"]);

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[-_]/g, " ")
    .trim();
}

export function getColorGradient(name: string): string {
  const key = normalize(name);
  if (COLOR_GRADIENTS[key]) return COLOR_GRADIENTS[key];

  // Nomes compostos (ex: "Preto com Laranja") — combina os dois tons num gradiente só.
  const parts = key.split(/\s+com\s+|\s*\/\s*/).map((p) => p.trim()).filter(Boolean);
  if (parts.length > 1) {
    const stops = parts
      .map((p) => COLOR_GRADIENTS[p]?.match(/#[0-9a-f]{3,6}/gi)?.[0])
      .filter(Boolean);
    if (stops.length > 1) return `linear-gradient(135deg, ${stops.join(", ")})`;
  }

  return "linear-gradient(135deg, #d1d5db, #9ca3af)";
}

export function isLightColor(name: string): boolean {
  return LIGHT_COLORS.has(normalize(name).split(/\s+com\s+/)[0]);
}
