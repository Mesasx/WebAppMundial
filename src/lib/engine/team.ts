// Cálculo de fuerzas de equipo a partir del once, formación, táctica, química y
// moral. Documentado y fácil de ajustar.

import type { Player, Playstyle, Team } from "../types";
import { effectiveOverall, positionGroup } from "./ratings";

export interface TeamStrength {
  attack: number;
  defense: number;
  midfield: number;
  goalkeeping: number;
  overall: number;
}

// Pesos por zona y bonus/penalización táctica.
const PLAYSTYLE_MODS: Record<Playstyle, { att: number; def: number; mid: number }> = {
  posesion: { att: 1, def: 1, mid: 4 },
  contraataque: { att: 4, def: 2, mid: -2 },
  presion_alta: { att: 3, def: -2, mid: 2 },
  bloque_bajo: { att: -3, def: 5, mid: 0 },
  juego_fisico: { att: 1, def: 3, mid: 1 },
  juego_directo: { att: 3, def: 0, mid: -2 },
  bandas: { att: 3, def: 0, mid: 0 },
  estrellas: { att: 2, def: -1, mid: 1 },
};

function avg(nums: number[]): number {
  if (nums.length === 0) return 60;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function computeTeamStrength(
  team: Team,
  players: Record<string, Player>,
): TeamStrength {
  const lineup = team.lineup
    .map((id) => players[id])
    .filter((p): p is Player => Boolean(p));

  const gkRatings: number[] = [];
  const defRatings: number[] = [];
  const midRatings: number[] = [];
  const attRatings: number[] = [];

  for (const p of lineup) {
    const eff = effectiveOverall(p);
    const g = positionGroup(p.position);
    if (g === "GK") gkRatings.push(eff);
    else if (g === "DEF") defRatings.push(eff);
    else if (g === "MID") midRatings.push(eff);
    else if (g === "WNG") {
      attRatings.push(eff * 0.7);
      midRatings.push(eff * 0.3);
    } else attRatings.push(eff);
  }

  const tac = PLAYSTYLE_MODS[team.playstyle];

  // Química y moral aportan modificadores LEVES (el fútbol no se decide solo
  // por esto). Química 50 = neutro; moral 70 = neutro.
  const chemMod = (team.chemistry - 50) * 0.06;  // ±~3
  const moraleMod = (avg(lineup.map((p) => p.morale)) - 70) * 0.05; // ±~1.5

  const goalkeeping = avg(gkRatings) + chemMod * 0.3;
  const defense = avg(defRatings) + tac.def + chemMod + moraleMod;
  const midfield = avg(midRatings) + tac.mid + chemMod + moraleMod;
  const attack = avg(attRatings) + tac.att + chemMod + moraleMod;

  const overall =
    goalkeeping * 0.18 + defense * 0.3 + midfield * 0.27 + attack * 0.25;

  return { attack, defense, midfield, goalkeeping, overall };
}

// Recalcula y cachea la media del equipo (para mostrar en UI).
export function teamRating(team: Team, players: Record<string, Player>): number {
  return Math.round(computeTeamStrength(team, players).overall);
}

// Química base derivada de afinidades de plantilla (simplificada): cuántos
// jugadores comparten club o nacionalidad de origen + estabilidad de moral.
export function recomputeChemistry(team: Team, players: Record<string, Player>): number {
  const squad = team.squad.map((id) => players[id]).filter(Boolean) as Player[];
  if (squad.length === 0) return 50;
  const clubCounts: Record<string, number> = {};
  const countryCounts: Record<string, number> = {};
  for (const p of squad) {
    clubCounts[p.club] = (clubCounts[p.club] ?? 0) + 1;
    countryCounts[p.originCountry] = (countryCounts[p.originCountry] ?? 0) + 1;
  }
  let bonus = 0;
  for (const c of Object.values(clubCounts)) if (c >= 2) bonus += (c - 1) * 2.5;
  for (const c of Object.values(countryCounts)) if (c >= 3) bonus += (c - 2) * 1.5;
  const avgMorale = avg(squad.map((p) => p.morale));
  const base = 42 + bonus + (avgMorale - 70) * 0.4;
  return Math.max(0, Math.min(100, Math.round(base)));
}
