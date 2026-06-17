// ============================================================================
// Dataset inicial de jugadores (datos públicos).
// ----------------------------------------------------------------------------
// Sólo se usan NOMBRES como datos públicos. Edad/club/posición son aproximados
// e inspirados en información pública. Las "señales" (tier/clubLevel/prestige)
// alimentan el sistema de valoración propio de la app (ver engine/ratings.ts):
// la app genera SUS PROPIAS medias y atributos, sin copiar valores con licencia.
//
// La estructura está preparada para importar más datos desde JSON/CSV/API
// pública: basta con producir objetos `PlayerSeed`.
// ============================================================================

import type { Foot, Position } from "@/lib/types";

export interface PlayerSeed {
  name: string;
  age: number;
  country: string;
  flag: string;
  club: string;
  clubLevel: number; // 0-100
  position: Position;
  secondary?: Position[];
  foot: Foot;
  height?: number;
  prestige: number; // 0-100
  tier: number;     // 1-5 señal de nivel actual
}

// Banderas como identidad visual (emoji). NUNCA escudos/logos con licencia.
export const FLAGS: Record<string, string> = {
  Argentina: "🇦🇷",
  Brasil: "🇧🇷",
  Francia: "🇫🇷",
  España: "🇪🇸",
  Inglaterra: "🏴",
  Portugal: "🇵🇹",
  Alemania: "🇩🇪",
  Países_Bajos: "🇳🇱",
  Bélgica: "🇧🇪",
  Italia: "🇮🇹",
  Croacia: "🇭🇷",
  Uruguay: "🇺🇾",
  Marruecos: "🇲🇦",
  Japón: "🇯🇵",
  EEUU: "🇺🇸",
  México: "🇲🇽",
  Noruega: "🇳🇴",
  Egipto: "🇪🇬",
  Polonia: "🇵🇱",
  Senegal: "🇸🇳",
  Colombia: "🇨🇴",
  Corea_del_Sur: "🇰🇷",
  Canadá: "🇨🇦",
  Nigeria: "🇳🇬",
  Suiza: "🇨🇭",
  Dinamarca: "🇩🇰",
  Serbia: "🇷🇸",
  Austria: "🇦🇹",
  Ecuador: "🇪🇨",
};

const f = (c: string) => FLAGS[c] ?? "🏳️";

// Helper compacto para declarar seeds.
function p(
  name: string,
  age: number,
  country: string,
  club: string,
  clubLevel: number,
  position: Position,
  prestige: number,
  tier: number,
  foot: Foot = "right",
  secondary: Position[] = [],
): PlayerSeed {
  return {
    name,
    age,
    country,
    flag: f(country),
    club,
    clubLevel,
    position,
    secondary,
    foot,
    prestige,
    tier,
  };
}

export const PLAYER_SEEDS: PlayerSeed[] = [
  // ---- Porteros ----
  p("Emiliano Martínez", 33, "Argentina", "Aston Villa", 80, "POR", 88, 4, "right"),
  p("Thibaut Courtois", 33, "Bélgica", "Real Madrid", 92, "POR", 88, 5, "left"),
  p("Gianluigi Donnarumma", 26, "Italia", "Man City", 90, "POR", 82, 5, "right"),
  p("Alisson", 33, "Brasil", "Liverpool", 88, "POR", 85, 4, "right"),
  p("Unai Simón", 28, "España", "Athletic", 78, "POR", 72, 4, "right"),
  p("Yann Sommer", 36, "Suiza", "Inter", 82, "POR", 70, 3, "right"),
  p("Andries Noppert", 31, "Países_Bajos", "Heerenveen", 60, "POR", 55, 2, "right"),
  p("Matt Turner", 31, "EEUU", "Lyon", 68, "POR", 58, 2, "right"),

  // ---- Laterales derechos ----
  p("Achraf Hakimi", 26, "Marruecos", "PSG", 90, "LD", 82, 5, "right", ["ED"]),
  p("Trent Alexander-Arnold", 27, "Inglaterra", "Real Madrid", 92, "LD", 80, 4, "right", ["MC"]),
  p("Dani Carvajal", 33, "España", "Real Madrid", 92, "LD", 80, 4, "right"),
  p("Jules Koundé", 26, "Francia", "Barcelona", 88, "LD", 76, 4, "right", ["DFC"]),
  p("Sergiño Dest", 24, "EEUU", "PSV", 74, "LD", 64, 3, "right", ["LI"]),

  // ---- Centrales ----
  p("Virgil van Dijk", 34, "Países_Bajos", "Liverpool", 88, "DFC", 90, 4, "right"),
  p("Rúben Dias", 28, "Portugal", "Man City", 90, "DFC", 82, 5, "right"),
  p("William Saliba", 24, "Francia", "Arsenal", 88, "DFC", 74, 4, "right"),
  p("Antonio Rüdiger", 32, "Alemania", "Real Madrid", 92, "DFC", 80, 4, "right"),
  p("Josko Gvardiol", 24, "Croacia", "Man City", 90, "DFC", 72, 4, "left", ["LI"]),
  p("Cristian Romero", 27, "Argentina", "Tottenham", 80, "DFC", 78, 4, "right"),
  p("Pau Cubarsí", 19, "España", "Barcelona", 88, "DFC", 60, 3, "right"),
  p("Marquinhos", 31, "Brasil", "PSG", 90, "DFC", 82, 4, "right"),
  p("Nico Schlotterbeck", 26, "Alemania", "Dortmund", 80, "DFC", 66, 3, "left"),

  // ---- Laterales izquierdos ----
  p("Theo Hernández", 28, "Francia", "Milan", 84, "LI", 78, 4, "left", ["EI"]),
  p("Alphonso Davies", 25, "Canadá", "Bayern", 90, "LI", 76, 4, "left", ["EI"]),
  p("Alejandro Grimaldo", 30, "España", "Leverkusen", 82, "LI", 70, 4, "left", ["EI"]),
  p("Nuno Mendes", 23, "Portugal", "PSG", 90, "LI", 70, 4, "left"),
  p("Antonee Robinson", 28, "EEUU", "Fulham", 74, "LI", 62, 3, "left"),

  // ---- Mediocentros defensivos ----
  p("Rodri", 29, "España", "Man City", 92, "MCD", 88, 5, "right", ["MC"]),
  p("Declan Rice", 27, "Inglaterra", "Arsenal", 88, "MCD", 80, 4, "right", ["MC"]),
  p("Aurélien Tchouaméni", 25, "Francia", "Real Madrid", 92, "MCD", 76, 4, "right", ["DFC"]),
  p("Joshua Kimmich", 30, "Alemania", "Bayern", 90, "MCD", 84, 4, "right", ["LD", "MC"]),
  p("Casemiro", 33, "Brasil", "Man Utd", 80, "MCD", 82, 3, "right"),
  p("Sofyan Amrabat", 29, "Marruecos", "Fenerbahçe", 72, "MCD", 66, 3, "right"),

  // ---- Mediocentros ----
  p("Jude Bellingham", 22, "Inglaterra", "Real Madrid", 92, "MC", 84, 5, "right", ["MCO"]),
  p("Federico Valverde", 27, "Uruguay", "Real Madrid", 92, "MC", 82, 5, "right", ["MCD", "LD"]),
  p("Pedri", 23, "España", "Barcelona", 88, "MC", 78, 4, "right", ["MCO"]),
  p("Frenkie de Jong", 28, "Países_Bajos", "Barcelona", 88, "MC", 80, 4, "right", ["MCD"]),
  p("Eduardo Camavinga", 23, "Francia", "Real Madrid", 92, "MC", 72, 4, "left", ["MCD", "LI"]),
  p("Nicolò Barella", 28, "Italia", "Inter", 86, "MC", 78, 4, "right", ["MCO"]),
  p("Gavi", 21, "España", "Barcelona", 88, "MC", 70, 4, "right"),
  p("Alexis Mac Allister", 27, "Argentina", "Liverpool", 88, "MC", 76, 4, "right", ["MCO"]),
  p("Warren Zaïre-Emery", 19, "Francia", "PSG", 90, "MC", 60, 3, "right"),

  // ---- Mediapuntas ----
  p("Kevin De Bruyne", 34, "Bélgica", "Napoli", 80, "MCO", 90, 4, "right", ["MC"]),
  p("Bruno Fernandes", 31, "Portugal", "Man Utd", 80, "MCO", 82, 4, "right", ["MC"]),
  p("Martin Ødegaard", 27, "Noruega", "Arsenal", 88, "MCO", 78, 4, "left", ["MC"]),
  p("Florian Wirtz", 22, "Alemania", "Leverkusen", 86, "MCO", 74, 5, "right", ["EI"]),
  p("Cole Palmer", 23, "Inglaterra", "Chelsea", 82, "MCO", 72, 4, "left", ["ED"]),
  p("Enzo Fernández", 25, "Argentina", "Chelsea", 82, "MCO", 74, 4, "right", ["MC"]),

  // ---- Extremos derechos ----
  p("Mohamed Salah", 33, "Egipto", "Liverpool", 88, "ED", 90, 4, "left", ["DC"]),
  p("Bukayo Saka", 24, "Inglaterra", "Arsenal", 88, "ED", 78, 5, "left", ["EI"]),
  p("Lamine Yamal", 18, "España", "Barcelona", 88, "ED", 70, 5, "left"),
  p("Ousmane Dembélé", 28, "Francia", "PSG", 90, "ED", 78, 5, "left", ["EI"]),
  p("Federico Chiesa", 28, "Italia", "Liverpool", 84, "ED", 70, 3, "right", ["EI"]),
  p("Brahim Díaz", 26, "Marruecos", "Real Madrid", 92, "ED", 66, 3, "left", ["MCO"]),

  // ---- Extremos izquierdos ----
  p("Vinícius Júnior", 25, "Brasil", "Real Madrid", 92, "EI", 86, 5, "right", ["DC"]),
  p("Rafael Leão", 26, "Portugal", "Milan", 84, "EI", 74, 4, "right", ["DC"]),
  p("Nico Williams", 23, "España", "Athletic", 78, "EI", 70, 4, "right", ["ED"]),
  p("Khvicha Kvaratskhelia", 25, "Croacia", "PSG", 90, "EI", 76, 5, "right"),
  p("Michael Olise", 24, "Francia", "Bayern", 90, "ED", 70, 4, "left", ["EI"]),
  p("Jérémy Doku", 23, "Bélgica", "Man City", 90, "EI", 64, 4, "right", ["ED"]),

  // ---- Delanteros centro ----
  p("Erling Haaland", 25, "Noruega", "Man City", 92, "DC", 88, 5, "left"),
  p("Kylian Mbappé", 27, "Francia", "Real Madrid", 92, "DC", 92, 5, "right", ["EI"]),
  p("Harry Kane", 32, "Inglaterra", "Bayern", 90, "DC", 88, 5, "right", ["MCO"]),
  p("Lautaro Martínez", 28, "Argentina", "Inter", 86, "DC", 82, 5, "right", ["SD"]),
  p("Victor Osimhen", 27, "Nigeria", "Galatasaray", 76, "DC", 78, 4, "right"),
  p("Julián Álvarez", 26, "Argentina", "Atlético", 86, "DC", 78, 5, "right", ["SD"]),
  p("Dušan Vlahović", 26, "Serbia", "Juventus", 82, "DC", 70, 3, "left"),
  p("Randal Kolo Muani", 27, "Francia", "PSG", 90, "DC", 66, 3, "right", ["SD"]),
  p("Hugo Ekitike", 23, "Francia", "Liverpool", 88, "DC", 60, 3, "left"),
  p("Benjamin Šeško", 22, "Serbia", "Man Utd", 80, "DC", 62, 4, "right"),

  // ---- Segundos delanteros / versátiles ofensivos ----
  p("Lionel Messi", 38, "Argentina", "Inter Miami", 70, "SD", 99, 4, "left", ["ED", "MCO"]),
  p("Cristiano Ronaldo", 41, "Portugal", "Al-Nassr", 66, "SD", 99, 3, "right", ["DC"]),
  p("Antoine Griezmann", 34, "Francia", "Atlético", 86, "SD", 82, 4, "left", ["MCO", "DC"]),
  p("Phil Foden", 25, "Inglaterra", "Man City", 92, "SD", 76, 4, "right", ["MCO", "EI"]),
  p("João Félix", 26, "Portugal", "Benfica", 80, "SD", 64, 3, "left", ["DC"]),
  p("Takefusa Kubo", 24, "Japón", "Real Sociedad", 78, "SD", 64, 3, "left", ["ED"]),

  // ---- Más profundidad por nación (rellenos de calidad media) ----
  p("Manuel Akanji", 30, "Suiza", "Inter", 84, "DFC", 70, 4, "right", ["LD"]),
  p("Granit Xhaka", 33, "Suiza", "Leverkusen", 84, "MC", 72, 4, "left", ["MCD"]),
  p("Kaoru Mitoma", 28, "Japón", "Brighton", 78, "EI", 66, 4, "right"),
  p("Wataru Endo", 32, "Japón", "Liverpool", 84, "MCD", 60, 3, "right"),
  p("Hirving Lozano", 30, "México", "San Diego", 68, "ED", 64, 3, "right", ["EI"]),
  p("Edson Álvarez", 28, "México", "West Ham", 76, "MCD", 64, 3, "right", ["DFC"]),
  p("Santiago Giménez", 24, "México", "Milan", 80, "DC", 62, 4, "right"),
  p("Christian Pulisic", 27, "EEUU", "Milan", 82, "EI", 70, 4, "right", ["ED", "MCO"]),
  p("Weston McKennie", 27, "EEUU", "Juventus", 80, "MC", 64, 3, "right"),
  p("Yunus Musah", 23, "EEUU", "Milan", 80, "MC", 58, 3, "right"),
  p("Pierre-Emile Højbjerg", 30, "Dinamarca", "Marsella", 80, "MCD", 66, 3, "right"),
  p("Rasmus Højlund", 23, "Dinamarca", "Napoli", 80, "DC", 62, 3, "right"),
  p("Christian Eriksen", 34, "Dinamarca", "Wolfsburg", 70, "MCO", 76, 3, "right", ["MC"]),
  p("Piotr Zieliński", 31, "Polonia", "Inter", 86, "MC", 70, 3, "left", ["MCO"]),
  p("Robert Lewandowski", 37, "Polonia", "Barcelona", 88, "DC", 90, 4, "right"),
  p("Wojciech Szczęsny", 35, "Polonia", "Barcelona", 88, "POR", 76, 3, "right"),
  p("Dušan Tadić", 37, "Serbia", "Al-Wahda", 60, "MCO", 68, 2, "left", ["EI"]),
  p("Luka Modrić", 40, "Croacia", "Milan", 84, "MC", 92, 3, "right", ["MCO"]),
  p("Mateo Kovačić", 31, "Croacia", "Man City", 92, "MC", 74, 4, "right", ["MCD"]),
  p("Ismaël Bennacer", 28, "Marruecos", "Milan", 82, "MC", 64, 3, "left", ["MCD"]),
  p("Youssef En-Nesyri", 28, "Marruecos", "Fenerbahçe", 72, "DC", 66, 3, "right"),
  p("Sadio Mané", 33, "Senegal", "Al-Nassr", 66, "EI", 82, 3, "right", ["DC"]),
  p("Nicolas Jackson", 24, "Senegal", "Bayern", 90, "DC", 62, 3, "right"),
  p("Kalidou Koulibaly", 34, "Senegal", "Al-Hilal", 64, "DFC", 76, 3, "left"),
  p("Ademola Lookman", 28, "Nigeria", "Atalanta", 82, "EI", 70, 4, "left", ["DC"]),
  p("Moisés Caicedo", 24, "Ecuador", "Chelsea", 82, "MCD", 70, 4, "right", ["MC"]),
  p("Luis Díaz", 29, "Colombia", "Bayern", 90, "EI", 76, 4, "left", ["DC"]),
  p("James Rodríguez", 34, "Colombia", "León", 60, "MCO", 76, 2, "left", ["EI"]),
  p("Heung-min Son", 33, "Corea_del_Sur", "LAFC", 70, "EI", 82, 3, "right", ["DC"]),
  p("David Alaba", 33, "Austria", "Real Madrid", 92, "DFC", 78, 3, "left", ["LI", "MCD"]),
];
