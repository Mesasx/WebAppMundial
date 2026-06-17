// Formaciones soportadas y su mapa de posiciones (11 huecos en orden).

import type { Formation, Position } from "../types";

export const FORMATIONS: Record<Formation, Position[]> = {
  "4-3-3": ["POR", "LD", "DFC", "DFC", "LI", "MCD", "MC", "MC", "ED", "DC", "EI"],
  "4-2-3-1": ["POR", "LD", "DFC", "DFC", "LI", "MCD", "MC", "ED", "MCO", "EI", "DC"],
  "4-4-2": ["POR", "LD", "DFC", "DFC", "LI", "ED", "MC", "MC", "EI", "DC", "DC"],
  "3-5-2": ["POR", "DFC", "DFC", "DFC", "ED", "MC", "MCD", "MC", "EI", "DC", "DC"],
  "3-4-3": ["POR", "DFC", "DFC", "DFC", "ED", "MC", "MC", "EI", "ED", "DC", "EI"],
  "5-3-2": ["POR", "LD", "DFC", "DFC", "DFC", "LI", "MC", "MCD", "MC", "DC", "DC"],
  "4-1-2-1-2": ["POR", "LD", "DFC", "DFC", "LI", "MCD", "MC", "MC", "MCO", "DC", "DC"],
};

export const ALL_FORMATIONS = Object.keys(FORMATIONS) as Formation[];

// Coordenadas 2D normalizadas (0-100) para dibujar el campo en la simulación
// visual. El equipo local ataca hacia la derecha.
export const FORMATION_COORDS: Record<Formation, Array<{ x: number; y: number }>> = {
  "4-3-3": [
    { x: 6, y: 50 }, { x: 24, y: 18 }, { x: 20, y: 40 }, { x: 20, y: 60 }, { x: 24, y: 82 },
    { x: 42, y: 50 }, { x: 48, y: 30 }, { x: 48, y: 70 }, { x: 72, y: 20 }, { x: 80, y: 50 }, { x: 72, y: 80 },
  ],
  "4-2-3-1": [
    { x: 6, y: 50 }, { x: 24, y: 18 }, { x: 20, y: 40 }, { x: 20, y: 60 }, { x: 24, y: 82 },
    { x: 40, y: 38 }, { x: 40, y: 62 }, { x: 64, y: 20 }, { x: 60, y: 50 }, { x: 64, y: 80 }, { x: 82, y: 50 },
  ],
  "4-4-2": [
    { x: 6, y: 50 }, { x: 24, y: 18 }, { x: 20, y: 40 }, { x: 20, y: 60 }, { x: 24, y: 82 },
    { x: 50, y: 18 }, { x: 46, y: 42 }, { x: 46, y: 58 }, { x: 50, y: 82 }, { x: 76, y: 40 }, { x: 76, y: 60 },
  ],
  "3-5-2": [
    { x: 6, y: 50 }, { x: 20, y: 30 }, { x: 18, y: 50 }, { x: 20, y: 70 },
    { x: 44, y: 14 }, { x: 46, y: 38 }, { x: 40, y: 50 }, { x: 46, y: 62 }, { x: 44, y: 86 }, { x: 74, y: 40 }, { x: 74, y: 60 },
  ],
  "3-4-3": [
    { x: 6, y: 50 }, { x: 20, y: 30 }, { x: 18, y: 50 }, { x: 20, y: 70 },
    { x: 46, y: 16 }, { x: 44, y: 42 }, { x: 44, y: 58 }, { x: 46, y: 84 }, { x: 74, y: 22 }, { x: 80, y: 50 }, { x: 74, y: 78 },
  ],
  "5-3-2": [
    { x: 6, y: 50 }, { x: 22, y: 14 }, { x: 18, y: 36 }, { x: 16, y: 50 }, { x: 18, y: 64 }, { x: 22, y: 86 },
    { x: 46, y: 32 }, { x: 42, y: 50 }, { x: 46, y: 68 }, { x: 74, y: 40 }, { x: 74, y: 60 },
  ],
  "4-1-2-1-2": [
    { x: 6, y: 50 }, { x: 24, y: 18 }, { x: 20, y: 40 }, { x: 20, y: 60 }, { x: 24, y: 82 },
    { x: 38, y: 50 }, { x: 50, y: 30 }, { x: 50, y: 70 }, { x: 62, y: 50 }, { x: 78, y: 40 }, { x: 78, y: 60 },
  ],
};

export const FORMATION_LABELS: Record<Formation, string> = {
  "4-3-3": "4-3-3 · Equilibrado ofensivo",
  "4-2-3-1": "4-2-3-1 · Control con mediapunta",
  "4-4-2": "4-4-2 · Clásico de bandas",
  "3-5-2": "3-5-2 · Dominio del centro",
  "3-4-3": "3-4-3 · Apuesta ofensiva",
  "5-3-2": "5-3-2 · Bloque sólido",
  "4-1-2-1-2": "4-1-2-1-2 · Rombo en el medio",
};
