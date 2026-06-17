// ============================================================================
// Sistema de valoración propio (medias 65-95) — Modo Manager Mundial
// ----------------------------------------------------------------------------
// IMPORTANTE: este sistema es ORIGINAL. No copia ni reproduce las medias,
// cartas ni fórmulas de ningún juego con licencia. Se inspira conceptualmente
// en datos públicos (edad, club, prestigio histórico, posición) para generar
// una valoración coherente y divertida desde cero.
//
// La media combina, con pesos documentados:
//   - tier deportivo (señal pública de nivel actual)          ~ peso alto
//   - nivel del club                                          ~ peso medio
//   - prestigio histórico                                     ~ peso medio
//   - curva de edad (prime, juventud, declive)                ~ modificador
//   - estado de forma actual                                  ~ modificador leve
// El resultado se acota al rango [65, 95].
// ============================================================================

import type {
  Player,
  PlayerAttributes,
  Position,
  PositionGroup,
  Trait,
} from "../types";

export const MIN_OVERALL = 65;
export const MAX_OVERALL = 95;

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function positionGroup(pos: Position): PositionGroup {
  if (pos === "POR") return "GK";
  if (pos === "LD" || pos === "DFC" || pos === "LI") return "DEF";
  if (pos === "MCD" || pos === "MC" || pos === "MCO") return "MID";
  if (pos === "ED" || pos === "EI") return "WNG";
  return "ATT"; // DC, SD
}

// Modificador por edad: pico entre 26-29, penaliza juventud extrema y declive.
export function ageModifier(age: number): number {
  if (age <= 18) return -6;
  if (age <= 20) return -4;
  if (age <= 22) return -2;
  if (age <= 25) return 0;
  if (age <= 29) return 1; // prime
  if (age <= 31) return 0;
  if (age <= 33) return -2;
  if (age <= 35) return -4;
  return -7;
}

export interface RatingInputs {
  tier: number;       // 1 (modesto) .. 5 (top mundial)
  clubLevel: number;  // 0-100
  prestige: number;   // 0-100
  age: number;
}

// Calcula la media base (sin forma) a partir de las señales públicas.
export function computeBaseOverall(i: RatingInputs): number {
  // tier 1->70 base, 5->92 base aprox. (curva no lineal: los tops escasean)
  const tierBase = [0, 71, 76, 82, 88, 92][clamp(Math.round(i.tier), 1, 5)];
  const clubBonus = (i.clubLevel - 70) * 0.06; // club fuerte aporta poco a poco
  const prestigeBonus = (i.prestige - 50) * 0.05;
  const ageMod = ageModifier(i.age);
  const raw = tierBase + clubBonus + prestigeBonus + ageMod;
  return Math.round(clamp(raw, MIN_OVERALL, MAX_OVERALL));
}

// Potencial: jóvenes pueden crecer bastante; veteranos casi nada.
export function computePotential(overall: number, age: number, tier: number): number {
  let headroom = 0;
  if (age <= 19) headroom = 8 + tier;
  else if (age <= 21) headroom = 6 + Math.floor(tier / 2);
  else if (age <= 23) headroom = 4;
  else if (age <= 26) headroom = 2;
  else headroom = 0;
  return clamp(overall + headroom, MIN_OVERALL, MAX_OVERALL);
}

// La media "efectiva" en un partido aplica forma, moral y fatiga de forma leve.
// El fútbol no se decide sólo por la media: estos modificadores son moderados.
export function effectiveOverall(p: Player): number {
  const formMod = (p.form - 70) * 0.06;     // ±~1.8
  const moraleMod = (p.morale - 70) * 0.04;  // ±~1.2
  const fatigueMod = -(p.fatigue) * 0.04;    // hasta -4 con fatiga máxima
  const injuryPenalty = p.injuredDays > 0 ? -40 : 0; // no debería jugar
  return clamp(
    p.overall + formMod + moraleMod + fatigueMod + injuryPenalty,
    20,
    99,
  );
}

// Genera los atributos por posición a partir de la media, con variación.
export function generateAttributes(
  pos: Position,
  overall: number,
  rng: () => number,
): PlayerAttributes {
  const g = positionGroup(pos);
  const around = (center: number, spread = 8) =>
    clamp(Math.round(center + (rng() * 2 - 1) * spread), 40, 99);
  const base = overall;
  const attrs: PlayerAttributes = {};

  if (g === "GK") {
    attrs.reflejos = around(base + 2);
    attrs.paradas = around(base);
    attrs.juegoAereo = around(base - 2);
    attrs.saque = around(base - 4);
    attrs.unoContraUno = around(base);
    attrs.colocacion = around(base);
  } else if (g === "DEF") {
    attrs.entrada = around(base + 1);
    attrs.marcaje = around(base + 1);
    attrs.fuerza = around(base);
    attrs.velocidad = around(pos === "DFC" ? base - 4 : base + 2);
    attrs.anticipacion = around(base);
    attrs.juegoAereo = around(pos === "DFC" ? base + 3 : base - 4);
    attrs.salidaBalon = around(base - 2);
  } else if (g === "MID") {
    attrs.paseCorto = around(base + 2);
    attrs.paseLargo = around(base);
    attrs.vision = around(pos === "MCO" ? base + 3 : base);
    attrs.resistencia = around(base + 2);
    attrs.defensa = around(pos === "MCD" ? base + 3 : base - 4);
    attrs.control = around(base + 1);
    attrs.decisiones = around(base);
    if (pos === "MCO") attrs.definicion = around(base - 2);
  } else if (g === "WNG") {
    attrs.velocidad = around(base + 3);
    attrs.regate = around(base + 2);
    attrs.centro = around(base);
    attrs.desborde = around(base + 2);
    attrs.definicion = around(base - 2);
    attrs.agilidad = around(base + 2);
  } else {
    // ATT
    attrs.definicion = around(base + 2);
    attrs.desmarque = around(base + 1);
    attrs.remate = around(base + 1);
    attrs.fuerza = around(base);
    attrs.velocidad = around(base);
    attrs.sangreFria = around(base);
    attrs.juegoAereo = around(base - 2);
  }
  return attrs;
}

// Asigna rasgos especiales coherentes con la media, edad y prestigio.
export function generateTraits(
  overall: number,
  age: number,
  prestige: number,
  potential: number,
  rng: () => number,
): Trait[] {
  const traits: Trait[] = [];
  const add = (t: Trait, chance: number) => {
    if (rng() < chance && !traits.includes(t)) traits.push(t);
  };

  if (overall >= 90 && prestige >= 80) add("Leyenda", 0.9);
  if (age <= 21 && potential - overall >= 4) add("Promesa", 0.95);
  if (prestige >= 75) add("Líder", 0.4);
  if (overall >= 88) add("Killer", 0.35);
  if (age >= 33) add("Frágil", 0.3);

  add("Clutch", 0.12);
  add("Velocista", 0.15);
  add("Cerebro", 0.12);
  add("Muro", 0.1);
  add("Revulsivo", 0.12);
  add("Irregular", 0.12);
  add("Profesional", 0.18);
  add("Conflictivo", 0.08);
  add("Capitán natural", prestige >= 70 ? 0.25 : 0.08);

  return traits.slice(0, 3);
}
