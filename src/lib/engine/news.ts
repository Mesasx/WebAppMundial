// Generador de noticias y narrativa del torneo.

import type { CareerState, NewsItem, Player } from "../types";
import { pick, RNG, uid } from "./rng";

export function addNews(
  state: CareerState,
  category: NewsItem["category"],
  title: string,
  body: string,
  tone: NewsItem["tone"] = "neutral",
): void {
  state.news.unshift({
    id: uid("news"),
    day: state.day,
    category,
    title,
    body,
    tone,
  });
  // limitar historial
  if (state.news.length > 120) state.news.length = 120;
}

const RUMORS = [
  "Un suplente pide más minutos antes del partido clave.",
  "La prensa internacional coloca a tu selección como tapada del torneo.",
  "El vestuario debate en privado el sistema de juego.",
  "Un veterano asegura que este equipo 'tiene algo especial'.",
  "Filtran que un crack rival no está al 100% físicamente.",
  "Una afición rival ya prepara pancartas contra su entrenador.",
  "Tu nombre suena para dirigir un grande tras el Mundial.",
];

const VIRALS = [
  "Un meme sobre tu portero arrasa en redes: lo llaman 'El Muro'.",
  "El baile de celebración de un jugador se vuelve viral.",
  "Un periodista predice tu eliminación... y se hace tendencia.",
  "El cántico inventado por tu afición ya tiene remix.",
];

export function dailyFlavorNews(state: CareerState, rng: RNG): void {
  if (rng() < 0.5) addNews(state, "rumor", "Rumores en la concentración", pick(rng, RUMORS), "neutral");
  if (rng() < 0.25) addNews(state, "viral", "Se hace viral", pick(rng, VIRALS), "good");
}

export function matchNews(
  state: CareerState,
  won: boolean,
  drew: boolean,
  rival: string,
  scoreline: string,
  rng: RNG,
): void {
  if (won) {
    addNews(state, "prensa", "Victoria celebrada", `La prensa elogia el ${scoreline} ante ${rival}. La afición sueña.`, "good");
  } else if (drew) {
    addNews(state, "prensa", "Empate con sabor agridulce", `${scoreline} ante ${rival}. Hay debate sobre el planteamiento.`, "neutral");
  } else {
    addNews(state, "prensa", "Derrota dolorosa", `Caída por ${scoreline} ante ${rival}. Crecen las dudas en el entorno.`, "bad");
    if (rng() < 0.4) addNews(state, "vestuario", "Tensión en el vestuario", "El vestuario duda del sistema tras la derrota.", "bad");
  }
}

export function injuryNews(state: CareerState, player: Player): void {
  addNews(state, "lesion", "Parte médico", `${player.name} sufre una lesión y estará ${player.injuredDays} días de baja.`, "bad");
}
