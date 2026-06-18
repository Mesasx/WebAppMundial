// ============================================================================
// Tipos del dominio del juego — Modo Manager Mundial
// ----------------------------------------------------------------------------
// Estos tipos describen el `CareerState`: el objeto que se serializa como JSON
// en `Career.state`. El motor de simulación opera exclusivamente sobre estos
// tipos, sin conocer nada de la base de datos ni de la UI.
// ============================================================================

export const POSITIONS = [
  "POR", // portero
  "LD",  // lateral derecho
  "DFC", // defensa central
  "LI",  // lateral izquierdo
  "MCD", // mediocentro defensivo
  "MC",  // mediocentro
  "MCO", // mediapunta
  "ED",  // extremo derecho
  "EI",  // extremo izquierdo
  "DC",  // delantero centro
  "SD",  // segundo delantero
] as const;

export type Position = (typeof POSITIONS)[number];

export type PositionGroup = "GK" | "DEF" | "MID" | "WNG" | "ATT";

export type Formation =
  | "4-3-3"
  | "4-2-3-1"
  | "4-4-2"
  | "3-5-2"
  | "3-4-3"
  | "5-3-2"
  | "4-1-2-1-2";

export type Difficulty = "easy" | "normal" | "hard" | "realistic" | "chaos";

export type Foot = "left" | "right" | "both";

export type Personality =
  | "lider"
  | "profesional"
  | "ambicioso"
  | "tranquilo"
  | "egocentrico"
  | "temperamental"
  | "humilde";

// Rasgos especiales visibles en las cartas de jugador.
export type Trait =
  | "Leyenda"
  | "Promesa"
  | "Líder"
  | "Frágil"
  | "Revulsivo"
  | "Killer"
  | "Muro"
  | "Cerebro"
  | "Velocista"
  | "Irregular"
  | "Clutch"
  | "Conflictivo"
  | "Profesional"
  | "Capitán natural";

export type RecruitDifficulty =
  | "facil"
  | "media"
  | "dificil"
  | "muy_dificil"
  | "casi_imposible";

// Atributos específicos por posición. No todos aplican a todos: se rellenan
// los relevantes y el resto queda en 0/undefined.
export interface PlayerAttributes {
  // Portero
  reflejos?: number;
  paradas?: number;
  juegoAereo?: number;
  saque?: number;
  unoContraUno?: number;
  colocacion?: number;
  // Defensa
  entrada?: number;
  marcaje?: number;
  fuerza?: number;
  anticipacion?: number;
  salidaBalon?: number;
  // Mediocentro
  paseCorto?: number;
  paseLargo?: number;
  vision?: number;
  resistencia?: number;
  defensa?: number;
  control?: number;
  decisiones?: number;
  // Extremo / ofensivo
  velocidad?: number;
  regate?: number;
  centro?: number;
  desborde?: number;
  definicion?: number;
  agilidad?: number;
  // Delantero
  desmarque?: number;
  remate?: number;
  sangreFria?: number;
}

// Estadísticas acumuladas durante el torneo.
export interface PlayerStats {
  matches: number;
  minutes: number;
  goals: number;
  assists: number;
  yellow: number;
  red: number;
  injuries: number;
  ratingSum: number; // suma de valoraciones para calcular media
  motm: number;      // veces MVP del partido
}

export interface Player {
  id: string;
  name: string;
  age: number;
  originCountry: string;     // país/federación histórica
  originFlag: string;        // emoji bandera
  club: string;
  clubLevel: number;         // 1-100, nivel del club
  position: Position;
  secondaryPositions: Position[];
  foot: Foot;
  height?: number;           // cm
  naturalRole: string;       // p.ej. "Goleador", "Organizador"

  overall: number;           // media 65-95
  potential: number;         // tope al que puede llegar
  prestige: number;          // prestigio histórico 0-100

  // Estado dinámico
  form: number;              // estado de forma 0-100
  morale: number;            // moral 0-100
  fatigue: number;           // fatiga 0-100 (más = peor)
  injuryRisk: number;        // riesgo base de lesión 0-100
  injuredDays: number;       // días que aún estará lesionado (0 = sano)

  // Personalidad / reclutamiento
  personality: Personality;
  ambition: number;          // 0-100
  loyalty: number;           // 0-100
  ego: number;               // 0-100
  persuadability: number;    // facilidad de ser convencido 0-100

  traits: Trait[];
  attributes: PlayerAttributes;
  stats: PlayerStats;

  // Equipo real de origen (para la "defección" al ficharlo en el draft).
  originTeamId?: string;

  // Marcadores de partida
  isInjuredSeriously?: boolean;
}

// Promesa hecha a un jugador durante el reclutamiento.
export interface Promise {
  id: string;
  playerId: string;
  type:
    | "titularidad"
    | "capitania"
    | "liderazgo"
    | "jugar_para_el"
    | "proyecto"
    | "ganar_mundial";
  label: string;
  kept: boolean | null; // null = aún sin resolver
  createdOnDay: number;
}

export interface ChatMessage {
  from: "manager" | "player";
  text: string;
  ts: number;
}

export interface Conversation {
  playerId: string;
  messages: ChatMessage[];
  // Disposición del jugador hacia unirse: 0-100. >=85 acepta, <20 se cierra.
  disposition: number;
  status: "open" | "recruited" | "rejected" | "lost";
  recruitDifficulty: RecruitDifficulty;
}

// Selección controlada por el usuario o rival.
export interface Team {
  id: string;
  name: string;
  baseCountry: string;
  flag: string;
  isUser: boolean;
  coachName: string;
  playstyle: Playstyle;
  formation: Formation;
  // ids de jugadores que forman la plantilla (hasta 26)
  squad: string[];
  // ids del once inicial (11) en orden de posición de la formación
  lineup: string[];
  captainId: string | null;
  penaltyTakerId: string | null;
  freekickTakerId: string | null;
  cornerTakerId: string | null;
  chemistry: number; // 0-100
  rating: number;    // media del equipo (cacheada)
  groupId?: string;
  // Estado de torneo
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  eliminated: boolean;
}

export type Playstyle =
  | "posesion"
  | "contraataque"
  | "presion_alta"
  | "bloque_bajo"
  | "juego_fisico"
  | "juego_directo"
  | "bandas"
  | "estrellas";

export interface MatchEvent {
  minute: number;
  type:
    | "goal"
    | "assist"
    | "yellow"
    | "red"
    | "injury"
    | "penalty"
    | "penalty_miss"
    | "sub"
    | "chance"
    | "save"
    | "info";
  teamId: string;
  playerId?: string;
  text: string;
}

export interface MatchResult {
  id: string;
  round: string;          // "Grupo - J1", "Octavos", "Final"...
  groupId?: string;
  homeTeamId: string;
  awayTeamId: string;
  homeGoals: number;
  awayGoals: number;
  homePenalties?: number; // tanda
  awayPenalties?: number;
  extraTime: boolean;
  penaltyShootout: boolean;
  events: MatchEvent[];
  involvesUser: boolean;
  played: boolean;
  // Crónica postpartido
  chronicle?: MatchChronicle;
  // posesión / tiros para la UI
  stats?: {
    homePossession: number;
    homeShots: number;
    awayShots: number;
    homeShotsOnTarget: number;
    awayShotsOnTarget: number;
  };
}

export interface MatchChronicle {
  headline: string;
  mvpPlayerId?: string;
  worstPlayerId?: string;
  tacticalKey: string;
  decisiveMoment: string;
  summary: string;
}

export interface NewsItem {
  id: string;
  day: number;
  category: "rumor" | "lesion" | "vestuario" | "prensa" | "torneo" | "viral";
  title: string;
  body: string;
  tone: "good" | "bad" | "neutral";
}

export interface Group {
  id: string;        // "A".."L"
  teamIds: string[];
}

export interface KnockoutTie {
  id: string;
  round: "32" | "16" | "QF" | "SF" | "F" | "3rd";
  matchId: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  winnerId: string | null;
  // referencias para rellenar (p.ej. "1A", "2B", "W49")
  homeRef: string;
  awayRef: string;
}

export interface TrainingSession {
  day: number;
  type:
    | "ataque"
    | "defensa"
    | "presion"
    | "balon_parado"
    | "penaltis"
    | "fisica"
    | "cohesion"
    | "descanso"
    | "individual";
  targetPlayerId?: string;
}

export interface CareerAwards {
  championId?: string;       // teamId campeón
  goldenBootId?: string;     // jugador máximo goleador
  goldenGloveId?: string;    // mejor portero
  goldenBallId?: string;     // mejor jugador
  revelationId?: string;     // jugador revelación
  bestXI?: string[];         // once ideal del torneo
}

// Objetivo de federación según el nivel del equipo.
export interface FederationObjective {
  label: string;
  targetRound: string; // "Octavos", "Cuartos", "Semifinal", "Final", "Campeón"
  met: boolean | null;
}

export interface CareerState {
  version: number;
  difficulty: Difficulty;
  phase:
    | "intro"
    | "create"
    | "draft"
    | "recruitment"
    | "groups"
    | "knockouts"
    | "finished";
  day: number;             // día actual (empieza en -14, kickoff = 0)
  registrationClosed: boolean;

  userTeamId: string;
  teams: Record<string, Team>;
  players: Record<string, Player>;

  groups: Group[];
  knockout: KnockoutTie[];
  matches: MatchResult[];
  schedule: string[];       // ids de matches en orden cronológico (resumen)

  news: NewsItem[];
  conversations: Conversation[];
  promises: Promise[];
  trainingLog: TrainingSession[];

  awards: CareerAwards;
  objective: FederationObjective;

  // Reputación / confianza
  boardConfidence: number;   // confianza de la federación 0-100
  fanConfidence: number;     // confianza de la afición 0-100
  dressingRoom: number;      // confianza del vestuario 0-100
  coachReputation: number;   // reputación del seleccionador 0-100

  // Draft en curso (sólo durante phase=draft). Nuevo formato:
  //   - 3 opciones de capitán (media >=90): se elige 1
  //   - varias opciones de estrella (media 85-89): se elige 1
  //   - el resto (24) se autocompleta con jugadores de media 67-84
  draftCaptainOptions?: string[];
  draftStarOptions?: string[];
  draftCaptainPick?: string | null;
  draftStarPick?: string | null;
  // (legacy, ya no se usa con el nuevo draft)
  draftPool?: string[];
  draftPicks?: string[];
  draftPicksNeeded?: number;

  // Agentes libres convencibles durante el reclutamiento.
  freeAgents?: string[];

  epilogue?: EpilogueEntry[];
  finalResult?: string;
  log: string[];             // registro narrativo breve
}

export interface EpilogueEntry {
  title: string;
  body: string;
}
