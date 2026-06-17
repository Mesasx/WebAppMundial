// Naciones para el universo del Mundial 2026 (formato 48 selecciones).
// Identidad visual = BANDERA (emoji). Nunca escudos/logos con licencia.
// `pot` agrupa por bombos (1 = cabezas de serie). `strength` orienta el nivel
// de las plantillas rivales generadas proceduralmente.

export interface Nation {
  name: string;
  flag: string;
  pot: 1 | 2 | 3 | 4;
  strength: number; // 50-92 nivel medio orientativo
}

export const NATIONS: Nation[] = [
  // Pot 1
  { name: "Argentina", flag: "🇦🇷", pot: 1, strength: 90 },
  { name: "Francia", flag: "🇫🇷", pot: 1, strength: 90 },
  { name: "España", flag: "🇪🇸", pot: 1, strength: 89 },
  { name: "Inglaterra", flag: "🏴", pot: 1, strength: 88 },
  { name: "Brasil", flag: "🇧🇷", pot: 1, strength: 88 },
  { name: "Portugal", flag: "🇵🇹", pot: 1, strength: 87 },
  { name: "Países Bajos", flag: "🇳🇱", pot: 1, strength: 86 },
  { name: "Alemania", flag: "🇩🇪", pot: 1, strength: 86 },
  { name: "Estados Unidos", flag: "🇺🇸", pot: 1, strength: 78 },
  { name: "México", flag: "🇲🇽", pot: 1, strength: 78 },
  { name: "Canadá", flag: "🇨🇦", pot: 1, strength: 76 },
  { name: "Bélgica", flag: "🇧🇪", pot: 1, strength: 85 },
  // Pot 2
  { name: "Croacia", flag: "🇭🇷", pot: 2, strength: 83 },
  { name: "Uruguay", flag: "🇺🇾", pot: 2, strength: 83 },
  { name: "Italia", flag: "🇮🇹", pot: 2, strength: 84 },
  { name: "Marruecos", flag: "🇲🇦", pot: 2, strength: 82 },
  { name: "Colombia", flag: "🇨🇴", pot: 2, strength: 81 },
  { name: "Japón", flag: "🇯🇵", pot: 2, strength: 80 },
  { name: "Senegal", flag: "🇸🇳", pot: 2, strength: 80 },
  { name: "Suiza", flag: "🇨🇭", pot: 2, strength: 79 },
  { name: "Dinamarca", flag: "🇩🇰", pot: 2, strength: 79 },
  { name: "Corea del Sur", flag: "🇰🇷", pot: 2, strength: 77 },
  { name: "Serbia", flag: "🇷🇸", pot: 2, strength: 78 },
  { name: "Nigeria", flag: "🇳🇬", pot: 2, strength: 78 },
  // Pot 3
  { name: "Ecuador", flag: "🇪🇨", pot: 3, strength: 76 },
  { name: "Austria", flag: "🇦🇹", pot: 3, strength: 77 },
  { name: "Polonia", flag: "🇵🇱", pot: 3, strength: 76 },
  { name: "Egipto", flag: "🇪🇬", pot: 3, strength: 75 },
  { name: "Noruega", flag: "🇳🇴", pot: 3, strength: 78 },
  { name: "Australia", flag: "🇦🇺", pot: 3, strength: 73 },
  { name: "Costa de Marfil", flag: "🇨🇮", pot: 3, strength: 74 },
  { name: "Túnez", flag: "🇹🇳", pot: 3, strength: 72 },
  { name: "Costa Rica", flag: "🇨🇷", pot: 3, strength: 70 },
  { name: "Arabia Saudí", flag: "🇸🇦", pot: 3, strength: 71 },
  { name: "Irán", flag: "🇮🇷", pot: 3, strength: 72 },
  { name: "Ghana", flag: "🇬🇭", pot: 3, strength: 73 },
  // Pot 4
  { name: "Catar", flag: "🇶🇦", pot: 4, strength: 68 },
  { name: "Panamá", flag: "🇵🇦", pot: 4, strength: 67 },
  { name: "Jamaica", flag: "🇯🇲", pot: 4, strength: 68 },
  { name: "Nueva Zelanda", flag: "🇳🇿", pot: 4, strength: 65 },
  { name: "Cabo Verde", flag: "🇨🇻", pot: 4, strength: 67 },
  { name: "Uzbekistán", flag: "🇺🇿", pot: 4, strength: 67 },
  { name: "Jordania", flag: "🇯🇴", pot: 4, strength: 66 },
  { name: "Honduras", flag: "🇭🇳", pot: 4, strength: 66 },
  { name: "Sudáfrica", flag: "🇿🇦", pot: 4, strength: 68 },
  { name: "Eslovenia", flag: "🇸🇮", pot: 4, strength: 70 },
  { name: "Paraguay", flag: "🇵🇾", pot: 4, strength: 71 },
  { name: "Curazao", flag: "🇨🇼", pot: 4, strength: 64 },
];

export const COACH_FIRST = ["Marcelo", "Dieter", "Hassan", "Akira", "Pierre", "Lars", "Diego", "Aldo", "Stipe", "Bernd", "Koldo", "Renato"];
export const COACH_LAST = ["Vidal", "Lindholm", "Bouzid", "Mori", "Lefevre", "Eriksson", "Cabrera", "Marchetti", "Petrović", "Wagner", "Etxeberria", "Salgado"];

export const PLAYSTYLES_POOL = [
  "posesion", "contraataque", "presion_alta", "bloque_bajo",
  "juego_fisico", "juego_directo", "bandas", "estrellas",
] as const;
