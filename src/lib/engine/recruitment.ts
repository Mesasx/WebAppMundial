// Motor de reclutamiento: chat narrativo con jugadores. Sistema de "disposición"
// (0-100) que sube/baja según los argumentos del seleccionador, la personalidad
// del jugador y las promesas. Arquitectura preparada para enchufar una IA real
// (local o API) sustituyendo `playerReply`, sin tocar la lógica de disposición.

import type {
  CareerState,
  Conversation,
  Player,
  Promise as GamePromise,
  RecruitDifficulty,
  Team,
} from "../types";
import { uid } from "./rng";

export type ApproachType =
  | "titularidad"
  | "capitania"
  | "liderazgo"
  | "jugar_para_el"
  | "proyecto"
  | "estilo"
  | "companeros"
  | "ganar_mundial";

export const APPROACHES: { type: ApproachType; label: string; promise?: GamePromise["type"] }[] = [
  { type: "titularidad", label: "Te prometo la titularidad", promise: "titularidad" },
  { type: "capitania", label: "Quiero que seas mi capitán", promise: "capitania" },
  { type: "liderazgo", label: "Serás el líder del vestuario", promise: "liderazgo" },
  { type: "jugar_para_el", label: "El equipo jugará para ti", promise: "jugar_para_el" },
  { type: "proyecto", label: "Te convenzo por el proyecto deportivo" },
  { type: "estilo", label: "Encajas en nuestro estilo de juego" },
  { type: "companeros", label: "Mira quién ya está en la plantilla" },
  { type: "ganar_mundial", label: "Vamos a ganar el Mundial juntos", promise: "ganar_mundial" },
];

// Dificultad de reclutamiento según media, ego, ambición, edad, prestigio.
export function recruitDifficulty(p: Player): RecruitDifficulty {
  let score = 0;
  score += (p.overall - 70) * 1.4;
  score += (p.ego - 40) * 0.6;
  score += (p.ambition - 40) * 0.4;
  score += (p.prestige - 50) * 0.5;
  if (p.age <= 23) score -= 8; // jóvenes más accesibles
  if (score < 8) return "facil";
  if (score < 20) return "media";
  if (score < 34) return "dificil";
  if (score < 48) return "muy_dificil";
  return "casi_imposible";
}

const DIFFICULTY_START: Record<RecruitDifficulty, number> = {
  facil: 60,
  media: 48,
  dificil: 38,
  muy_dificil: 28,
  casi_imposible: 18,
};

export function startConversation(player: Player, userTeam: Team): Conversation {
  const diff = recruitDifficulty(player);
  let disposition = DIFFICULTY_START[diff];
  // Si tu equipo ya es bueno, atrae más.
  disposition += (userTeam.rating - 75) * 0.5;
  disposition = clampDisp(disposition);
  return {
    playerId: player.id,
    messages: [
      {
        from: "player",
        text: openingLine(player),
        ts: Date.now(),
      },
    ],
    disposition,
    status: "open",
    recruitDifficulty: diff,
  };
}

function openingLine(p: Player): string {
  switch (p.personality) {
    case "egocentrico":
      return `Soy ${p.name}. Antes de nada: ¿qué papel tengo en TU equipo? No vine a calentar banquillo.`;
    case "ambicioso":
      return `${p.name} al habla. Solo me interesa un proyecto que pelee por todo. Convénceme.`;
    case "lider":
      return `Encantado, soy ${p.name}. Me gusta llevar el peso del vestuario. ¿Qué propones?`;
    case "temperamental":
      return `Dime rápido qué quieres. No tengo todo el día.`;
    case "humilde":
      return `Hola, soy ${p.name}. Solo quiero competir y ayudar. Cuéntame el plan.`;
    case "tranquilo":
      return `Buenas. Soy ${p.name}, escucho ofertas con calma. ¿Qué tienes en mente?`;
    default:
      return `Soy ${p.name}. Te escucho, ¿por qué debería unirme?`;
  }
}

// Efecto de cada argumento sobre la disposición, modulado por personalidad.
function approachEffect(approach: ApproachType, p: Player, team: Team): number {
  const base: Record<ApproachType, number> = {
    titularidad: 14,
    capitania: 16,
    liderazgo: 12,
    jugar_para_el: 13,
    proyecto: 10,
    estilo: 9,
    companeros: 8,
    ganar_mundial: 11,
  };
  let e = base[approach];
  // Personalidad modula.
  if (approach === "capitania" || approach === "liderazgo") {
    if (p.personality === "lider") e += 10;
    if (p.personality === "egocentrico") e += 6;
    if (p.personality === "humilde") e -= 3;
  }
  if (approach === "ganar_mundial" && p.ambition >= 65) e += 8;
  if (approach === "proyecto" && p.ambition >= 65) e += 5;
  if (approach === "companeros") e += Math.min(8, team.squad.length * 0.4);
  // Egos altos castigan promesas que no son sobre ellos.
  if (p.ego >= 70 && (approach === "estilo" || approach === "proyecto")) e -= 4;
  return e;
}

export interface ApproachOutcome {
  conversation: Conversation;
  reply: string;
  recruited: boolean;
  lost: boolean;
  promise?: GamePromise;
}

export function sendApproach(
  state: CareerState,
  conv: Conversation,
  approach: ApproachType,
  customText?: string,
): ApproachOutcome {
  const player = state.players[conv.playerId];
  const team = state.teams[state.userTeamId];
  conv.messages.push({ from: "manager", text: customText ?? APPROACHES.find((a) => a.type === approach)?.label ?? "", ts: Date.now() });

  let delta = approachEffect(approach, player, team);
  // Pequeña varianza para que no sea determinista perfecto.
  delta += Math.round((Math.random() * 6) - 3);
  // Penalización por repetir el mismo argumento.
  const repeats = conv.messages.filter((m) => m.from === "manager" && m.text === (customText ?? APPROACHES.find((a) => a.type === approach)?.label)).length;
  if (repeats > 1) delta -= 6;

  conv.disposition = clampDisp(conv.disposition + delta);

  // Registrar promesa si aplica.
  let promise: GamePromise | undefined;
  const def = APPROACHES.find((a) => a.type === approach);
  if (def?.promise) {
    promise = {
      id: uid("prom"),
      playerId: player.id,
      type: def.promise,
      label: def.label,
      kept: null,
      createdOnDay: state.day,
    };
  }

  // Resolver estado.
  let recruited = false;
  let lost = false;
  let reply: string;

  if (conv.disposition >= 85) {
    recruited = true;
    conv.status = "recruited";
    reply = acceptLine(player);
  } else if (conv.disposition <= 12) {
    lost = true;
    conv.status = "rejected";
    reply = rejectLine(player);
  } else {
    reply = ponderLine(player, delta, conv.disposition);
  }
  conv.messages.push({ from: "player", text: reply, ts: Date.now() });
  return { conversation: conv, reply, recruited, lost, promise };
}

function acceptLine(p: Player): string {
  const lines = [
    `¡Trato hecho! ${p.name} se une al proyecto. No te vas a arrepentir.`,
    `Me has convencido. Cuenta conmigo, vamos a por todas.`,
    `Vale, me gusta lo que oigo. Firmo. ¡A por el Mundial!`,
  ];
  return lines[Math.floor(Math.random() * lines.length)];
}

function rejectLine(p: Player): string {
  if (p.personality === "egocentrico") return `No me convence tu rollo. Hay proyectos mejores para alguien como yo. Paso.`;
  if (p.personality === "temperamental") return `Se acabó la charla. No insistas.`;
  return `Lo he pensado y no lo veo claro. Te lo agradezco, pero no.`;
}

function ponderLine(p: Player, delta: number, disp: number): string {
  if (delta <= 0) {
    const cold = [
      `Mmm, eso no me termina de convencer.`,
      `Te he dejado en visto medio segundo... sigo dudando.`,
      `No es suficiente. Necesito algo más.`,
    ];
    return cold[Math.floor(Math.random() * cold.length)];
  }
  if (disp >= 70) return `Me estás convenciendo... un último empujón y firmo.`;
  if (disp >= 50) return `Interesante. Cuéntame más, voy entrando.`;
  return `Lo escucho, pero todavía no lo tengo claro.`;
}

function clampDisp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

// Eventos de mercado: rivales pueden arrebatar a un convencible no fichado.
export function rivalPoaching(state: CareerState): string[] {
  const news: string[] = [];
  for (const conv of state.conversations) {
    if (conv.status !== "open") continue;
    // baja disposición = más probable que otra selección lo seduzca
    const risk = (100 - conv.disposition) / 400;
    if (Math.random() < risk) {
      conv.status = "lost";
      const p = state.players[conv.playerId];
      if (p) news.push(`Otra selección se ha adelantado por ${p.name}. Lo has perdido.`);
    }
  }
  return news;
}
