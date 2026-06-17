// Draft inicial: el usuario elige 11 jugadores de una pool con tensión, y el
// resto (hasta 26) se autocompleta garantizando >=2 jugadores por posición base.
// Regla de equilibrio: el equipo NO debe llenarse de estrellas (máx. 2 cracks).

import { PLAYER_SEEDS } from "@/data/players";
import type { CareerState, Player, Position } from "../types";
import { POSITIONS } from "../types";
import { playerFromSeed, proceduralPlayer } from "./factory";
import { positionGroup } from "./ratings";
import { RNG, shuffle, uid } from "./rng";

export const CRACK_THRESHOLD = 86;
export const MAX_CRACKS = 2;
export const SQUAD_SIZE = 26;
export const MANUAL_PICKS = 11;

// Construye la pool del draft: mezcla de jugadores reales (dataset) cubriendo
// todas las posiciones, con tensión (no se pueden tener todas las estrellas).
export function generateDraftPool(rng: RNG): Player[] {
  const pool: Player[] = [];
  // Garantizamos variedad por posición: incluimos varios de cada grupo.
  const seeds = shuffle(rng, PLAYER_SEEDS);
  for (const seed of seeds) {
    pool.push(playerFromSeed(seed, rng));
  }
  return pool;
}

// Verifica que la selección manual del usuario respeta el cap de cracks.
export function validateManualPicks(picks: Player[]): { ok: boolean; reason?: string } {
  if (picks.length > MANUAL_PICKS) {
    return { ok: false, reason: `Solo puedes elegir ${MANUAL_PICKS} jugadores manualmente.` };
  }
  const cracks = picks.filter((p) => p.overall >= CRACK_THRESHOLD).length;
  if (cracks > MAX_CRACKS) {
    return {
      ok: false,
      reason: `Demasiadas estrellas: máximo ${MAX_CRACKS} cracks (media ≥ ${CRACK_THRESHOLD}). Construye un equipo equilibrado.`,
    };
  }
  return { ok: true };
}

function countByPosition(players: Player[]): Record<Position, number> {
  const counts = {} as Record<Position, number>;
  for (const pos of POSITIONS) counts[pos] = 0;
  for (const p of players) counts[p.position] = (counts[p.position] ?? 0) + 1;
  return counts;
}

// Autocompleta la plantilla hasta 26 desde la pool restante + procedurales,
// asegurando mínimo 2 por posición base y respetando el equilibrio de cracks.
export function autoCompleteSquad(
  manual: Player[],
  pool: Player[],
  baseCountry: string,
  flag: string,
  rng: RNG,
): Player[] {
  const squad: Player[] = [...manual];
  const chosenIds = new Set(squad.map((p) => p.id));
  const remaining = shuffle(rng, pool.filter((p) => !chosenIds.has(p.id)));

  const cracksUsed = () => squad.filter((p) => p.overall >= CRACK_THRESHOLD).length;

  const takeFromPool = (pred: (p: Player) => boolean): Player | undefined => {
    const idx = remaining.findIndex(
      (p) => pred(p) && (p.overall < CRACK_THRESHOLD || cracksUsed() < MAX_CRACKS),
    );
    if (idx === -1) return undefined;
    const [p] = remaining.splice(idx, 1);
    chosenIds.add(p.id);
    return p;
  };

  // 1) Cubrir mínimo 2 por posición base.
  for (const pos of POSITIONS) {
    while (countByPosition(squad)[pos] < 2 && squad.length < SQUAD_SIZE) {
      let p =
        takeFromPool((c) => c.position === pos) ??
        takeFromPool((c) => c.secondaryPositions.includes(pos));
      if (!p) {
        // genera un jugador normalito procedural para esa posición
        p = proceduralPlayer(pos, 2 + Math.floor(rng() * 2), baseCountry, flag, rng);
      }
      squad.push(p);
    }
  }

  // 2) Rellenar hasta 26 con jugadores normales (preferimos no-cracks).
  while (squad.length < SQUAD_SIZE) {
    let p = takeFromPool((c) => c.overall < CRACK_THRESHOLD);
    if (!p) {
      const pos = POSITIONS[Math.floor(rng() * POSITIONS.length)];
      p = proceduralPlayer(pos, 2 + Math.floor(rng() * 2), baseCountry, flag, rng);
    }
    squad.push(p);
  }

  return squad.slice(0, SQUAD_SIZE);
}

// Genera un once inicial razonable a partir de la plantilla y una formación.
export function autoLineup(squad: Player[], formationSlots: Position[]): string[] {
  const available = [...squad];
  const lineup: string[] = [];
  const used = new Set<string>();

  for (const slot of formationSlots) {
    // mejor jugador disponible para el slot (posición exacta > secundaria > grupo)
    const candidates = available
      .filter((p) => !used.has(p.id) && p.injuredDays === 0)
      .map((p) => {
        let fit = 0;
        if (p.position === slot) fit = 3;
        else if (p.secondaryPositions.includes(slot)) fit = 2;
        else if (positionGroup(p.position) === positionGroup(slot)) fit = 1;
        return { p, score: fit * 100 + p.overall };
      })
      .sort((a, b) => b.score - a.score);
    const chosen = candidates[0]?.p;
    if (chosen) {
      lineup.push(chosen.id);
      used.add(chosen.id);
    }
  }
  return lineup;
}

// Marca la pool/picks dentro del estado para la UI.
export function initDraft(state: CareerState, rng: RNG): Player[] {
  const pool = generateDraftPool(rng);
  for (const p of pool) state.players[p.id] = p;
  state.draftPool = pool.map((p) => p.id);
  state.draftPicks = [];
  state.draftPicksNeeded = MANUAL_PICKS;
  return pool;
}

export { uid };
