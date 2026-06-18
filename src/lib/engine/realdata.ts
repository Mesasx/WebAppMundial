// Carga las convocatorias reales (src/data/squads.json) y las convierte en
// equipos y jugadores completos del motor. Las medias vienen del dataset
// (ancladas: Mbappé 95...); aquí se generan atributos, rasgos y estado dinámico.

import squadsData from "@/data/squads.json";
import { COUNTRY, countryInfo } from "@/data/countries";
import type { Foot, Personality, Player, Position, Team, Trait } from "../types";
import {
  computePotential,
  generateAttributes,
  generateTraits,
} from "./ratings";
import { autoLineup } from "./draft";
import { FORMATIONS } from "./formations";
import { recomputeChemistry, teamRating } from "./team";
import { gaussian, pick, RNG, shuffle, uid } from "./rng";

export { COUNTRY, countryInfo };

interface SquadEntry {
  pos4: "PO" | "DF" | "MC" | "DC";
  name: string;
  age: number;
  club: string;
  cc: string;
  height: number;
  caps: number;
  goals: number;
  overall: number;
}
interface SquadTeam { name: string; code: string; players: SquadEntry[]; }

const SQUADS = squadsData as unknown as SquadTeam[];
void COUNTRY; // re-exportado arriba para conveniencia

const PERSONALITIES: Personality[] = ["lider", "profesional", "ambicioso", "tranquilo", "egocentrico", "temperamental", "humilde"];

// Reparte posiciones finas dentro de una selección a partir de los 4 buckets.
function refinePositions(players: SquadEntry[]): Position[] {
  const out: Position[] = new Array(players.length);
  const idxByPos = (p4: string) => players.map((p, i) => ({ p, i })).filter((x) => x.p.pos4 === p4);

  // Porteros
  idxByPos("PO").forEach((x) => (out[x.i] = "POR"));

  // Defensas: los más altos -> DFC; el resto alterna LD/LI.
  const defs = idxByPos("DF").sort((a, b) => b.p.height - a.p.height);
  let side = 0;
  defs.forEach((x, k) => {
    if (k < Math.max(3, Math.ceil(defs.length * 0.55))) out[x.i] = "DFC";
    else { out[x.i] = side % 2 === 0 ? "LD" : "LI"; side++; }
  });
  // garantizar al menos un LD y un LI
  if (!defs.some((x) => out[x.i] === "LD") && defs[defs.length - 1]) out[defs[defs.length - 1].i] = "LD";
  if (!defs.some((x) => out[x.i] === "LI") && defs[defs.length - 2]) out[defs[defs.length - 2].i] = "LI";

  // Medios: ciclo MCD/MC/MCO (los más goleadores -> MCO).
  const mids = idxByPos("MC").sort((a, b) => b.p.goals - a.p.goals);
  const midCycle: Position[] = ["MCO", "MC", "MCD"];
  mids.forEach((x, k) => (out[x.i] = midCycle[k % 3]));

  // Delanteros (bucket DC incluye extremos): goleadores -> DC, resto ED/EI/SD.
  const atts = idxByPos("DC").sort((a, b) => b.p.goals - a.p.goals);
  const attCycle: Position[] = ["DC", "EI", "ED", "SD"];
  atts.forEach((x, k) => (out[x.i] = attCycle[k % 4]));

  // relleno por si algún bucket raro
  for (let i = 0; i < out.length; i++) if (!out[i]) out[i] = "MC";
  return out;
}

function secondaryFor(pos: Position): Position[] {
  const map: Partial<Record<Position, Position[]>> = {
    DFC: ["LD", "LI"], LD: ["DFC", "ED"], LI: ["DFC", "EI"],
    MCD: ["MC", "DFC"], MC: ["MCD", "MCO"], MCO: ["MC", "SD"],
    ED: ["EI", "SD"], EI: ["ED", "SD"], DC: ["SD"], SD: ["DC", "MCO"],
  };
  return map[pos] ?? [];
}

export function buildRealPlayer(
  e: SquadEntry, pos: Position, country: string, flag: string, rng: RNG, originTeamId?: string,
): Player {
  const overall = e.overall;
  const prestige = Math.max(20, Math.min(95, overall - 2 + Math.round((e.caps - 20) * 0.1)));
  const potential = computePotential(overall, e.age, overall >= 86 ? 5 : overall >= 80 ? 4 : 3);
  const traits = generateTraits(overall, e.age, prestige, potential, rng);
  let personality: Personality = pick(rng, PERSONALITIES);
  if (traits.includes("Capitán natural") || traits.includes("Líder")) personality = "lider";
  else if (overall >= 88) personality = rng() < 0.5 ? "ambicioso" : "lider";
  return {
    id: uid("p"),
    name: e.name,
    age: e.age,
    originCountry: country,
    originFlag: flag,
    club: e.club,
    clubLevel: Math.max(50, Math.min(95, overall)),
    position: pos,
    secondaryPositions: secondaryFor(pos),
    foot: pick<Foot>(rng, ["right", "right", "right", "left", "both"]),
    height: e.height,
    naturalRole: e.pos4 === "PO" ? "Portero" : e.pos4 === "DC" ? "Atacante" : e.pos4 === "MC" ? "Centrocampista" : "Defensa",
    overall,
    potential,
    prestige,
    form: Math.round(gaussian(rng, 72, 7)),
    morale: Math.round(gaussian(rng, 72, 6)),
    fatigue: Math.round(Math.max(0, gaussian(rng, 8, 5))),
    injuryRisk: Math.round(Math.max(3, gaussian(rng, e.age >= 32 ? 26 : 15, 7))),
    injuredDays: 0,
    personality,
    ambition: Math.round(Math.max(10, Math.min(99, gaussian(rng, 45 + prestige * 0.4, 12)))),
    loyalty: Math.round(Math.max(10, Math.min(99, gaussian(rng, 55, 14)))),
    ego: Math.round(Math.max(5, Math.min(99, gaussian(rng, 30 + prestige * 0.4, 12)))),
    persuadability: 0,
    traits,
    attributes: generateAttributes(pos, overall, rng),
    stats: { matches: 0, minutes: 0, goals: 0, assists: 0, yellow: 0, red: 0, injuries: 0, ratingSum: 0, motm: 0 },
    originTeamId,
  };
}

export interface BuiltWorld {
  teams: Record<string, Team>;
  players: Record<string, Player>;
}

// Construye las 48 selecciones reales completas.
export function buildRealWorld(rng: RNG): BuiltWorld {
  const teams: Record<string, Team> = {};
  const players: Record<string, Player> = {};
  for (const sq of SQUADS) {
    const ci = countryInfo(sq.code, sq.name);
    const teamId = uid("team");
    const fine = refinePositions(sq.players);
    const ids: string[] = [];
    sq.players.forEach((e, i) => {
      const p = buildRealPlayer(e, fine[i], ci.es, ci.flag, rng, teamId);
      players[p.id] = p;
      ids.push(p.id);
    });
    const formation = "4-3-3" as const;
    const team: Team = {
      id: teamId, name: ci.es, baseCountry: ci.es, flag: ci.flag, isUser: false,
      coachName: "Seleccionador", playstyle: pick(rng, ["posesion", "contraataque", "presion_alta", "bloque_bajo", "juego_directo", "bandas"]),
      formation, squad: ids, lineup: [], captainId: null, penaltyTakerId: null,
      freekickTakerId: null, cornerTakerId: null, chemistry: 70, rating: 0,
      points: 0, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, eliminated: false,
    };
    team.lineup = autoLineup(ids.map((id) => players[id]), FORMATIONS[formation]);
    const best = [...ids].map((id) => players[id]).sort((a, b) => b.overall + b.prestige - (a.overall + a.prestige))[0];
    team.captainId = best?.id ?? null;
    const fin = [...ids].map((id) => players[id]).sort((a, b) => (b.attributes.sangreFria ?? b.overall) - (a.attributes.sangreFria ?? a.overall));
    team.penaltyTakerId = fin[0]?.id ?? null;
    team.freekickTakerId = fin[0]?.id ?? null;
    team.cornerTakerId = fin[1]?.id ?? null;
    team.rating = teamRating(team, players);
    team.chemistry = recomputeChemistry(team, players);
    teams[teamId] = team;
  }
  return { teams, players };
}

// Quita un jugador de su selección de origen (defección al fichar/reclutar).
export function defect(world: { teams: Record<string, Team>; players: Record<string, Player> }, playerId: string) {
  const p = world.players[playerId];
  if (!p?.originTeamId) return;
  const t = world.teams[p.originTeamId];
  if (!t) return;
  t.squad = t.squad.filter((id) => id !== playerId);
  if (t.lineup.includes(playerId)) {
    t.lineup = autoLineup(t.squad.map((id) => world.players[id]), FORMATIONS[t.formation]);
  }
  if (t.captainId === playerId) {
    const best = t.squad.map((id) => world.players[id]).sort((a, b) => b.overall - a.overall)[0];
    t.captainId = best?.id ?? null;
  }
  t.rating = teamRating(t, world.players);
  p.originTeamId = undefined;
}

export { shuffle };
