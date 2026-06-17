// ============================================================================
// Motor de simulación de partidos — Modo Manager Mundial
// ----------------------------------------------------------------------------
// Modelo basado en "ocasiones": el control del mediocampo reparte el número de
// ocasiones; cada ocasión se convierte en gol según ataque vs (defensa+portero).
// Se añaden eventos discretos (tarjetas, lesiones, penaltis) con probabilidades
// documentadas. El resultado es coherente pero con aleatoriedad realista: un
// equipo mejor gana más a menudo, pero puede perder por una roja, un penalti
// fallado, un portero inspirado o mala suerte.
// ============================================================================

import type {
  MatchChronicle,
  MatchEvent,
  MatchResult,
  Player,
  Team,
} from "../types";
import { effectiveOverall, positionGroup } from "./ratings";
import { RNG, uid } from "./rng";
import { computeTeamStrength, TeamStrength } from "./team";

export interface MatchOptions {
  round: string;
  groupId?: string;
  knockout?: boolean; // si empate -> prórroga + penaltis
  // Decisiones tácticas del usuario (modo interactivo) aplicadas como sesgo.
  userTeamId?: string;
  userAggression?: number; // -3 (proteger) .. +3 (arriesgar)
}

interface SimTeam {
  team: Team;
  strength: TeamStrength;
  field: Player[]; // jugadores actualmente en el campo
  redCards: number;
  goals: number;
  shots: number;
  shotsOnTarget: number;
  // valoraciones acumuladas por jugador durante el partido
  ratings: Map<string, number>;
}

function lineupPlayers(team: Team, players: Record<string, Player>): Player[] {
  return team.lineup
    .map((id) => players[id])
    .filter((p): p is Player => Boolean(p) && (p?.injuredDays ?? 0) === 0);
}

function pickWeighted(rng: RNG, weights: Array<[Player, number]>): Player | undefined {
  const total = weights.reduce((a, [, w]) => a + w, 0);
  if (total <= 0) return weights[0]?.[0];
  let r = rng() * total;
  for (const [p, w] of weights) {
    r -= w;
    if (r <= 0) return p;
  }
  return weights[weights.length - 1]?.[0];
}

function scorerWeight(p: Player): number {
  const g = positionGroup(p.position);
  const base = effectiveOverall(p);
  const mult = g === "ATT" ? 1.0 : g === "WNG" ? 0.7 : g === "MID" ? 0.35 : g === "DEF" ? 0.08 : 0.01;
  return base * mult;
}

function assistWeight(p: Player): number {
  const g = positionGroup(p.position);
  const base = effectiveOverall(p);
  const mult = g === "WNG" ? 1.0 : g === "MID" ? 0.8 : g === "ATT" ? 0.6 : g === "DEF" ? 0.2 : 0;
  return base * mult;
}

function initSim(team: Team, players: Record<string, Player>): SimTeam {
  return {
    team,
    strength: computeTeamStrength(team, players),
    field: lineupPlayers(team, players),
    redCards: 0,
    goals: 0,
    shots: 0,
    shotsOnTarget: 0,
    ratings: new Map(team.lineup.map((id) => [id, 6.0])),
  };
}

// Probabilidad de convertir una ocasión: logística de (ataque - defensa - gk).
function conversionProb(attacker: SimTeam, defender: SimTeam): number {
  const gkFactor = defender.strength.goalkeeping * 0.5 + defender.strength.defense * 0.5;
  const diff = attacker.strength.attack - gkFactor;
  // red cards reducen capacidad defensiva
  const redPenalty = defender.redCards * 4;
  const p = 1 / (1 + Math.exp(-(diff + redPenalty) / 9));
  return Math.max(0.05, Math.min(0.6, p * 0.5)); // techo razonable por ocasión
}

export function simulateMatch(
  home: Team,
  away: Team,
  players: Record<string, Player>,
  rng: RNG,
  opts: MatchOptions,
): MatchResult {
  const H = initSim(home, players);
  const A = initSim(away, players);

  const events: MatchEvent[] = [];

  // Reparto de ocasiones por control del mediocampo (+ leve localía neutra).
  const midH = H.strength.midfield + 1.5; // pequeña ventaja "de inicio"
  const midA = A.strength.midfield;
  let shareH = midH / (midH + midA);

  // Sesgo por agresividad del usuario.
  if (opts.userTeamId && opts.userAggression) {
    const agg = opts.userAggression * 0.02;
    if (opts.userTeamId === home.id) shareH += agg;
    else shareH -= agg;
  }
  shareH = Math.max(0.25, Math.min(0.75, shareH));

  const totalChances = Math.round(16 + rng() * 12); // 16-28 ocasiones combinadas

  const playMinute = (minute: number) => {
    // ¿ocasión de quién?
    const attackerIsHome = rng() < shareH;
    const att = attackerIsHome ? H : A;
    const def = attackerIsHome ? A : H;
    att.shots++;

    // Eventos disciplinarios/lesión ligados a la jugada (baja probabilidad).
    maybeCard(rng, def, events, minute);

    const onTarget = rng() < 0.45 + att.strength.attack / 400;
    if (!onTarget) {
      if (rng() < 0.25) {
        events.push(ev(minute, "chance", att.team.id, undefined, `${att.team.name} avisa pero el disparo se marcha desviado.`));
      }
      return;
    }
    att.shotsOnTarget++;

    // ¿penalti? (poco frecuente)
    if (rng() < 0.04) {
      handlePenalty(rng, att, def, events, minute);
      return;
    }

    const prob = conversionProb(att, def);
    if (rng() < prob) {
      scoreGoal(rng, att, def, events, minute, players);
    } else {
      events.push(ev(minute, "save", def.team.id, gk(def)?.id, `¡Paradón del portero de ${def.team.name} en el minuto ${minute}!`));
      addRating(def, gk(def)?.id, 0.3);
    }
  };

  // Distribuir ocasiones a lo largo de 90'.
  const minutes = Array.from({ length: totalChances }, () => 1 + Math.floor(rng() * 90)).sort((a, b) => a - b);
  for (const m of minutes) playMinute(m);

  // Lesión aislada posible.
  maybeInjury(rng, H, events);
  maybeInjury(rng, A, events);

  H.goals = countGoals(events, home.id);
  A.goals = countGoals(events, away.id);

  let extraTime = false;
  let shootout = false;
  let homePens: number | undefined;
  let awayPens: number | undefined;

  if (opts.knockout && H.goals === A.goals) {
    // Prórroga: 4 ocasiones extra.
    extraTime = true;
    events.push(ev(90, "info", home.id, undefined, "Empate al final de los 90'. ¡Se va a la prórroga!"));
    const extraMinutes = Array.from({ length: 4 }, () => 91 + Math.floor(rng() * 29)).sort((a, b) => a - b);
    for (const m of extraMinutes) playMinute(m);
    H.goals = countGoals(events, home.id);
    A.goals = countGoals(events, away.id);

    if (H.goals === A.goals) {
      shootout = true;
      const res = penaltyShootout(rng, H, A, events);
      homePens = res.home;
      awayPens = res.away;
    }
  }

  const winnerHome =
    H.goals > A.goals || (shootout && (homePens ?? 0) > (awayPens ?? 0));
  const winnerAway =
    A.goals > H.goals || (shootout && (awayPens ?? 0) > (homePens ?? 0));

  const result: MatchResult = {
    id: uid("m"),
    round: opts.round,
    groupId: opts.groupId,
    homeTeamId: home.id,
    awayTeamId: away.id,
    homeGoals: H.goals,
    awayGoals: A.goals,
    homePenalties: homePens,
    awayPenalties: awayPens,
    extraTime,
    penaltyShootout: shootout,
    events: events.sort((a, b) => a.minute - b.minute),
    involvesUser: home.isUser || away.isUser,
    played: true,
    stats: {
      homePossession: Math.round(shareH * 100),
      homeShots: H.shots,
      awayShots: A.shots,
      homeShotsOnTarget: H.shotsOnTarget,
      awayShotsOnTarget: A.shotsOnTarget,
    },
  };

  result.chronicle = buildChronicle(result, H, A, players, { winnerHome, winnerAway });
  applyMatchToStats(result, H, A, players);
  return result;
}

// ---------------------------------------------------------------------------
// Sub-eventos
// ---------------------------------------------------------------------------

function ev(
  minute: number,
  type: MatchEvent["type"],
  teamId: string,
  playerId: string | undefined,
  text: string,
): MatchEvent {
  return { minute, type, teamId, playerId, text };
}

function gk(t: SimTeam): Player | undefined {
  return t.field.find((p) => p.position === "POR");
}

function addRating(t: SimTeam, playerId: string | undefined, delta: number) {
  if (!playerId) return;
  t.ratings.set(playerId, (t.ratings.get(playerId) ?? 6.0) + delta);
}

function scoreGoal(
  rng: RNG,
  att: SimTeam,
  def: SimTeam,
  events: MatchEvent[],
  minute: number,
  _players: Record<string, Player>,
) {
  const fieldOut = att.field.filter((p) => p.position !== "POR");
  const scorer = pickWeighted(rng, fieldOut.map((p) => [p, scorerWeight(p)]));
  const assister = pickWeighted(
    rng,
    fieldOut.filter((p) => p.id !== scorer?.id).map((p) => [p, assistWeight(p)]),
  );
  if (scorer) {
    events.push(ev(minute, "goal", att.team.id, scorer.id, `⚽ ¡GOOOL de ${scorer.name} (${att.team.name})!`));
    addRating(att, scorer.id, 1.2);
  }
  if (assister && rng() < 0.7) {
    events.push(ev(minute, "assist", att.team.id, assister.id, `Asistencia de ${assister.name}.`));
    addRating(att, assister.id, 0.6);
  }
  addRating(def, gk(def)?.id, -0.3);
}

function handlePenalty(
  rng: RNG,
  att: SimTeam,
  def: SimTeam,
  events: MatchEvent[],
  minute: number,
) {
  events.push(ev(minute, "penalty", att.team.id, undefined, `¡Penalti a favor de ${att.team.name}!`));
  const takerId = att.team.penaltyTakerId && att.field.find((p) => p.id === att.team.penaltyTakerId)
    ? att.team.penaltyTakerId
    : pickWeighted(rng, att.field.filter((p) => p.position !== "POR").map((p) => [p, scorerWeight(p)]))?.id;
  const taker = att.field.find((p) => p.id === takerId);
  const keeper = gk(def);
  const skill = taker ? (taker.attributes.sangreFria ?? taker.attributes.definicion ?? taker.overall) : 70;
  const save = keeper ? keeper.attributes.unoContraUno ?? keeper.overall : 65;
  const scoreP = Math.max(0.55, Math.min(0.92, 0.75 + (skill - save) / 200));
  if (rng() < scoreP) {
    events.push(ev(minute, "goal", att.team.id, taker?.id, `⚽ ${taker?.name ?? "El lanzador"} transforma el penalti.`));
    addRating(att, taker?.id, 0.9);
  } else {
    events.push(ev(minute, "penalty_miss", att.team.id, taker?.id, `❌ ¡${taker?.name ?? "El lanzador"} falla el penalti! El portero de ${def.team.name} adivina el lado.`));
    addRating(att, taker?.id, -0.8);
    addRating(def, keeper?.id, 0.7);
  }
}

function maybeCard(rng: RNG, def: SimTeam, events: MatchEvent[], minute: number) {
  if (rng() < 0.06) {
    const defenders = def.field.filter((p) => positionGroup(p.position) !== "GK");
    const culprit = defenders[Math.floor(rng() * defenders.length)];
    if (!culprit) return;
    if (rng() < 0.12) {
      def.redCards++;
      events.push(ev(minute, "red", def.team.id, culprit.id, `🟥 ¡Roja directa a ${culprit.name} (${def.team.name})! Se queda con uno menos.`));
      addRating(def, culprit.id, -1.5);
      def.field = def.field.filter((p) => p.id !== culprit.id);
    } else {
      events.push(ev(minute, "yellow", def.team.id, culprit.id, `🟨 Amarilla para ${culprit.name}.`));
      addRating(def, culprit.id, -0.2);
    }
  }
}

function maybeInjury(rng: RNG, t: SimTeam, events: MatchEvent[]) {
  for (const p of t.field) {
    const risk = (p.injuryRisk + p.fatigue * 0.3) / 100;
    if (rng() < risk * 0.05) {
      const minute = 10 + Math.floor(rng() * 80);
      events.push(ev(minute, "injury", t.team.id, p.id, `🚑 Se lesiona ${p.name} y debe ser atendido.`));
      break; // como mucho una por equipo por partido
    }
  }
}

function penaltyShootout(rng: RNG, H: SimTeam, A: SimTeam, events: MatchEvent[]) {
  events.push(ev(120, "info", H.team.id, undefined, "⚖️ Todo se decide en los penaltis."));
  let home = 0;
  let away = 0;
  const takersH = [...H.field].sort((a, b) => scorerWeight(b) - scorerWeight(a));
  const takersA = [...A.field].sort((a, b) => scorerWeight(b) - scorerWeight(a));
  for (let i = 0; i < 5; i++) {
    if (rng() < 0.76) home++;
    if (rng() < 0.76) away++;
  }
  // muerte súbita si empate
  let round = 5;
  while (home === away && round < 12) {
    const h = rng() < 0.74;
    const a = rng() < 0.74;
    if (h) home++;
    if (a) away++;
    round++;
  }
  if (home === away) home += rng() < 0.5 ? 1 : 0;
  events.push(ev(120, "info", H.team.id, undefined, `Tanda de penaltis: ${H.team.name} ${home} - ${away} ${A.team.name}.`));
  // referenciar lanzadores para color narrativo
  if (takersH[0]) addRating(H, takersH[0].id, home > away ? 0.5 : -0.3);
  if (takersA[0]) addRating(A, takersA[0].id, away > home ? 0.5 : -0.3);
  return { home, away };
}

function countGoals(events: MatchEvent[], teamId: string): number {
  return events.filter((e) => e.type === "goal" && e.teamId === teamId).length;
}

// ---------------------------------------------------------------------------
// Crónica y estadísticas
// ---------------------------------------------------------------------------

function buildChronicle(
  result: MatchResult,
  H: SimTeam,
  A: SimTeam,
  players: Record<string, Player>,
  who: { winnerHome: boolean; winnerAway: boolean },
): MatchChronicle {
  const all = [...H.ratings.entries(), ...A.ratings.entries()];
  all.sort((a, b) => b[1] - a[1]);
  const mvpId = all[0]?.[0];
  const worstId = all[all.length - 1]?.[0];
  const mvp = mvpId ? players[mvpId] : undefined;
  const worst = worstId ? players[worstId] : undefined;

  const winner = who.winnerHome ? H.team : who.winnerAway ? A.team : null;
  const loser = who.winnerHome ? A.team : who.winnerAway ? H.team : null;

  let headline: string;
  if (!winner) {
    headline = `Reparto de puntos: ${H.team.name} ${result.homeGoals}-${result.awayGoals} ${A.team.name}`;
  } else if (result.penaltyShootout) {
    headline = `${winner.name} sobrevive en los penaltis ante ${loser?.name}`;
  } else {
    const margin = Math.abs(result.homeGoals - result.awayGoals);
    headline = margin >= 3
      ? `${winner.name} golea a ${loser?.name} (${result.homeGoals}-${result.awayGoals})`
      : `${winner.name} se impone a ${loser?.name} (${result.homeGoals}-${result.awayGoals})`;
  }

  const tacticalKey = result.stats && result.stats.homePossession >= 58
    ? `El dominio del balón de ${H.team.name} marcó el ritmo del partido.`
    : result.stats && result.stats.homePossession <= 42
      ? `${A.team.name} supo manejar los tiempos sin el balón.`
      : "Partido parejo, decidido por los detalles.";

  const goals = result.events.filter((e) => e.type === "goal");
  const decisive = goals.length
    ? `El ${goals[goals.length - 1].minute}' cambió la historia: ${goals[goals.length - 1].text}`
    : "Un duelo trabado sin apenas ocasiones claras.";

  return {
    headline,
    mvpPlayerId: mvpId,
    worstPlayerId: worstId,
    tacticalKey,
    decisiveMoment: decisive,
    summary: `${mvp ? mvp.name + " fue lo mejor del partido. " : ""}${worst ? worst.name + " no tuvo su mejor día." : ""}`.trim(),
  };
}

function applyMatchToStats(
  result: MatchResult,
  H: SimTeam,
  A: SimTeam,
  players: Record<string, Player>,
) {
  const mvpId = result.chronicle?.mvpPlayerId;
  for (const sim of [H, A]) {
    for (const p of sim.team.lineup) {
      const player = players[p];
      if (!player) continue;
      player.stats.matches++;
      player.stats.minutes += 90;
      const r = sim.ratings.get(p) ?? 6.0;
      player.stats.ratingSum += Math.max(3, Math.min(10, r));
      if (p === mvpId) player.stats.motm++;
    }
  }
  for (const e of result.events) {
    const player = e.playerId ? players[e.playerId] : undefined;
    if (!player) continue;
    if (e.type === "goal") player.stats.goals++;
    else if (e.type === "assist") player.stats.assists++;
    else if (e.type === "yellow") player.stats.yellow++;
    else if (e.type === "red") player.stats.red++;
    else if (e.type === "injury") {
      player.stats.injuries++;
      player.injuredDays = Math.max(player.injuredDays, 3 + Math.floor(Math.random() * 12));
      if (player.injuredDays >= 10) player.isInjuredSeriously = true;
    }
  }
}
