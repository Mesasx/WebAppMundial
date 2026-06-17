// Tests del motor de simulación (vitest). Verifican coherencia: el sistema de
// valoración respeta rangos, el draft cubre posiciones, una carrera puede
// jugarse de principio a fin y los favoritos ganan más a menudo sin ser
// deterministas.

import { describe, expect, it } from "vitest";
import { createCareerState, finalizeDraft, playUserMatch, simulateRoundNoUser, advanceFromIntro, closeRecruitment } from "../career";
import { computeBaseOverall, MAX_OVERALL, MIN_OVERALL } from "../ratings";
import { simulateMatch } from "../match";
import { makeRng } from "../rng";
import { POSITIONS } from "../../types";
import type { CareerState } from "../../types";

describe("ratings", () => {
  it("mantiene la media dentro de [65, 95]", () => {
    for (let tier = 1; tier <= 5; tier++) {
      for (const age of [18, 26, 34, 39]) {
        const ovr = computeBaseOverall({ tier, clubLevel: 80, prestige: 60, age });
        expect(ovr).toBeGreaterThanOrEqual(MIN_OVERALL);
        expect(ovr).toBeLessThanOrEqual(MAX_OVERALL);
      }
    }
  });

  it("un crack vale más que un jugador modesto", () => {
    const crack = computeBaseOverall({ tier: 5, clubLevel: 92, prestige: 90, age: 27 });
    const modesto = computeBaseOverall({ tier: 1, clubLevel: 55, prestige: 30, age: 27 });
    expect(crack).toBeGreaterThan(modesto);
  });
});

describe("creación y draft", () => {
  it("genera 47 rivales + usuario con plantillas válidas", () => {
    const state = createCareerState({ nationName: "Atlántida", baseCountry: "España", flag: "🇪🇸", difficulty: "normal", seed: 1 });
    expect(Object.keys(state.teams)).toHaveLength(48);
    const rivals = Object.values(state.teams).filter((t) => !t.isUser);
    expect(rivals).toHaveLength(47);
    for (const r of rivals) {
      expect(r.squad.length).toBe(26);
      expect(r.lineup.length).toBe(11);
      expect(r.rating).toBeGreaterThanOrEqual(60);
    }
  });

  it("el draft completa 26 con al menos 2 por posición", () => {
    const state = createCareerState({ nationName: "Iberia", baseCountry: "Argentina", flag: "🇦🇷", difficulty: "normal", seed: 7 });
    finalizeDraft(state, 7);
    const user = state.teams[state.userTeamId];
    expect(user.squad).toHaveLength(26);
    const byPos: Record<string, number> = {};
    for (const id of user.squad) {
      const p = state.players[id];
      byPos[p.position] = (byPos[p.position] ?? 0) + 1;
    }
    for (const pos of POSITIONS) {
      expect(byPos[pos] ?? 0).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("simulación de partidos", () => {
  it("produce resultados coherentes y el favorito gana más a menudo", () => {
    const rng = makeRng(42);
    const state = createCareerState({ nationName: "A", baseCountry: "Brasil", flag: "🇧🇷", difficulty: "normal", seed: 3 });
    const teams = Object.values(state.teams).filter((t) => !t.isUser);
    const strong = [...teams].sort((a, b) => b.rating - a.rating)[0];
    const weak = [...teams].sort((a, b) => a.rating - b.rating)[0];
    let strongWins = 0;
    const N = 60;
    for (let i = 0; i < N; i++) {
      const m = simulateMatch(strong, weak, state.players, makeRng(i + 1), { round: "test" });
      if (m.homeGoals > m.awayGoals) strongWins++;
      expect(m.homeGoals).toBeGreaterThanOrEqual(0);
      expect(m.played).toBe(true);
    }
    // el favorito debe ganar bastante más de la mitad, pero no siempre
    expect(strongWins).toBeGreaterThan(N * 0.55);
    expect(strongWins).toBeLessThan(N);
  });
});

describe("carrera completa", () => {
  it("puede jugarse de la intro al campeón", () => {
    const state: CareerState = createCareerState({ nationName: "Pangea", baseCountry: "Francia", flag: "🇫🇷", difficulty: "normal", seed: 11 });
    advanceFromIntro(state);
    finalizeDraft(state, 11);
    // saltar reclutamiento
    // cerrar plazo manualmente
    state.day = 0;
    closeRecruitment(state);
    expect(state.phase).toBe("groups");

    let guard = 0;
    while (state.phase !== "finished" && guard < 200) {
      const next = state.matches.find((m) => m.involvesUser && !m.played);
      if (next) playUserMatch(state, { seed: guard + 1 });
      else simulateRoundNoUser(state, guard + 1);
      guard++;
    }
    expect(state.phase).toBe("finished");
    expect(state.finalResult).toBeTruthy();
    // debe haber un campeón
    const final = state.knockout.find((t) => t.round === "F");
    expect(final?.winnerId).toBeTruthy();
  });
});
