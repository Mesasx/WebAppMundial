// Contenido narrativo de la introducción cinematográfica.

export interface IntroSlide {
  title: string;
  text: string;
  emoji: string;
}

export const INTRO_SLIDES: IntroSlide[] = [
  {
    emoji: "🌍",
    title: "Faltan 14 días",
    text: "Verano de 2026. Estados Unidos, México y Canadá preparan el Mundial más grande de la historia. 48 selecciones, millones de aficionados, un planeta entero conteniendo la respiración.",
  },
  {
    emoji: "📡",
    title: "El Apagón",
    text: "Y entonces ocurre. Un fallo administrativo global, un colapso diplomático absurdo y una pérdida masiva de datos hacen lo impensable: TODOS los futbolistas convocables pierden formalmente su nacionalidad deportiva. Los registros se han borrado.",
  },
  {
    emoji: "⚖️",
    title: "Caos en las federaciones",
    text: "Nadie recuerda por quién juega. Las estrellas vagan sin selección. Los abogados huyen. La FIFA improvisa una norma desesperada: cada federación debe reconstruir su selección DESDE CERO antes del cierre de listas. Quien convenza a los mejores, jugará el Mundial.",
  },
  {
    emoji: "🎙️",
    title: "Te toca a ti",
    text: "En medio del caos, una federación te llama. Te nombran nuevo seleccionador. No tienes plantilla, no tienes jugadores, no tienes tiempo. Solo tienes dos semanas, tu olfato y tu palabra. Vas a tener que convencer a futbolistas de todo el mundo de vestir tu camiseta.",
  },
  {
    emoji: "🔥",
    title: "Empieza la leyenda",
    text: "Da igual el país que elijas o el nombre que inventes: esta selección nace hoy, contigo. Haz tu draft, convence a tus jugadores, gestiona el vestuario y conquista el mundo. La historia de una nueva nación futbolística está a punto de escribirse.",
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
