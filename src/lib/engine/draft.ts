// Draft (nuevo formato): el usuario NO elige a quien quiera.
//   - Se le ofrecen 3 capitanes (media >=90) y elige 1.
//   - Se le ofrecen varias estrellas (media 85-89) y elige 1.
//   - El resto de la plantilla (hasta 26) se autocompleta con jugadores de
//     media 67-84, garantizando >=2 por posición base.
// Los jugadores fichados "defeccionan" de su selección real (universo alterno).

import type { CareerState, Player, Position } from "../types";
import { POSITIONS } from "../types";
import { positionGroup } from "./ratings";
import { RNG, shuffle } from "./rng";

export const SQUAD_SIZE = 26;
export const CAPTAIN_MIN = 90;
export const STAR_MIN = 85;
export const STAR_MAX = 89;
export const FILLER_MIN = 67;
export const FILLER_MAX = 84;
export const CAPTAIN_OPTIONS = 3;
export const STAR_OPTIONS = 6;

// Genera un once inicial razonable a partir de la plantilla y una formación.
export function autoLineup(squad: Player[], formationSlots: Position[]): string[] {
  const used = new Set<string>();
  const lineup: string[] = [];
  for (const slot of formationSlots) {
    const candidates = squad
      .filter((p) => p && !used.has(p.id) && p.injuredDays === 0)
      .map((p) => {
        let fit = 0;
        if (p.position === slot) fit = 3;
        else if (p.secondaryPositions.includes(slot)) fit = 2;
        else if (positionGroup(p.position) === positionGroup(slot)) fit = 1;
        return { p, score: fit * 100 + p.overall };
      })
      .sort((a, b) => b.score - a.score);
    const chosen = candidates[0]?.p;
    if (chosen) { lineup.push(chosen.id); used.add(chosen.id); }
  }
  return lineup;
}

function countByPosition(players: Player[]): Record<Position, number> {
  const counts = {} as Record<Position, number>;
  for (const pos of POSITIONS) counts[pos] = 0;
  for (const p of players) counts[p.position] = (counts[p.position] ?? 0) + 1;
  return counts;
}

// Prepara las opciones de draft a partir de todos los jugadores reales del mundo.
export function initDraft(state: CareerState, rng: RNG): void {
  const all = Object.values(state.players);
  const caps = shuffle(rng, all.filter((p) => p.overall >= CAPTAIN_MIN));
  const stars = shuffle(rng, all.filter((p) => p.overall >= STAR_MIN && p.overall <= STAR_MAX));
  state.draftCaptainOptions = caps.slice(0, CAPTAIN_OPTIONS).map((p) => p.id);
  state.draftStarOptions = stars.slice(0, STAR_OPTIONS).map((p) => p.id);
  state.draftCaptainPick = null;
  state.draftStarPick = null;
}

// Selecciona, de forma determinista por posición, los 24 jugadores de relleno
// (media 67-84) garantizando >=2 por posición base. `defectFn` saca a cada
// fichado de su selección de origen.
export function assembleFillers(
  state: CareerState,
  current: Player[],
  rng: RNG,
  defectFn: (id: string) => void,
): Player[] {
  const squad = [...current];
  const taken = new Set(squad.map((p) => p.id));
  const pool = shuffle(
    rng,
    Object.values(state.players).filter(
      (p) => !taken.has(p.id) && p.overall >= FILLER_MIN && p.overall <= FILLER_MAX,
    ),
  );

  const take = (pred: (p: Player) => boolean): Player | undefined => {
    const idx = pool.findIndex(pred);
    if (idx === -1) return undefined;
    const [p] = pool.splice(idx, 1);
    taken.add(p.id);
    defectFn(p.id);
    return p;
  };

  // 1) cobertura mínima de 2 por posición
  for (const pos of POSITIONS) {
    while (countByPosition(squad)[pos] < 2 && squad.length < SQUAD_SIZE) {
      const p =
        take((c) => c.position === pos) ??
        take((c) => c.secondaryPositions.includes(pos)) ??
        take((c) => positionGroup(c.position) === positionGroup(pos));
      if (!p) break;
      squad.push(p);
    }
  }
  // 2) completar hasta 26
  while (squad.length < SQUAD_SIZE) {
    const p = take(() => true);
    if (!p) break;
    squad.push(p);
  }
  return squad;
}
