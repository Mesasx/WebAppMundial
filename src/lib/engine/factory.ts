// Fábrica de jugadores: convierte PlayerSeed (datos públicos) en objetos Player
// completos con la media/atributos generados por la app, y también genera
// jugadores procedurales (nombres ficticios) para rellenar rivales.

import type { Foot, Personality, Player, Position, Trait } from "../types";
import type { PlayerSeed } from "@/data/players";
import {
  computeBaseOverall,
  computePotential,
  generateAttributes,
  generateTraits,
  positionGroup,
} from "./ratings";
import { gaussian, pick, RNG, uid } from "./rng";

const PERSONALITIES: Personality[] = [
  "lider",
  "profesional",
  "ambicioso",
  "tranquilo",
  "egocentrico",
  "temperamental",
  "humilde",
];

const ROLES: Record<string, string[]> = {
  GK: ["Portero clásico", "Portero-líbero", "Especialista en paradas"],
  DEF: ["Central contundente", "Central con salida", "Lateral ofensivo", "Defensa anticipador"],
  MID: ["Pivote defensivo", "Box-to-box", "Organizador", "Llegador"],
  WNG: ["Extremo desbordante", "Extremo a pierna cambiada", "Carrilero ofensivo"],
  ATT: ["Goleador de área", "Delantero móvil", "Falso 9", "Killer"],
};

function deriveOverallFields(seed: PlayerSeed, rng: RNG) {
  const overall = computeBaseOverall({
    tier: seed.tier,
    clubLevel: seed.clubLevel,
    prestige: seed.prestige,
    age: seed.age,
  });
  const potential = computePotential(overall, seed.age, seed.tier);
  return { overall, potential };
}

export function playerFromSeed(seed: PlayerSeed, rng: RNG): Player {
  const { overall, potential } = deriveOverallFields(seed, rng);
  const g = positionGroup(seed.position);
  const traits = generateTraits(overall, seed.age, seed.prestige, potential, rng);

  return {
    id: uid("p"),
    name: seed.name,
    age: seed.age,
    originCountry: seed.country,
    originFlag: seed.flag,
    club: seed.club,
    clubLevel: seed.clubLevel,
    position: seed.position,
    secondaryPositions: seed.secondary ?? [],
    foot: seed.foot,
    height: seed.height,
    naturalRole: pick(rng, ROLES[g]),
    overall,
    potential,
    prestige: seed.prestige,
    form: Math.round(gaussian(rng, 72, 8)),
    morale: Math.round(gaussian(rng, 70, 8)),
    fatigue: Math.round(Math.max(0, gaussian(rng, 8, 6))),
    injuryRisk: Math.round(Math.max(2, gaussian(rng, seed.age >= 32 ? 28 : 16, 8))),
    injuredDays: 0,
    personality: derivePersonality(seed, rng, traits),
    ambition: Math.round(clampStat(gaussian(rng, 40 + seed.prestige * 0.4, 12))),
    loyalty: Math.round(clampStat(gaussian(rng, 55, 15))),
    ego: Math.round(clampStat(gaussian(rng, 30 + seed.prestige * 0.4, 12))),
    persuadability: 0, // se fija en recruitment según dificultad/ego
    traits,
    attributes: generateAttributes(seed.position, overall, rng),
    stats: emptyStats(),
  };
}

function derivePersonality(seed: PlayerSeed, rng: RNG, traits: Trait[]): Personality {
  if (traits.includes("Conflictivo")) return rng() < 0.5 ? "egocentrico" : "temperamental";
  if (traits.includes("Capitán natural") || traits.includes("Líder")) return "lider";
  if (seed.prestige >= 85) return rng() < 0.5 ? "ambicioso" : "lider";
  return pick(rng, PERSONALITIES);
}

function clampStat(n: number): number {
  return Math.max(5, Math.min(99, n));
}

export function emptyStats() {
  return {
    matches: 0,
    minutes: 0,
    goals: 0,
    assists: 0,
    yellow: 0,
    red: 0,
    injuries: 0,
    ratingSum: 0,
    motm: 0,
  };
}

// ---------------------------------------------------------------------------
// Generación procedural (nombres ficticios) para rivales y rellenos de draft.
// ---------------------------------------------------------------------------

const FIRST = [
  "Mateo", "Liam", "Adam", "Luca", "Noah", "Hugo", "Ethan", "Diego", "Yuki",
  "Kai", "Omar", "Tariq", "Niko", "Pavel", "Bruno", "Andrés", "Felipe", "Marko",
  "Sven", "Tomás", "Idris", "Samir", "Leon", "Ivan", "Joon", "Renzo", "Dario",
  "Aleksy", "Mehdi", "Theo", "Caleb", "Nuno", "Aron", "Kofi", "Saad",
];
const LAST = [
  "Vargas", "Olsen", "Haddad", "Conti", "Mendez", "Petrov", "Bauer", "Kovač",
  "Silva", "Nakamura", "Diallo", "Okafor", "Lindqvist", "Moreau", "Rossi",
  "Andersen", "Cruz", "Bjorn", "Marchetti", "Tanaka", "El Amrani", "Novak",
  "Suárez", "Adebayo", "Kang", "Ferreira", "Wagner", "Lindgren", "Castillo",
  "Yilmaz", "Dembe", "Riva", "Holm", "Costa", "Nilsen", "Abara",
];

const CLUBS = [
  "Northbridge FC", "Atlético Solaris", "Real Montaña", "Dynamo Vortex",
  "Sporting Aurora", "FC Borealis", "Unión Costera", "Olympia United",
  "Racing Meridian", "Estrella Roja FC", "Kaiser SC", "Lóndres Athletic",
  "Pacific City", "Nova Lisboa", "Inter Helios", "Galaxia FC",
];

export function proceduralPlayer(
  pos: Position,
  targetTier: number,
  country: string,
  flag: string,
  rng: RNG,
): Player {
  const age = Math.round(Math.max(18, Math.min(37, gaussian(rng, 26, 4))));
  const clubLevel = Math.round(Math.max(45, Math.min(92, gaussian(rng, 55 + targetTier * 6, 10))));
  const prestige = Math.round(Math.max(20, Math.min(85, gaussian(rng, 30 + targetTier * 8, 12))));
  const seed: PlayerSeed = {
    name: `${pick(rng, FIRST)} ${pick(rng, LAST)}`,
    age,
    country,
    flag,
    club: pick(rng, CLUBS),
    clubLevel,
    position: pos,
    secondary: [],
    foot: pick<Foot>(rng, ["right", "right", "left", "both"]),
    prestige,
    tier: targetTier,
  };
  return playerFromSeed(seed, rng);
}
