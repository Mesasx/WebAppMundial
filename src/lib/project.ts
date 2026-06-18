// Proyección del estado para el cliente: mantiene todo salvo que recorta el mapa
// de `players` a los jugadores realmente necesarios en la UI (plantilla del
// usuario, pool de draft, conversaciones, premios y jugadores citados en
// partidos del usuario). Reduce drásticamente el tamaño del payload sin perder
// funcionalidad.

import type { CareerState, Player } from "./types";

export type ProjectedState = CareerState;

export function projectState(state: CareerState): ProjectedState {
  const keep = new Set<string>();
  const user = state.teams[state.userTeamId];
  if (user) user.squad.forEach((id) => keep.add(id));
  (state.draftCaptainOptions ?? []).forEach((id) => keep.add(id));
  (state.draftStarOptions ?? []).forEach((id) => keep.add(id));
  if (state.draftCaptainPick) keep.add(state.draftCaptainPick);
  if (state.draftStarPick) keep.add(state.draftStarPick);
  (state.freeAgents ?? []).forEach((id) => keep.add(id));
  state.conversations.forEach((c) => keep.add(c.playerId));

  // premios y once ideal
  const aw = state.awards;
  [aw.goldenBallId, aw.goldenBootId, aw.goldenGloveId, aw.revelationId, aw.championId]
    .forEach((id) => id && keep.add(id));
  (aw.bestXI ?? []).forEach((id) => keep.add(id));

  // jugadores citados en partidos del usuario
  for (const m of state.matches) {
    if (!m.involvesUser) continue;
    m.events.forEach((e) => e.playerId && keep.add(e.playerId));
    if (m.chronicle?.mvpPlayerId) keep.add(m.chronicle.mvpPlayerId);
    if (m.chronicle?.worstPlayerId) keep.add(m.chronicle.worstPlayerId);
  }

  const players: Record<string, Player> = {};
  for (const id of keep) {
    if (state.players[id]) players[id] = state.players[id];
  }
  return { ...state, players };
}
