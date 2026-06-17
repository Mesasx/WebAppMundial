// Epílogo narrativo y premios del torneo.

import type { CareerState, EpilogueEntry, Player } from "../types";
import { pick, RNG } from "./rng";

function topBy(state: CareerState, fn: (p: Player) => number): Player | undefined {
  const players = Object.values(state.players).filter((p) => p.stats.matches > 0);
  if (players.length === 0) return undefined;
  return players.sort((a, b) => fn(b) - fn(a))[0];
}

export function computeAwards(state: CareerState, championId?: string): void {
  const scorer = topBy(state, (p) => p.stats.goals * 10 + p.stats.assists);
  const keeper = Object.values(state.players)
    .filter((p) => p.position === "POR" && p.stats.matches > 0)
    .sort((a, b) => (b.stats.ratingSum / Math.max(1, b.stats.matches)) - (a.stats.ratingSum / Math.max(1, a.stats.matches)))[0];
  const ball = topBy(state, (p) => p.stats.ratingSum / Math.max(1, p.stats.matches) * 10 + p.stats.goals * 3 + p.stats.motm * 5);
  const revelation = Object.values(state.players)
    .filter((p) => p.age <= 23 && p.stats.matches > 0)
    .sort((a, b) => (b.stats.goals + b.stats.assists + b.stats.motm * 2) - (a.stats.goals + a.stats.assists + a.stats.motm * 2))[0];

  const bestXI = Object.values(state.players)
    .filter((p) => p.stats.matches > 0)
    .sort((a, b) => (b.stats.ratingSum / Math.max(1, b.stats.matches)) - (a.stats.ratingSum / Math.max(1, a.stats.matches)))
    .slice(0, 11)
    .map((p) => p.id);

  state.awards = {
    championId,
    goldenBootId: scorer?.id,
    goldenGloveId: keeper?.id,
    goldenBallId: ball?.id,
    revelationId: revelation?.id,
    bestXI,
  };
}

export function buildEpilogue(state: CareerState, won: boolean, finalRound: string, rng: RNG): EpilogueEntry[] {
  const team = state.teams[state.userTeamId];
  const entries: EpilogueEntry[] = [];
  const squad = team.squad.map((id) => state.players[id]).filter(Boolean) as Player[];

  if (won) {
    entries.push({
      title: "🏆 Campeones del Mundo",
      body: `${team.name} ${team.flag} levanta la copa en un universo que nadie creía posible. El relato de una selección reconstruida desde cero que conquistó el mundo.`,
    });
    const captain = team.captainId ? state.players[team.captainId] : undefined;
    if (captain) entries.push({ title: "El capitán eterno", body: `${captain.name} levanta el trofeo y la prensa lo llama 'el padre de una nueva nación futbolística'.` });
  } else {
    entries.push({
      title: "El sueño se acaba",
      body: `${team.name} ${team.flag} cae en ${finalRound}. Toca análisis, autocrítica y reconstrucción. El fútbol da revanchas.`,
    });
  }

  // Destinos de jugadores.
  const veteran = squad.filter((p) => p.age >= 34).sort((a, b) => b.prestige - a.prestige)[0];
  if (veteran) {
    entries.push({
      title: "Adiós a una leyenda",
      body: won
        ? `${veteran.name} anuncia su retirada tras tocar la gloria. Se va por la puerta grande.`
        : `${veteran.name} medita la retirada tras un torneo agridulce.`,
    });
  }
  const youngStar = squad.filter((p) => p.age <= 22 && p.stats.goals + p.stats.assists >= 1).sort((a, b) => (b.stats.goals + b.stats.assists) - (a.stats.goals + a.stats.assists))[0];
  if (youngStar) {
    entries.push({
      title: "Nace una estrella",
      body: `${youngStar.name}, un desconocido hace dos semanas, se convierte en el nombre propio del verano. Los grandes clubes ya preguntan por él.`,
    });
  }
  const penaltyVillain = Object.values(state.players).find((p) => p.stats.matches > 0 && p.traits.includes("Irregular"));
  if (penaltyVillain && rng() < 0.5) {
    entries.push({
      title: "La otra cara",
      body: `${penaltyVillain.name} carga con la presión de un torneo irregular y entra en una etapa complicada en su club.`,
    });
  }

  return entries;
}
