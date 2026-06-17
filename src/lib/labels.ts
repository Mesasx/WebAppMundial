// Etiquetas y utilidades compartidas para la UI.
import type { Position, Trait } from "./types";

export const POSITION_LABELS: Record<Position, string> = {
  POR: "Portero",
  LD: "Lateral Der.",
  DFC: "Central",
  LI: "Lateral Izq.",
  MCD: "Mediocentro Def.",
  MC: "Mediocentro",
  MCO: "Mediapunta",
  ED: "Extremo Der.",
  EI: "Extremo Izq.",
  DC: "Delantero",
  SD: "Segundo Delantero",
};

export const PLAYSTYLE_LABELS: Record<string, string> = {
  posesion: "Posesión",
  contraataque: "Contraataque",
  presion_alta: "Presión alta",
  bloque_bajo: "Bloque bajo",
  juego_fisico: "Juego físico",
  juego_directo: "Juego directo",
  bandas: "Juego por bandas",
  estrellas: "Estrellas individuales",
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Fácil",
  normal: "Normal",
  hard: "Difícil",
  realistic: "Realista",
  chaos: "Caótico",
};

export const RECRUIT_DIFF_LABELS: Record<string, { label: string; color: string }> = {
  facil: { label: "Fácil", color: "bg-pitch-500/20 text-pitch-400" },
  media: { label: "Media", color: "bg-accent-info/20 text-accent-info" },
  dificil: { label: "Difícil", color: "bg-accent-amber/20 text-accent-amber" },
  muy_dificil: { label: "Muy difícil", color: "bg-orange-500/20 text-orange-400" },
  casi_imposible: { label: "Casi imposible", color: "bg-accent-danger/20 text-accent-danger" },
};

export const TRAIT_COLORS: Record<Trait, string> = {
  Leyenda: "bg-accent-gold/25 text-accent-gold",
  Promesa: "bg-pitch-500/20 text-pitch-400",
  Líder: "bg-accent-info/20 text-accent-info",
  Frágil: "bg-accent-danger/20 text-accent-danger",
  Revulsivo: "bg-purple-500/20 text-purple-300",
  Killer: "bg-red-500/20 text-red-300",
  Muro: "bg-slate-400/20 text-slate-200",
  Cerebro: "bg-cyan-500/20 text-cyan-300",
  Velocista: "bg-yellow-400/20 text-yellow-300",
  Irregular: "bg-orange-500/20 text-orange-300",
  Clutch: "bg-emerald-500/20 text-emerald-300",
  Conflictivo: "bg-rose-500/20 text-rose-300",
  Profesional: "bg-blue-400/20 text-blue-200",
  "Capitán natural": "bg-accent-gold/20 text-accent-gold",
};

export function ratingColor(ovr: number): string {
  if (ovr >= 88) return "text-accent-gold";
  if (ovr >= 82) return "text-pitch-400";
  if (ovr >= 76) return "text-accent-info";
  if (ovr >= 70) return "text-slate-200";
  return "text-slate-400";
}

export function barColor(v: number): string {
  if (v >= 75) return "bg-pitch-500";
  if (v >= 50) return "bg-accent-amber";
  return "bg-accent-danger";
}
