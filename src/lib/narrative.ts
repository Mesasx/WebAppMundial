// Contenido narrativo de la introducción cinematográfica.

export interface GameCharacter {
  id: string;
  name: string;
  role: string;
  file: string;  // /characters/<file> (si existe se muestra; si no, emoji)
  emoji: string;
}

// Reparto de personajes (ilustraciones propias en /public/characters).
export const CHARACTERS: Record<string, GameCharacter> = {
  funcionario: { id: "funcionario", name: "Don Ramiro", role: "Funcionario de la FIFA", file: "/characters/funcionario.png", emoji: "🗂️" },
  presidente: { id: "presidente", name: "El Presidente", role: "Presidente de tu federación", file: "/characters/presidente.png", emoji: "🎩" },
  seleccionador: { id: "seleccionador", name: "Tú", role: "Nuevo seleccionador", file: "/characters/seleccionador.png", emoji: "🧑‍💼" },
  analista: { id: "analista", name: "Leo", role: "Analista de datos", file: "/characters/analista.png", emoji: "📊" },
  veterano: { id: "veterano", name: "El Míster", role: "Segundo entrenador", file: "/characters/veterano.png", emoji: "🧤" },
};

export interface IntroSlide {
  title: string;
  text: string;
  emoji: string;
  character?: GameCharacter;
}

export const INTRO_SLIDES: IntroSlide[] = [
  {
    emoji: "🌍",
    title: "Faltan 14 días",
    text: "Verano de 2026. Estados Unidos, México y Canadá preparan el Mundial más grande de la historia: 48 selecciones, millones de aficionados, un planeta entero conteniendo la respiración.",
  },
  {
    emoji: "🗂️",
    title: "El Apagón",
    text: "«¡Se ha borrado TODO!». Don Ramiro, funcionario de la FIFA, corre por los pasillos con una montaña de carpetas. Un colapso administrativo global ha hecho lo impensable: todos los futbolistas han perdido formalmente su nacionalidad deportiva. Los registros ya no existen.",
    character: CHARACTERS.funcionario,
  },
  {
    emoji: "🎩",
    title: "El Presidente te llama",
    text: "«Te he elegido a ti.» El presidente de tu federación te señala desde el palco. No hay plantilla, no hay jugadores, no hay tiempo. Hay una norma de emergencia: cada federación reconstruye su selección DESDE CERO antes del cierre de listas. Quien convenza a los mejores, jugará el Mundial.",
    character: CHARACTERS.presidente,
  },
  {
    emoji: "🧑‍💼",
    title: "Tu primer día",
    text: "Pizarra en mano, te plantas en el banquillo. Eres el nuevo seleccionador. Dos semanas, tu olfato y tu palabra para convencer a futbolistas de todo el mundo de vestir tu camiseta.",
    character: CHARACTERS.seleccionador,
  },
  {
    emoji: "📊",
    title: "El cuerpo técnico",
    text: "No estás solo. Leo, tu analista, ya cruza datos en la tablet buscando gangas; y el Míster, un veterano de mil batallas, prepara la pizarra táctica. «Jefe, con dos buenos fichajes y trabajo, damos la sorpresa.»",
    character: CHARACTERS.analista,
  },
  {
    emoji: "🔥",
    title: "Empieza la leyenda",
    text: "Da igual el país que elijas o el nombre que inventes: esta selección nace hoy, contigo. Haz tu draft, convence a tus jugadores, gestiona el vestuario y conquista el mundo. La historia de una nueva nación futbolística está a punto de escribirse.",
    character: CHARACTERS.veterano,
  },
];

export const DIFFICULTY_INFO: Record<string, { label: string; desc: string }> = {
  easy: { label: "Fácil", desc: "Cracks fáciles de convencer, rivales blandos, vestuario paciente." },
  normal: { label: "Normal", desc: "Experiencia equilibrada. Recomendado para empezar." },
  hard: { label: "Difícil", desc: "Rivales fuertes, negociaciones duras, prensa exigente." },
  realistic: { label: "Realista", desc: "Todo cuenta: lesiones, fatiga y moral pesan de verdad." },
  chaos: { label: "Caótico", desc: "Máxima aleatoriedad. Cualquier cosa puede pasar." },
};

// Ideas de nombres para selecciones inventadas.
export const NATION_NAME_IDEAS = [
  "Nueva España", "República de Iberia", "Atlántida FC Nacional", "Reino del Sol",
  "Confederación Austral", "Estados de Pangea", "Unión del Pacífico", "Imperio Boreal",
];
