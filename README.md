# ⚽ Modo Manager Mundial 2026

Web app interactiva de fútbol en un **universo alternativo del Mundial 2026**. Una crisis
global ha reiniciado las nacionalidades de todos los futbolistas: a 14 días del torneo, te
nombran seleccionador y debes **reconstruir tu selección desde cero** — draft, reclutamiento,
gestión de vestuario, tácticas y simulación de todo el Mundial.

Mezcla de modo carrera, simulador de Mundial, juego de draft y narrativa interactiva.

> ⚠️ Juego de ficción. **No** usa marcas, escudos, logos ni imágenes con licencia. La
> identidad de las selecciones se basa únicamente en **banderas de países** (emoji). Las
> medias, atributos y valoraciones están **generadas por la propia app** desde cero
> (inspiradas en datos públicos), no copian ningún sistema con licencia. Sólo se usan
> **nombres** de jugadores como datos públicos.

---

## 🚀 Cómo ejecutar en local

Requisitos: **Node 18+** (probado con Node 22). La base de datos es **SQLite**, así que no
necesitas instalar ni configurar nada externo.

```bash
# 1. Instalar dependencias (genera el cliente Prisma automáticamente)
npm install

# 2. Configurar entorno (SQLite, listo para usar)
cp .env.example .env

# 3. Crear la base de datos
npm run db:push

# 4. (Opcional) crear una cuenta demo  ->  demo@mundial.com / demo1234
npm run db:seed

# 5. Arrancar en desarrollo
npm run dev
```

Abre **http://localhost:3000**.

Otros scripts:

```bash
npm run build      # build de producción
npm start          # servir build de producción
npm test           # tests del motor (vitest)
npm run db:reset   # recrear la BD desde cero + seed
```

---

## 🧱 Stack y decisiones técnicas

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| Framework | **Next.js 14 (App Router)** + React 18 + TypeScript | Full-stack en un solo proyecto |
| Estilos | **Tailwind CSS** + tipografía serif/sans | Identidad cálida estilo Claude, responsive |
| Base de datos | **Prisma + SQLite** | Cero configuración; portable a Postgres cambiando el `datasource` |
| Auth | **bcryptjs + JWT (jose)** en cookie httpOnly | Sesión segura sin dependencias pesadas |
| Validación | **Zod** | Validación de formularios y de la API |
| Tests | **Vitest** | Motor de juego testeable y desacoplado |

**Decisión clave de arquitectura:** la lógica de juego (`src/lib/engine/`) es **TypeScript
puro y testeable**, totalmente separada de la UI y de la base de datos. Cada carrera se
persiste como un **save-state JSON tipado** (`CareerState`) en `Career.state`. Esto da un
sistema de guardado robusto, evita decenas de tablas para un MVP y permite simular una
carrera completa en un test (ver `src/lib/engine/__tests__`).

Para el cliente, el estado se **proyecta** (`src/lib/project.ts`) recortando los jugadores
rivales que la UI no necesita, reduciendo mucho el tamaño del payload.

---

## 📂 Estructura

```
prisma/
  schema.prisma         # User + Career (estado JSON)
  seed.ts               # cuenta demo
src/
  app/                  # páginas (landing, login, register, careers, play) + API routes
    api/                # auth + careers (CRUD) + careers/[id]/action (autosave)
    play/[id]/          # pantalla principal del juego (GameClient)
  components/           # UI, PlayerCard, y pantallas de juego (game/*)
  data/
    players.ts          # dataset de jugadores (nombres públicos + señales de nivel)
    nations.ts          # 48 naciones (banderas, bombos, fuerza)
  lib/
    types.ts            # modelo de dominio (CareerState, Player, Team, Match...)
    auth.ts, db.ts      # autenticación y cliente Prisma
    actions.ts          # despachador de acciones de juego
    engine/             # MOTOR DE JUEGO (puro, testeable)
      ratings.ts        # sistema de medias propio (65-95), documentado
      factory.ts        # crea jugadores (reales + procedurales)
      draft.ts          # draft de 26 con cap de cracks y cobertura por posición
      recruitment.ts    # chat de negociación + disposición + promesas
      team.ts           # fuerzas de equipo (ataque/defensa/medio/portero)
      match.ts          # simulación de partidos + crónicas
      tournament.ts     # 48 equipos, 12 grupos, eliminatorias
      training.ts       # entrenamientos
      news.ts           # noticias/narrativa
      epilogue.ts       # premios y epílogo
      career.ts         # orquestador de fases
```

---

## ✅ Funcionalidades implementadas

**Cuentas y carreras**
- Registro / login / logout (email + contraseña, sesión JWT).
- Varias carreras por usuario, "Mis carreras", crear/continuar/eliminar, historial y palmarés.
- **Autoguardado** tras cada acción.

**Modo carrera (todas las fases)**
1. **Introducción narrativa** cinematográfica (la "Crisis Mundial 2026").
2. **Creación de selección**: país base (bandera) + nombre personalizado + dificultad.
3. **Generación del universo**: 47 rivales con plantilla, DT, estilo, nivel y cracks.
4. **Draft de 26**: eliges 11 a mano (con tensión y **cap de 2 cracks**), autocompletado
   garantizando ≥2 jugadores por posición base.
5. **Reclutamiento (2 semanas)**: chat de negociación con agentes libres, promesas
   (titularidad, capitanía…), dificultad de fichaje, y **rivales que te roban jugadores**.
6. **Entrenamientos** (9 tipos) + charlas de vestuario.
7. **Sorteo** equilibrado por bombos → fase de grupos (12 grupos de 4).
8. **Eliminatorias** desde dieciseisavos hasta la final (+ tercer puesto).
9. **Simulación rápida** y **simulación visual 2D** (fichas sobre el campo, balón, narración
   minuto a minuto y estadísticas en vivo) con plan de partido (formación, estilo, actitud).
10. **Crónicas postpartido** (titular, MVP, clave táctica, momento decisivo).
11. **Noticias** dinámicas (rumores, lesiones, prensa, virales, vestuario).
12. **Epílogo** narrativo + **premios** (Balón/Bota/Guante de Oro, revelación, once ideal).

**Sistemas de juego**
- Sistema de **medias propio (65-95)** documentado (`ratings.ts`).
- Atributos por posición, rasgos especiales, potencial y progresión/regresión en el torneo.
- **Moral, química, fatiga, forma, riesgo de lesión** y su efecto (moderado) en el partido.
- Objetivos de federación, confianza de afición/federación/vestuario y reputación del DT.
- 5 niveles de dificultad y 7 formaciones.

---

## 🧪 Tests

```bash
npm test
```

Cubren: rangos de las medias, equilibrio del draft (26 jugadores, ≥2 por posición), que el
favorito gana **más a menudo pero no siempre** (aleatoriedad realista) y que una **carrera
completa puede jugarse de la intro al campeón**.

---

## 🔮 Preparado para ampliar

La arquitectura deja enganches claros para crecer:

- **Chat con IA real**: `recruitment.ts` aísla `playerReply`/disposición; basta sustituir la
  generación de texto por una IA local o API sin tocar la lógica.
- **Importar convocatorias reales**: `data/players.ts` define `PlayerSeed`; preparado para
  cargar desde JSON/CSV/API pública.
- **Decisiones en directo durante el partido** (sustituciones, cambios de táctica a mitad):
  el motor ya soporta sesgo táctico/actitud; falta el bucle interactivo de subs.
- **Mercado dinámico más profundo**, rivalidades, ruedas de prensa ampliadas, más estadísticas
  globales y modos de carrera adicionales.
- **Despliegue**: para producción basta con cambiar el `datasource` de Prisma a Postgres.

---

## 📌 Posibles siguientes mejoras

- Sustituciones y decisiones tácticas en vivo dentro de la simulación 2D.
- Estadísticas globales del torneo (goleadores de todas las selecciones, no sólo la tuya).
- Persistir y mostrar el historial detallado partido a partido y rivalidades entre carreras.
- IA narrativa para crónicas y diálogos.
- Animación de balón guiada por la secuencia real de eventos (pases/ocasiones).
```
