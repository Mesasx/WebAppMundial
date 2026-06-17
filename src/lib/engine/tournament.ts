// Estructura del torneo: 48 selecciones, 12 grupos de 4, fase de grupos
// (round-robin) y eliminatoria desde dieciseisavos (R32). Clasifican los 2
// primeros de cada grupo + los 8 mejores terceros.
//
// El cuadro de eliminatorias usa un sembrado por rendimiento (simplificación
// documentada del cuadro oficial): los clasificados se ordenan por puntos/DG/GF
// y se emparejan seed[i] vs seed[31-i], avanzando por parejas. Es coherente y
// mantiene el formato escalable a 48 equipos.

import type {
  CareerState,
  Group,
  KnockoutTie,
  MatchResult,
  Team,
} from "../types";
import { RNG, shuffle, uid } from "./rng";

const GROUP_IDS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

// Reparte equipos en 12 grupos respetando bombos (1 por grupo y bombo).
export function buildGroups(teamIds: string[], teams: Record<string, Team>, rng: RNG): Group[] {
  const byPot: Record<number, string[]> = { 1: [], 2: [], 3: [], 4: [] };
  // Aproximamos el bombo por rating del equipo.
  const sorted = [...teamIds].sort((a, b) => teams[b].rating - teams[a].rating);
  sorted.forEach((id, idx) => {
    const pot = (Math.floor(idx / 12) + 1) as 1 | 2 | 3 | 4;
    byPot[pot].push(id);
  });
  const groups: Group[] = GROUP_IDS.map((id) => ({ id, teamIds: [] }));
  for (const pot of [1, 2, 3, 4]) {
    const shuffled = shuffle(rng, byPot[pot]);
    shuffled.forEach((id, idx) => {
      groups[idx % 12].teamIds.push(id);
      teams[id].groupId = groups[idx % 12].id;
    });
  }
  return groups;
}

// Genera los 72 partidos de la fase de grupos (3 jornadas).
export function buildGroupFixtures(groups: Group[]): MatchResult[] {
  const matches: MatchResult[] = [];
  const pairings = [
    [0, 1, 2, 3], // J1: 0-1, 2-3
    [0, 2, 1, 3], // J2: 0-2, 1-3
    [0, 3, 1, 2], // J3: 0-3, 1-2
  ];
  groups.forEach((g) => {
    pairings.forEach((pp, j) => {
      const [a, b, c, d] = pp;
      matches.push(emptyMatch(`Grupo ${g.id} · J${j + 1}`, g.teamIds[a], g.teamIds[b], g.id));
      matches.push(emptyMatch(`Grupo ${g.id} · J${j + 1}`, g.teamIds[c], g.teamIds[d], g.id));
    });
  });
  return matches;
}

function emptyMatch(round: string, home: string, away: string, groupId?: string): MatchResult {
  return {
    id: uid("m"),
    round,
    groupId,
    homeTeamId: home,
    awayTeamId: away,
    homeGoals: 0,
    awayGoals: 0,
    extraTime: false,
    penaltyShootout: false,
    events: [],
    involvesUser: false,
    played: false,
  };
}

export interface StandingRow {
  teamId: string;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
}

export function computeStandings(groupId: string, state: CareerState): StandingRow[] {
  const group = state.groups.find((g) => g.id === groupId);
  if (!group) return [];
  const rows: Record<string, StandingRow> = {};
  for (const id of group.teamIds) {
    rows[id] = { teamId: id, points: 0, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0 };
  }
  for (const m of state.matches) {
    if (m.groupId !== groupId || !m.played) continue;
    const h = rows[m.homeTeamId];
    const a = rows[m.awayTeamId];
    if (!h || !a) continue;
    h.played++; a.played++;
    h.gf += m.homeGoals; h.ga += m.awayGoals;
    a.gf += m.awayGoals; a.ga += m.homeGoals;
    if (m.homeGoals > m.awayGoals) { h.won++; h.points += 3; a.lost++; }
    else if (m.homeGoals < m.awayGoals) { a.won++; a.points += 3; h.lost++; }
    else { h.drawn++; a.drawn++; h.points++; a.points++; }
  }
  return Object.values(rows)
    .map((r) => ({ ...r, gd: r.gf - r.ga }))
    .sort(sortStanding);
}

function sortStanding(a: StandingRow, b: StandingRow): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.gd !== a.gd) return b.gd - a.gd;
  if (b.gf !== a.gf) return b.gf - a.gf;
  return 0;
}

export function groupStageComplete(state: CareerState): boolean {
  return state.matches.filter((m) => m.groupId).every((m) => m.played);
}

// Calcula los 32 clasificados (2 primeros + 8 mejores terceros) y construye R32.
export function buildKnockout(state: CareerState, rng: RNG): KnockoutTie[] {
  const firsts: StandingRow[] = [];
  const seconds: StandingRow[] = [];
  const thirds: StandingRow[] = [];
  for (const g of state.groups) {
    const s = computeStandings(g.id, state);
    if (s[0]) firsts.push(s[0]);
    if (s[1]) seconds.push(s[1]);
    if (s[2]) thirds.push(s[2]);
  }
  thirds.sort(sortStanding);
  const bestThirds = thirds.slice(0, 8);
  const qualifiedRows = [...firsts, ...seconds, ...bestThirds].sort(sortStanding);
  const seeds = qualifiedRows.map((r) => r.teamId);

  // Marca eliminados (terceros peores y todos los cuartos).
  const qualifiedSet = new Set(seeds);
  for (const id of Object.keys(state.teams)) {
    if (!qualifiedSet.has(id)) state.teams[id].eliminated = true;
  }

  const ties: KnockoutTie[] = [];
  for (let i = 0; i < 16; i++) {
    ties.push({
      id: uid("ko"),
      round: "32",
      matchId: null,
      homeTeamId: seeds[i],
      awayTeamId: seeds[31 - i],
      winnerId: null,
      homeRef: `S${i + 1}`,
      awayRef: `S${32 - i}`,
    });
  }
  // Rondas posteriores vacías, se rellenan al avanzar.
  addEmptyRound(ties, "16", 8);
  addEmptyRound(ties, "QF", 4);
  addEmptyRound(ties, "SF", 2);
  addEmptyRound(ties, "3rd", 1);
  addEmptyRound(ties, "F", 1);
  return ties;
}

function addEmptyRound(ties: KnockoutTie[], round: KnockoutTie["round"], count: number) {
  for (let i = 0; i < count; i++) {
    ties.push({
      id: uid("ko"),
      round,
      matchId: null,
      homeTeamId: null,
      awayTeamId: null,
      winnerId: null,
      homeRef: "",
      awayRef: "",
    });
  }
}

export const KO_ORDER: KnockoutTie["round"][] = ["32", "16", "QF", "SF", "F"];

export function roundLabel(round: KnockoutTie["round"]): string {
  return {
    "32": "Dieciseisavos",
    "16": "Octavos",
    QF: "Cuartos",
    SF: "Semifinal",
    F: "Final",
    "3rd": "Tercer puesto",
  }[round];
}

// Tras completar una ronda, propaga ganadores a la siguiente.
export function propagateKnockout(state: CareerState): void {
  const ties = state.knockout;
  const byRound = (r: KnockoutTie["round"]) => ties.filter((t) => t.round === r);

  for (let ri = 0; ri < KO_ORDER.length - 1; ri++) {
    const cur = byRound(KO_ORDER[ri]);
    const next = byRound(KO_ORDER[ri + 1]);
    cur.forEach((tie, idx) => {
      if (!tie.winnerId) return;
      const target = next[Math.floor(idx / 2)];
      if (!target) return;
      if (idx % 2 === 0) {
        target.homeTeamId = tie.winnerId;
        target.homeRef = `Ganador ${roundLabel(tie.round)} ${idx + 1}`;
      } else {
        target.awayTeamId = tie.winnerId;
        target.awayRef = `Ganador ${roundLabel(tie.round)} ${idx + 1}`;
      }
    });
  }

  // Tercer puesto: perdedores de semis.
  const sf = byRound("SF");
  const third = byRound("3rd")[0];
  if (third && sf.every((t) => t.winnerId)) {
    const losers = sf
      .map((t) => (t.winnerId === t.homeTeamId ? t.awayTeamId : t.homeTeamId))
      .filter(Boolean) as string[];
    third.homeTeamId = losers[0] ?? null;
    third.awayTeamId = losers[1] ?? null;
  }
}
