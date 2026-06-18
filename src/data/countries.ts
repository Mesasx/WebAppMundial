// Mapa ligero código FIFA -> nombre en español + bandera, y utilidades de
// selección de nación. Sin dependencias del motor (apto para el cliente).

import squadsData from "@/data/squads.json";

export const COUNTRY: Record<string, { es: string; flag: string }> = {
  ALG: { es: "Argelia", flag: "🇩🇿" }, ARG: { es: "Argentina", flag: "🇦🇷" },
  AUS: { es: "Australia", flag: "🇦🇺" }, AUT: { es: "Austria", flag: "🇦🇹" },
  BEL: { es: "Bélgica", flag: "🇧🇪" }, BIH: { es: "Bosnia y Herzegovina", flag: "🇧🇦" },
  BRA: { es: "Brasil", flag: "🇧🇷" }, CPV: { es: "Cabo Verde", flag: "🇨🇻" },
  CAN: { es: "Canadá", flag: "🇨🇦" }, COL: { es: "Colombia", flag: "🇨🇴" },
  COD: { es: "RD Congo", flag: "🇨🇩" }, CIV: { es: "Costa de Marfil", flag: "🇨🇮" },
  CRO: { es: "Croacia", flag: "🇭🇷" }, CUW: { es: "Curazao", flag: "🇨🇼" },
  CZE: { es: "Chequia", flag: "🇨🇿" }, ECU: { es: "Ecuador", flag: "🇪🇨" },
  EGY: { es: "Egipto", flag: "🇪🇬" }, ENG: { es: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  FRA: { es: "Francia", flag: "🇫🇷" }, GER: { es: "Alemania", flag: "🇩🇪" },
  GHA: { es: "Ghana", flag: "🇬🇭" }, HAI: { es: "Haití", flag: "🇭🇹" },
  IRN: { es: "Irán", flag: "🇮🇷" }, IRQ: { es: "Irak", flag: "🇮🇶" },
  JPN: { es: "Japón", flag: "🇯🇵" }, JOR: { es: "Jordania", flag: "🇯🇴" },
  KOR: { es: "Corea del Sur", flag: "🇰🇷" }, MEX: { es: "México", flag: "🇲🇽" },
  MAR: { es: "Marruecos", flag: "🇲🇦" }, NED: { es: "Países Bajos", flag: "🇳🇱" },
  NZL: { es: "Nueva Zelanda", flag: "🇳🇿" }, NOR: { es: "Noruega", flag: "🇳🇴" },
  PAN: { es: "Panamá", flag: "🇵🇦" }, PAR: { es: "Paraguay", flag: "🇵🇾" },
  POR: { es: "Portugal", flag: "🇵🇹" }, QAT: { es: "Catar", flag: "🇶🇦" },
  KSA: { es: "Arabia Saudí", flag: "🇸🇦" }, SCO: { es: "Escocia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  SEN: { es: "Senegal", flag: "🇸🇳" }, RSA: { es: "Sudáfrica", flag: "🇿🇦" },
  ESP: { es: "España", flag: "🇪🇸" }, SWE: { es: "Suecia", flag: "🇸🇪" },
  SUI: { es: "Suiza", flag: "🇨🇭" }, TUN: { es: "Túnez", flag: "🇹🇳" },
  TUR: { es: "Turquía", flag: "🇹🇷" }, URU: { es: "Uruguay", flag: "🇺🇾" },
  USA: { es: "Estados Unidos", flag: "🇺🇸" }, UZB: { es: "Uzbekistán", flag: "🇺🇿" },
};

export function countryInfo(code: string, fallbackName: string) {
  return COUNTRY[code] ?? { es: fallbackName, flag: "🏳️" };
}

interface SquadTeam { name: string; code: string; players: { overall: number }[]; }
const SQUADS = squadsData as unknown as SquadTeam[];

export function realNationOptions() {
  return SQUADS.map((t) => {
    const ci = countryInfo(t.code, t.name);
    const avg = Math.round(t.players.reduce((a, p) => a + p.overall, 0) / t.players.length);
    return { code: t.code, name: ci.es, flag: ci.flag, rating: avg };
  }).sort((a, b) => b.rating - a.rating);
}
