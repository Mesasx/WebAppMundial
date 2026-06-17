// Servicio de carreras: puente entre la base de datos (Career.state JSON) y el
// motor de juego. Carga/guarda estado y deriva metadatos para listados.

import { prisma } from "./db";
import type { CareerState } from "./types";

const PHASE_LABEL: Record<CareerState["phase"], string> = {
  intro: "Introducción",
  create: "Creación",
  draft: "Draft inicial",
  recruitment: "Reclutamiento",
  groups: "Fase de grupos",
  knockouts: "Eliminatorias",
  finished: "Finalizada",
};

export function deriveMeta(state: CareerState) {
  const user = state.teams[state.userTeamId];
  return {
    nationName: user?.name ?? "Selección",
    baseCountry: user?.baseCountry ?? "",
    difficulty: state.difficulty,
    phase: state.phase,
    stageLabel: PHASE_LABEL[state.phase],
    finished: state.phase === "finished",
    result: state.finalResult ?? null,
  };
}

export async function saveCareer(id: string, state: CareerState) {
  const meta = deriveMeta(state);
  await prisma.career.update({
    where: { id },
    data: {
      state: JSON.stringify(state),
      nationName: meta.nationName,
      baseCountry: meta.baseCountry,
      difficulty: meta.difficulty,
      phase: meta.phase,
      stageLabel: meta.stageLabel,
      finished: meta.finished,
      result: meta.result,
    },
  });
}

export async function loadCareer(id: string, userId: string): Promise<{ state: CareerState } | null> {
  const career = await prisma.career.findUnique({ where: { id } });
  if (!career || career.userId !== userId) return null;
  return { state: JSON.parse(career.state) as CareerState };
}
