// Entrenamientos: mejoran ligeramente atributos/forma/química a cambio de
// fatiga y algo de riesgo de lesión. El descanso reduce fatiga.

import type { CareerState, Player, TrainingSession } from "../types";
import { clamp } from "./ratings";
import { RNG } from "./rng";

export type TrainingType = TrainingSession["type"];

export const TRAININGS: { type: TrainingType; label: string; desc: string }[] = [
  { type: "ataque", label: "Ataque", desc: "Mejora definición y desmarques. +fatiga." },
  { type: "defensa", label: "Defensa", desc: "Mejora marcaje y entradas. +fatiga." },
  { type: "presion", label: "Presión", desc: "Mejora intensidad. ++fatiga." },
  { type: "balon_parado", label: "Balón parado", desc: "Mejora centros y remates de cabeza." },
  { type: "penaltis", label: "Penaltis", desc: "Mejora sangre fría desde los 11m." },
  { type: "fisica", label: "Física", desc: "Sube resistencia, baja forma a corto, ++fatiga." },
  { type: "cohesion", label: "Cohesión", desc: "Sube la química del grupo. -fatiga leve." },
  { type: "descanso", label: "Descanso", desc: "Reduce fatiga y riesgo de lesión." },
  { type: "individual", label: "Individual", desc: "Mejora a un jugador concreto." },
];

export function applyTraining(
  state: CareerState,
  type: TrainingType,
  rng: RNG,
  targetPlayerId?: string,
): string {
  const team = state.teams[state.userTeamId];
  const squad = team.squad.map((id) => state.players[id]).filter(Boolean) as Player[];

  const bump = (p: Player, key: keyof Player["attributes"], amt: number) => {
    const cur = p.attributes[key];
    if (cur != null) p.attributes[key] = clamp(cur + amt, 30, 99);
  };

  let msg = "";
  switch (type) {
    case "ataque":
      squad.forEach((p) => { bump(p, "definicion", rng() < 0.4 ? 1 : 0); p.fatigue = clamp(p.fatigue + 6, 0, 100); });
      msg = "Sesión de ataque completada. El equipo afina la puntería.";
      break;
    case "defensa":
      squad.forEach((p) => { bump(p, "marcaje", rng() < 0.4 ? 1 : 0); p.fatigue = clamp(p.fatigue + 6, 0, 100); });
      msg = "Trabajo defensivo intenso. La línea está más ordenada.";
      break;
    case "presion":
      squad.forEach((p) => { bump(p, "resistencia", rng() < 0.3 ? 1 : 0); p.fatigue = clamp(p.fatigue + 10, 0, 100); });
      msg = "Presión alta ensayada. Cuidado con la fatiga.";
      break;
    case "balon_parado":
      squad.forEach((p) => { bump(p, "centro", rng() < 0.3 ? 1 : 0); bump(p, "juegoAereo", rng() < 0.3 ? 1 : 0); p.fatigue = clamp(p.fatigue + 4, 0, 100); });
      msg = "Estrategia a balón parado pulida.";
      break;
    case "penaltis":
      squad.forEach((p) => bump(p, "sangreFria", rng() < 0.35 ? 1 : 0));
      msg = "Tanda de penaltis practicada. Más frialdad desde los 11m.";
      break;
    case "fisica":
      squad.forEach((p) => { bump(p, "resistencia", rng() < 0.5 ? 1 : 0); p.form = clamp(p.form - 3, 0, 100); p.fatigue = clamp(p.fatigue + 12, 0, 100); });
      msg = "Carga física fuerte. La forma baja a corto plazo, pero suma fondo.";
      break;
    case "cohesion":
      team.chemistry = clamp(team.chemistry + 3, 0, 100);
      squad.forEach((p) => { p.morale = clamp(p.morale + 2, 0, 100); p.fatigue = clamp(p.fatigue - 2, 0, 100); });
      msg = "Actividad de grupo. La química mejora.";
      break;
    case "descanso":
      squad.forEach((p) => { p.fatigue = clamp(p.fatigue - 18, 0, 100); p.injuryRisk = clamp(p.injuryRisk - 3, 2, 100); p.form = clamp(p.form + 1, 0, 100); });
      msg = "Día de recuperación. El equipo llega más fresco.";
      break;
    case "individual": {
      const p = targetPlayerId ? state.players[targetPlayerId] : squad[0];
      if (p) {
        if (p.overall < p.potential && rng() < 0.5) p.overall = clamp(p.overall + 1, 65, 95);
        p.form = clamp(p.form + 4, 0, 100);
        p.fatigue = clamp(p.fatigue + 5, 0, 100);
        msg = `Entrenamiento individual con ${p.name}. Progresa.`;
      } else {
        msg = "No hay jugador objetivo para el entrenamiento individual.";
      }
      break;
    }
  }

  // pequeño riesgo de lesión en sesiones exigentes
  if (["presion", "fisica"].includes(type)) {
    for (const p of squad) {
      if (rng() < (p.injuryRisk / 100) * 0.04) {
        p.injuredDays = Math.max(p.injuredDays, 2 + Math.floor(rng() * 6));
        msg += ` ${p.name} se resiente y necesita descanso.`;
        break;
      }
    }
  }

  state.trainingLog.push({ day: state.day, type, targetPlayerId });
  return msg;
}
