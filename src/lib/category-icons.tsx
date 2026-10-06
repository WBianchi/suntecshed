import type { IconType } from "react-icons";
import {
  FiTrendingUp, FiHeart, FiZap, FiHome, FiSmartphone, FiCamera, FiTag,
  FiTool, FiHeadphones, FiXCircle, FiMonitor, FiStar, FiPlayCircle,
  FiBook, FiGrid, FiPercent, FiClock, FiSun, FiWind,
} from "react-icons/fi";
import { FaMugHot, FaLightbulb, FaPalette, FaFutbol, FaGamepad, FaSprayCan } from "react-icons/fa";
import { FaScissors } from "react-icons/fa6";
import { GiToyMallet, GiFishingPole } from "react-icons/gi";
import { BsSpeaker } from "react-icons/bs";

const ICON_BY_SLUG: Record<string, IconType> = {
  "anuncios-em-massa": FiTrendingUp,
  "beleza-e-cuidado-pessoal": FaSprayCan,
  "brinquedos": GiToyMallet,
  "caixas-de-som": BsSpeaker,
  "cabos": FiZap, // Carregadores & Power Banks
  "casa-e-decoracao": FiHome, // Casa e Utensílios Domésticos
  "celulares-e-smartphones": FiSmartphone,
  "copa-do-mundo": FaFutbol,
  "cameras": FiCamera,
  "embalagens-e-etiquetas": FiTag,
  "ferramentas": FiTool,
  "fones-de-ouvido": FiHeadphones,
  "fora-de-estoque": FiXCircle,
  "games": FaGamepad,
  "garrafas-copos-canecas": FaMugHot,
  "iluminacao": FaLightbulb,
  "informatica": FiMonitor,
  "produtos-mais-vendidos": FiStar,
  "maquiagem": FaPalette,
  "materiais-de-pesca": GiFishingPole,
  "media-streaming": FiPlayCircle,
  "papelaria": FiBook,
  "produtos-diversos": FiGrid,
  "promocoes-do-mes": FiPercent,
  "relogios-e-smartwatchs": FiClock,
  "ring-light": FiSun,
  "barbearia": FaScissors, // Salão & Barbearia
  "umidificadores-de-ar": FiWind,
};

export function getCategoryIcon(slug: string): IconType {
  return ICON_BY_SLUG[slug] || FiGrid;
}
