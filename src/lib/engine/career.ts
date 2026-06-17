// ============================================================================
// Orquestador de la carrera: crea el universo, gestiona fases y avanza el juego.
// Es el "cerebro" que conecta draft, reclutamiento, torneo, simulación, noticias
// y epílogo, operando siempre sobre un objeto CareerState (serializable a JSON).
// ============================================================================

import { NATIONS, COACH_FIRST, COACH_LAST, PLAYSTYLES_POOL } from "@/data/nations";
import type {
  CareerState,
  Difficulty,
  Formation,
  KnockoutTie,
  MatchResult,
  Player,
  Playstyle,
  Team,
} from "../types";
import { proceduralPlayer } from "./factory";
import { FORMATIONS } from "./formations";
import { autoCompleteSquad, autoLineup, initDraft, SQUAD_SIZE } from "./draft";
import { simulateMatch, MatchOptions } from "./match";
import { recomputeChemistry, teamRating } from "./team";
import { addNews, dailyFlavorNews, injuryNews, matchNews } from "./news";
import { buildEpilogue, computeAwards } from "./epilogue";
import {
  buildGroupFixtures,
  buildGroups,
  buildKnockout,
  computeStandings,
  groupStageComplete,
  KO_ORDER,
  propagateKnockout,
  roundLabel,
} from "./tournament";
import { makeRng, pick, RNG, shuffle, uid } from "./rng";

const KICKOFF_DAY = 0;
const RECRUITMENT_START = -14;

// Posiciones base para construir una plantilla rival mínima por puesto.
const SQUAD_TEMPLATE = [
  "POR", "POR", "LD", "LD", "DFC", "DFC", "DFC", "LI", "LI",
  "MCD", "MCD", "MC", "MC", "MCO", "MCO", "ED", "ED", "EI", "EI",
  "DC", "DC", "SD", "MC", "DFC", "DC", "EI",
] as const;

function buildRivalTeam(
  nationName: string,
  flag: string,
  baseStrength: number,
  difficulty: Difficulty,
  players: Record<string, Player>,
  rng: RNG,
): Team {
  const id = uid("team");
  const squad: string[] = [];

  // tier objetivo según fuerza de la nación
  const tierFor = (i: number): number => {
    if (i < 2 && baseStrength >= 85) return 5; // 1-2 cracks en los mejores
    if (i < 1 && baseStrength >= 78) return 4;
    if (baseStrength >= 80) return i < 6 ? 4 : 3;
    if (baseStrength >= 72) return i < 4 ? 3 : 2;
    return i < 3 ? 3 : 2;
  };

  SQUAD_TEMPLATE.forEach((pos, i) => {
    const p = proceduralPlayer(pos, tierFor(i), nationName, flag, rng);
    players[p.id] = p;
    squad.push(p.id);
  });

  const formation = pick<Formation>(rng, ["4-3-3", "4-2-3-1", "4-4-2", "3-5-2", "5-3-2"]);
  const playstyle = pick<Playstyle>(rng, [...PLAYSTYLES_POOL]);
  const team: Team = {
    id,
    name: nationName,
    baseCountry: nationName,
    flag,
    isUser: false,
    coachName: `${pick(rng, COACH_FIRST)} ${pick(rng, COACH_LAST)}`,
    playstyle,
    formation,
    squad,
    lineup: [],
    captainId: null,
    penaltyTakerId: null,
    freekickTakerId: null,
    cornerTakerId: null,
    chemistry: Math.round(50 + rng() * 25),
    rating: 0,
    points: 0, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0,
    eliminated: false,
  };
  team.lineup = autoLineup(squad.map((s) => players[s]), FORMATIONS[formation]);
  setDefaultRoles(team, players);
  team.rating = teamRating(team, players);
  team.chemistry = recomputeChemistry(team, players);
  return team;
}

function setDefaultRoles(team: Team, players: Record<string, Player>) {
  const squad = team.squad.map((id) => players[id]).filter(Boolean) as Player[];
  if (squad.length === 0) return;
  const byPrestige = [...squad].sort((a, b) => b.prestige + b.overall - (a.prestige + a.overall));
  team.captainId = byPrestige[0]?.id ?? null;
  const finishers = [...squad].sort(
    (a, b) => (b.attributes.sangreFria ?? b.overall) - (a.attributes.sangreFria ?? a.overall),
  );
  team.penaltyTakerId = finishers[0]?.id ?? null;
  team.freekickTakerId = finishers[0]?.id ?? null;
  team.cornerTakerId = finishers[1]?.id ?? finishers[0]?.id ?? null;
}

export interface CreateCareerOptions {
  nationName: string;
  baseCountry: string;
  flag: string;
  difficulty: Difficulty;
  seed?: number;
}

export function createCareerState(opts: CreateCareerOptions): CareerState {
  const seed = opts.seed ?? Math.floor(Math.random() * 2 ** 31);
  const rng = makeRng(seed);
  const players: Record<string, Player> = {};
  const teams: Record<string, Team> = {};

  // 47 rivales (la 48ª plaza es el usuario). Excluimos la nación base si coincide.
  const rivalNations = shuffle(rng, NATIONS).filter((n) => n.name !== opts.baseCountry).slice(0, 47);
  for (const n of rivalNations) {
    const t = buildRivalTeam(n.name, n.flag, n.strength, opts.difficulty, players, rng);
    teams[t.id] = t;
  }

  // Equipo del usuario (plantilla vacía hasta el draft).
  const userTeam: Team = {
    id: uid("team"),
    name: opts.nationName,
    baseCountry: opts.baseCountry,
    flag: opts.flag,
    isUser: true,
    coachName: "Tú",
    playstyle: "posesion",
    formation: "4-3-3",
    squad: [],
    lineup: [],
    captainId: null,
    penaltyTakerId: null,
    freekickTakerId: null,
    cornerTakerId: null,
    chemistry: 50,
    rating: 0,
    points: 0, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0,
    eliminated: false,
  };
  teams[userTeam.id] = userTeam;

  const state: CareerState = {
    version: 1,
    difficulty: opts.difficulty,
    phase: "intro",
    day: RECRUITMENT_START,
    registrationClosed: false,
    userTeamId: userTeam.id,
    teams,
    players,
    groups: [],
    knockout: [],
    matches: [],
    schedule: [],
    news: [],
    conversations: [],
    promises: [],
    trainingLog: [],
    awards: {},
    objective: { label: "", targetRound: "Octavos", met: null },
    boardConfidence: 60,
    fanConfidence: 55,
    dressingRoom: 60,
    coachReputation: 40,
    log: [],
  };

  // Pool de draft preparada (se mostrará al pasar la intro).
  initDraft(state, rng);
  addNews(state, "torneo", "Crisis Mundial 2026", "Una crisis global ha reiniciado las nacionalidades deportivas. Las federaciones reconstruyen sus selecciones desde cero. ¡Comienza la locura!", "neutral");
  return state;
}

// --------------------------------------------------------------------------
// Fase 1: intro -> draft
// --------------------------------------------------------------------------
export function advanceFromIntro(state: CareerState) {
  if (state.phase === "intro") state.phase = "draft";
}

// --------------------------------------------------------------------------
// Fase draft
// --------------------------------------------------------------------------
export function finalizeDraft(state: CareerState, seed?: number) {
  const rng = makeRng(seed ?? Date.now() % 2 ** 31);
  const user = state.teams[state.userTeamId];
  const picks = (state.draftPicks ?? []).map((id) => state.players[id]).filter(Boolean) as Player[];
  const pool = (state.draftPool ?? []).map((id) => state.players[id]).filter(Boolean) as Player[];

  const full = autoCompleteSquad(picks, pool, user.baseCountry, user.flag, rng);
  // Asegura que los jugadores estén en el mapa global.
  for (const p of full) state.players[p.id] = p;
  user.squad = full.map((p) => p.id);
  user.lineup = autoLineup(full, FORMATIONS[user.formation]);
  setDefaultRoles(user, state.players);
  user.rating = teamRating(user, state.players);
  user.chemistry = recomputeChemistry(user, state.players);

  // Los jugadores de la pool no fichados se convierten en agentes libres
  // convencibles durante el reclutamiento.
  const keep = new Set(user.squad);
  const freeAgents = (state.draftPool ?? []).filter((id) => !keep.has(id) && state.players[id]);
  state.freeAgents = freeAgents;
  state.draftPool = undefined;
  state.draftPicks = undefined;
  state.draftPicksNeeded = undefined;

  state.phase = "recruitment";
  setObjective(state);
  addNews(state, "torneo", "Plantilla provisional cerrada", `${user.name} completa su draft inicial (26 jugadores). Quedan dos semanas para convencer a más futbolistas antes del cierre de listas.`, "good");
}

// --------------------------------------------------------------------------
// Fase reclutamiento (2 semanas)
// --------------------------------------------------------------------------
export function advanceRecruitmentDay(state: CareerState, seed?: number): string[] {
  const rng = makeRng(seed ?? Date.now() % 2 ** 31);
  const log: string[] = [];
  state.day += 1;
  // recuperación leve y curado de lesiones
  healAndRecover(state, 1);
  dailyFlavorNews(state, rng);
  // rivales pueden arrebatar convencibles
  for (const conv of state.conversations) {
    if (conv.status === "open" && rng() < (100 - conv.disposition) / 500) {
      conv.status = "lost";
      const p = state.players[conv.playerId];
      if (p) {
        log.push(`Otra selección se adelantó por ${p.name}.`);
        addNews(state, "rumor", "Mercado internacional", `Otra selección se ha adelantado por ${p.name}. Lo has perdido.`, "bad");
      }
    }
  }
  if (state.day >= KICKOFF_DAY) {
    closeRecruitment(state, rng);
    log.push("¡Se cierra el plazo de inscripción! Comienza el Mundial.");
  }
  return log;
}

export function closeRecruitment(state: CareerState, rng?: RNG) {
  if (state.phase !== "recruitment") return;
  const r = rng ?? makeRng(Date.now() % 2 ** 31);
  state.registrationClosed = true;
  state.day = Math.max(state.day, KICKOFF_DAY);

  // recalcular rating/química del usuario
  const user = state.teams[state.userTeamId];

  // Limpia agentes libres no fichados para no inflar el estado guardado.
  for (const id of state.freeAgents ?? []) {
    if (!user.squad.includes(id)) delete state.players[id];
  }
  state.freeAgents = undefined;
  state.conversations = state.conversations.filter((c) => c.status === "recruited");
  user.rating = teamRating(user, state.players);
  user.chemistry = recomputeChemistry(user, state.players);

  // sorteo equilibrado por bombos
  const teamIds = Object.keys(state.teams);
  state.groups = buildGroups(teamIds, state.teams, r);
  state.matches = buildGroupFixtures(state.groups);
  for (const m of state.matches) m.involvesUser = m.homeTeamId === user.id || m.awayTeamId === user.id;
  state.schedule = state.matches.map((m) => m.id);
  state.phase = "groups";

  const userGroup = state.groups.find((g) => g.teamIds.includes(user.id));
  addNews(state, "torneo", "Sorteo del Mundial", `${user.name} ${user.flag} queda encuadrada en el Grupo ${userGroup?.id}. ¡Que empiece el torneo!`, "neutral");
}

// --------------------------------------------------------------------------
// Simulación de partidos del usuario y avance del torneo
// --------------------------------------------------------------------------
export function getNextUserMatch(state: CareerState): MatchResult | null {
  ensureKnockoutMatches(state);
  return state.matches.find((m) => m.involvesUser && !m.played) ?? null;
}

export interface PlayMatchInput {
  formation?: Formation;
  playstyle?: Playstyle;
  aggression?: number; // -3..3
  seed?: number;
}

// Juega el próximo partido del usuario y simula el resto de su misma ronda.
export function playUserMatch(state: CareerState, input: PlayMatchInput = {}): MatchResult | null {
  const rng = makeRng(input.seed ?? Date.now() % 2 ** 31);
  const user = state.teams[state.userTeamId];
  if (input.formation) { user.formation = input.formation; user.lineup = autoLineup(user.squad.map((id) => state.players[id]), FORMATIONS[input.formation]); }
  if (input.playstyle) user.playstyle = input.playstyle;
  user.rating = teamRating(user, state.players);

  const next = getNextUserMatch(state);
  if (!next) return null;

  const home = state.teams[next.homeTeamId];
  const away = state.teams[next.awayTeamId];
  const opts: MatchOptions = {
    round: next.round,
    groupId: next.groupId,
    knockout: !next.groupId,
    userTeamId: user.id,
    userAggression: input.aggression ?? 0,
  };
  const sim = simulateMatch(home, away, state.players, rng, opts);
  Object.assign(next, sim, { id: next.id }); // conservar id original

  postProcessMatch(state, next, rng);
  // Simula el resto de la ronda/jornada del usuario.
  simulateConcurrentMatches(state, next, rng);
  advanceStage(state, rng);
  return next;
}

// Simula el próximo partido del usuario rápidamente (sin decisiones).
export function quickSimUserMatch(state: CareerState, seed?: number): MatchResult | null {
  return playUserMatch(state, { seed });
}

// Avanza el torneo cuando el usuario NO tiene partido pendiente (eliminado o
// jornada ya disputada): simula la siguiente ronda/jornada completa.
export function simulateRoundNoUser(state: CareerState, seed?: number): boolean {
  const rng = makeRng(seed ?? Date.now() % 2 ** 31);
  ensureKnockoutMatches(state);
  if (getNextUserMatch(state)) return false; // el usuario debe jugar primero

  const nextUnplayed = state.matches.find((m) => !m.played);
  if (!nextUnplayed) {
    advanceStage(state, rng); // por si falta construir KO o cerrar torneo
    return state.phase !== "finished";
  }
  const prefix = nextUnplayed.round.split("·")[0].trim();
  for (const m of state.matches) {
    if (m.played) continue;
    const same = nextUnplayed.groupId ? m.round === nextUnplayed.round : m.round.split("·")[0].trim() === prefix;
    if (!same) continue;
    const home = state.teams[m.homeTeamId];
    const away = state.teams[m.awayTeamId];
    if (!home || !away) continue;
    const sim = simulateMatch(home, away, state.players, rng, {
      round: m.round,
      groupId: m.groupId,
      knockout: !m.groupId,
    });
    Object.assign(m, sim, { id: m.id });
    if (!m.groupId) setTieWinnerFromMatch(state, m);
  }
  advanceStage(state, rng);
  return true;
}

function simulateConcurrentMatches(state: CareerState, ref: MatchResult, rng: RNG) {
  // misma "ronda" (jornada de grupo o ronda de KO)
  const sameRoundPrefix = ref.round.split("·")[0].trim();
  for (const m of state.matches) {
    if (m.played) continue;
    if (m.involvesUser) continue;
    const samePrefix = m.round.split("·")[0].trim() === sameRoundPrefix;
    const sameExact = m.round === ref.round;
    if (ref.groupId ? sameExact : samePrefix) {
      const home = state.teams[m.homeTeamId];
      const away = state.teams[m.awayTeamId];
      if (!home || !away) continue;
      const sim = simulateMatch(home, away, state.players, rng, {
        round: m.round,
        groupId: m.groupId,
        knockout: !m.groupId,
      });
      Object.assign(m, sim, { id: m.id });
      if (!m.groupId) setTieWinnerFromMatch(state, m);
    }
  }
}

function postProcessMatch(state: CareerState, m: MatchResult, rng: RNG) {
  const user = state.teams[state.userTeamId];
  const userIsHome = m.homeTeamId === user.id;
  const us = userIsHome ? m.homeGoals : m.awayGoals;
  const them = userIsHome ? m.awayGoals : m.homeGoals;
  const rivalId = userIsHome ? m.awayTeamId : m.homeTeamId;
  const rival = state.teams[rivalId];
  const won = us > them || (m.penaltyShootout && (userIsHome ? (m.homePenalties ?? 0) > (m.awayPenalties ?? 0) : (m.awayPenalties ?? 0) > (m.homePenalties ?? 0)));
  const drew = us === them && !m.penaltyShootout;

  // Moral / química / confianza
  const squad = user.squad.map((id) => state.players[id]).filter(Boolean) as Player[];
  const moraleDelta = won ? 6 : drew ? 1 : -6;
  for (const p of squad) {
    p.morale = clampPct(p.morale + moraleDelta + (rng() * 4 - 2));
    p.fatigue = clampPct(p.fatigue + (user.lineup.includes(p.id) ? 14 : 2));
    // forma se ajusta según valoración del partido si jugó
    if (user.lineup.includes(p.id)) {
      const avgR = p.stats.matches > 0 ? p.stats.ratingSum / p.stats.matches : 6;
      p.form = clampPct(p.form + (avgR >= 7 ? 3 : avgR < 5.5 ? -3 : 0));
      // progresión/regresión de media durante el torneo
      maybeProgress(p, avgR, rng);
    }
  }
  user.chemistry = recomputeChemistry(user, state.players);
  state.fanConfidence = clampPct(state.fanConfidence + (won ? 5 : drew ? 0 : -5));
  state.boardConfidence = clampPct(state.boardConfidence + (won ? 3 : drew ? 0 : -4));
  state.coachReputation = clampPct(state.coachReputation + (won ? 4 : drew ? 1 : -2));
  state.dressingRoom = clampPct(state.dressingRoom + (won ? 3 : drew ? 0 : -3));

  matchNews(state, won, drew, rival?.name ?? "el rival", `${us}-${them}`, rng);
  // noticias de lesiones surgidas
  for (const e of m.events) {
    if (e.type === "injury" && e.playerId && user.squad.includes(e.playerId)) {
      injuryNews(state, state.players[e.playerId]);
    }
  }

  // resolver promesas básicas (titularidad)
  resolvePromises(state, m);

  if (!m.groupId) setTieWinnerFromMatch(state, m);
}

function maybeProgress(p: Player, avgRating: number, rng: RNG) {
  if (avgRating >= 7.5 && p.overall < p.potential && rng() < 0.3) p.overall = Math.min(95, p.overall + 1);
  if (p.age >= 33 && rng() < 0.05) p.overall = Math.max(65, p.overall - 1); // declive
}

function resolvePromises(state: CareerState, m: MatchResult) {
  const user = state.teams[state.userTeamId];
  for (const prom of state.promises) {
    if (prom.kept !== null) continue;
    if (prom.type === "titularidad") {
      const started = user.lineup.includes(prom.playerId);
      if (m.involvesUser && started) prom.kept = true;
      // si lleva 2 partidos sin ser titular tras la promesa, se incumple
    }
    if (prom.type === "capitania" && user.captainId === prom.playerId) prom.kept = true;
  }
}

function setTieWinnerFromMatch(state: CareerState, m: MatchResult) {
  const tie = state.knockout.find((t) => t.matchId === m.id);
  if (!tie) return;
  const homeWon = m.homeGoals > m.awayGoals || (m.penaltyShootout && (m.homePenalties ?? 0) > (m.awayPenalties ?? 0));
  tie.winnerId = homeWon ? m.homeTeamId : m.awayTeamId;
  const loserId = homeWon ? m.awayTeamId : m.homeTeamId;
  if (state.teams[loserId]) state.teams[loserId].eliminated = true;
}

// Crea los MatchResult de la ronda KO activa (ties con ambos equipos).
function ensureKnockoutMatches(state: CareerState) {
  if (state.phase !== "knockouts") return;
  const active = activeKnockoutRound(state);
  if (!active) return;
  const rounds: KnockoutTie["round"][] = active === "F" ? ["3rd", "F"] : [active];
  for (const r of rounds) {
    for (const tie of state.knockout.filter((t) => t.round === r)) {
      if (tie.matchId || !tie.homeTeamId || !tie.awayTeamId || tie.winnerId) continue;
      const m: MatchResult = {
        id: uid("m"),
        round: r === "3rd" ? "Tercer puesto" : roundLabel(r),
        homeTeamId: tie.homeTeamId,
        awayTeamId: tie.awayTeamId,
        homeGoals: 0, awayGoals: 0,
        extraTime: false, penaltyShootout: false,
        events: [], played: false,
        involvesUser: tie.homeTeamId === state.userTeamId || tie.awayTeamId === state.userTeamId,
      };
      tie.matchId = m.id;
      state.matches.push(m);
    }
  }
}

function activeKnockoutRound(state: CareerState): KnockoutTie["round"] | null {
  for (const r of KO_ORDER) {
    const ties = state.knockout.filter((t) => t.round === r);
    const ready = ties.filter((t) => t.homeTeamId && t.awayTeamId);
    if (ready.length > 0 && ready.some((t) => !t.winnerId)) return r;
  }
  return null;
}

// Avanza de fase cuando una etapa se completa.
function advanceStage(state: CareerState, rng: RNG) {
  // sincroniza estadísticas de tabla de cada equipo (para la UI)
  syncTeamTournamentStats(state);

  if (state.phase === "groups" && groupStageComplete(state)) {
    state.knockout = buildKnockout(state, rng);
    state.phase = "knockouts";
    const user = state.teams[state.userTeamId];
    const qualified = !user.eliminated;
    addNews(state, "torneo", "Fin de la fase de grupos", qualified
      ? `${user.name} ${user.flag} se mete en la fase eliminatoria. ¡A por todas!`
      : `${user.name} ${user.flag} queda eliminada en la fase de grupos. El torneo continúa.`, qualified ? "good" : "bad");
    evalObjectiveIfDone(state);
    ensureKnockoutMatches(state);
    return;
  }

  if (state.phase === "knockouts") {
    propagateKnockout(state);
    ensureKnockoutMatches(state);
    // ¿final disputada?
    const final = state.knockout.find((t) => t.round === "F");
    if (final?.winnerId) {
      finishTournament(state, rng, final.winnerId);
    }
  }
}

function syncTeamTournamentStats(state: CareerState) {
  for (const g of state.groups) {
    const rows = computeStandings(g.id, state);
    for (const row of rows) {
      const t = state.teams[row.teamId];
      if (!t) continue;
      t.points = row.points; t.played = row.played; t.won = row.won;
      t.drawn = row.drawn; t.lost = row.lost; t.gf = row.gf; t.ga = row.ga;
    }
  }
}

function finishTournament(state: CareerState, rng: RNG, championId: string) {
  state.phase = "finished";
  computeAwards(state, championId);
  const user = state.teams[state.userTeamId];
  const won = championId === user.id;
  const finalRound = userExitRound(state);
  state.epilogue = buildEpilogue(state, won, finalRound, rng);
  state.finalResult = won ? "Campeón del Mundo 🏆" : `Eliminado en ${finalRound}`;
  evalObjectiveIfDone(state);
  const champ = state.teams[championId];
  addNews(state, "torneo", "Final del Mundial", `${champ.name} ${champ.flag} se proclama campeón del Mundo 2026 en el universo alternativo.`, won ? "good" : "neutral");
}

// Determina hasta dónde llegó el usuario.
function userExitRound(state: CareerState): string {
  const user = state.teams[state.userTeamId];
  // Si ganó la final
  const final = state.knockout.find((t) => t.round === "F");
  if (final?.winnerId === user.id) return "la Final (Campeón)";
  // busca la última ronda donde aparece y perdió
  for (let i = KO_ORDER.length - 1; i >= 0; i--) {
    const r = KO_ORDER[i];
    const tie = state.knockout.find((t) => t.round === r && (t.homeTeamId === user.id || t.awayTeamId === user.id));
    if (tie) {
      if (tie.winnerId && tie.winnerId !== user.id) return roundLabel(r);
      if (tie.winnerId === user.id && r === "F") return "la Final (Campeón)";
    }
  }
  return "la fase de grupos";
}

// --------------------------------------------------------------------------
// Objetivos de federación
// --------------------------------------------------------------------------
function setObjective(state: CareerState) {
  const user = state.teams[state.userTeamId];
  const r = user.rating;
  let label: string, targetRound: string;
  if (r >= 84) { label = "Pelear por el título"; targetRound = "Semifinal"; }
  else if (r >= 79) { label = "Llegar lejos en el torneo"; targetRound = "Cuartos"; }
  else if (r >= 74) { label = "Superar la fase de grupos"; targetRound = "Octavos"; }
  else { label = "Dar la sorpresa y competir"; targetRound = "Dieciseisavos"; }
  state.objective = { label, targetRound, met: null };
}

function evalObjectiveIfDone(state: CareerState) {
  if (state.objective.met !== null) return;
  const reached = userExitRound(state);
  const order = ["la fase de grupos", "Dieciseisavos", "Octavos", "Cuartos", "Semifinal", "la Final (Campeón)"];
  const targetIdx = order.findIndex((o) => o.includes(state.objective.targetRound) || state.objective.targetRound.includes(o));
  const reachedIdx = order.findIndex((o) => reached.includes(o) || o.includes(reached));
  if (state.phase === "finished" || (state.phase === "knockouts")) {
    if (reachedIdx >= 0 && targetIdx >= 0) {
      // sólo evaluamos definitivamente al terminar
      if (state.phase === "finished") state.objective.met = reachedIdx >= targetIdx;
    }
  }
}

// --------------------------------------------------------------------------
// Utilidades
// --------------------------------------------------------------------------
function healAndRecover(state: CareerState, days: number) {
  for (const p of Object.values(state.players)) {
    if (p.injuredDays > 0) {
      p.injuredDays = Math.max(0, p.injuredDays - days);
      if (p.injuredDays === 0) p.isInjuredSeriously = false;
    }
    p.fatigue = clampPct(p.fatigue - 6 * days);
  }
}

function clampPct(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export { teamRating, recomputeChemistry };
