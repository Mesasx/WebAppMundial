// Despachador de acciones de juego. Recibe un CareerState (mutável) y una acción
// validada, aplica la lógica del motor y devuelve un mensaje para la UI.

import type { CareerState, Formation, Player, Playstyle } from "./types";
import { FORMATIONS } from "./engine/formations";
import { autoLineup, validateManualPicks, MANUAL_PICKS } from "./engine/draft";
import {
  advanceFromIntro,
  advanceRecruitmentDay,
  closeRecruitment,
  finalizeDraft,
  playUserMatch,
  recomputeChemistry,
  simulateRoundNoUser,
  teamRating,
} from "./engine/career";
import {
  APPROACHES,
  ApproachType,
  sendApproach,
  startConversation,
} from "./engine/recruitment";
import { applyTraining, TrainingType } from "./engine/training";

export type Action =
  | { type: "advanceIntro" }
  | { type: "draftPick"; playerId: string }
  | { type: "draftRemove"; playerId: string }
  | { type: "finalizeDraft" }
  | { type: "startConversation"; playerId: string }
  | { type: "sendApproach"; playerId: string; approach: ApproachType; text?: string }
  | { type: "training"; trainingType: TrainingType; targetPlayerId?: string }
  | { type: "advanceDay" }
  | { type: "closeRecruitment" }
  | { type: "teamTalk"; tone: "motivar" | "exigir" | "calmar" }
  | { type: "setFormation"; formation: Formation }
  | { type: "setPlaystyle"; playstyle: Playstyle }
  | { type: "setLineup"; lineup: string[] }
  | { type: "setCaptain"; playerId: string }
  | { type: "setRoles"; penaltyTakerId?: string; freekickTakerId?: string; cornerTakerId?: string }
  | { type: "playMatch"; formation?: Formation; playstyle?: Playstyle; aggression?: number }
  | { type: "quickSim" }
  | { type: "simulateRound" };

export interface ActionResult {
  message?: string;
  matchId?: string;
  recruited?: boolean;
}

function clampPct(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function applyAction(state: CareerState, action: Action): ActionResult {
  const user = state.teams[state.userTeamId];

  switch (action.type) {
    case "advanceIntro":
      advanceFromIntro(state);
      return { message: "¡Comienza el draft inicial!" };

    case "draftPick": {
      if (state.phase !== "draft") return { message: "El draft ya está cerrado." };
      const picks = state.draftPicks ?? [];
      if (picks.includes(action.playerId)) return { message: "Ya elegiste a ese jugador." };
      if (picks.length >= MANUAL_PICKS) return { message: `Solo puedes elegir ${MANUAL_PICKS} jugadores.` };
      const candidate = picks.map((id) => state.players[id]);
      candidate.push(state.players[action.playerId]);
      const v = validateManualPicks(candidate.filter(Boolean) as Player[]);
      if (!v.ok) return { message: v.reason };
      state.draftPicks = [...picks, action.playerId];
      state.draftPicksNeeded = MANUAL_PICKS - state.draftPicks.length;
      return {};
    }

    case "draftRemove": {
      if (state.phase !== "draft") return {};
      state.draftPicks = (state.draftPicks ?? []).filter((id) => id !== action.playerId);
      state.draftPicksNeeded = MANUAL_PICKS - state.draftPicks.length;
      return {};
    }

    case "finalizeDraft": {
      if (state.phase !== "draft") return { message: "Fase incorrecta." };
      finalizeDraft(state);
      return { message: "Plantilla creada. ¡A reclutar más jugadores!" };
    }

    case "startConversation": {
      if (state.phase !== "recruitment") return { message: "Solo puedes negociar durante el reclutamiento." };
      let conv = state.conversations.find((c) => c.playerId === action.playerId);
      const player = state.players[action.playerId];
      if (!player) return { message: "Jugador no encontrado." };
      if (!conv) {
        conv = startConversation(player, user);
        state.conversations.push(conv);
      }
      return {};
    }

    case "sendApproach": {
      const conv = state.conversations.find((c) => c.playerId === action.playerId);
      if (!conv || conv.status !== "open") return { message: "Conversación no disponible." };
      if (!APPROACHES.find((a) => a.type === action.approach)) return { message: "Argumento inválido." };
      const out = sendApproach(state, conv, action.approach, action.text);
      if (out.promise) state.promises.push(out.promise);
      if (out.recruited) {
        const player = state.players[action.playerId];
        // añade a la plantilla; si está llena (26), sustituye al peor que no sea titular
        if (user.squad.length >= 26) {
          const worst = [...user.squad]
            .map((id) => state.players[id])
            .filter((p) => p && !user.lineup.includes(p.id))
            .sort((a, b) => a.overall - b.overall)[0];
          if (worst) user.squad = user.squad.filter((id) => id !== worst.id);
        }
        if (!user.squad.includes(player.id)) user.squad.push(player.id);
        user.rating = teamRating(user, state.players);
        user.chemistry = recomputeChemistry(user, state.players);
        return { message: `¡${player.name} se une a ${user.name}!`, recruited: true };
      }
      return { message: out.lost ? "Negociación fallida." : undefined };
    }

    case "training": {
      const msg = applyTraining(state, action.trainingType, makeLocalRng(state), action.targetPlayerId);
      return { message: msg };
    }

    case "advanceDay": {
      if (state.phase !== "recruitment") return { message: "Solo en reclutamiento." };
      const log = advanceRecruitmentDay(state);
      return { message: log.join(" ") || "Pasa un día." };
    }

    case "closeRecruitment": {
      if (state.phase !== "recruitment") return {};
      closeRecruitment(state);
      return { message: "¡Plazo cerrado! Comienza el Mundial." };
    }

    case "teamTalk": {
      const squad = user.squad.map((id) => state.players[id]).filter(Boolean) as Player[];
      let delta = 0;
      if (action.tone === "motivar") delta = 4;
      else if (action.tone === "exigir") delta = state.dressingRoom >= 55 ? 3 : -3;
      else delta = 2;
      squad.forEach((p) => (p.morale = clampPct(p.morale + delta)));
      state.dressingRoom = clampPct(state.dressingRoom + (delta > 0 ? 2 : -2));
      return { message: action.tone === "motivar" ? "Charla motivadora: la moral sube." : action.tone === "exigir" ? "Charla exigente: arriesgada pero directa." : "Charla calmada: bajas la tensión." };
    }

    case "setFormation": {
      if (!FORMATIONS[action.formation]) return { message: "Formación inválida." };
      user.formation = action.formation;
      user.lineup = autoLineup(user.squad.map((id) => state.players[id]), FORMATIONS[action.formation]);
      user.rating = teamRating(user, state.players);
      return { message: `Formación cambiada a ${action.formation}.` };
    }

    case "setPlaystyle":
      user.playstyle = action.playstyle;
      return { message: "Estilo de juego actualizado." };

    case "setLineup": {
      const valid = action.lineup.filter((id) => user.squad.includes(id));
      if (valid.length !== FORMATIONS[user.formation].length) {
        return { message: `El once debe tener ${FORMATIONS[user.formation].length} jugadores de tu plantilla.` };
      }
      user.lineup = valid;
      user.rating = teamRating(user, state.players);
      return { message: "Once inicial actualizado." };
    }

    case "setCaptain":
      if (!user.squad.includes(action.playerId)) return { message: "No está en tu plantilla." };
      user.captainId = action.playerId;
      return { message: "Nuevo capitán designado." };

    case "setRoles":
      if (action.penaltyTakerId) user.penaltyTakerId = action.penaltyTakerId;
      if (action.freekickTakerId) user.freekickTakerId = action.freekickTakerId;
      if (action.cornerTakerId) user.cornerTakerId = action.cornerTakerId;
      return { message: "Lanzadores actualizados." };

    case "playMatch": {
      const m = playUserMatch(state, {
        formation: action.formation,
        playstyle: action.playstyle,
        aggression: action.aggression,
      });
      return m ? { message: "Partido disputado.", matchId: m.id } : { message: "No hay partido pendiente." };
    }

    case "quickSim": {
      const m = playUserMatch(state, {});
      return m ? { message: "Partido simulado.", matchId: m.id } : { message: "No hay partido pendiente." };
    }

    case "simulateRound": {
      const ok = simulateRoundNoUser(state);
      return { message: ok ? "Ronda simulada." : "Tienes un partido pendiente que jugar." };
    }

    default:
      return { message: "Acción no reconocida." };
  }
}

// RNG ligero para acciones no críticas (entrenamiento).
function makeLocalRng(state: CareerState) {
  let a = (Date.now() ^ (state.day * 2654435761)) >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
