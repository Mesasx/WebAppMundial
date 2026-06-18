import type { Config } from "tailwindcss";

// Tema CLARO: base blanca/crema, primario naranja, negro para texto y acentos.
// Tipografía estilo Claude (serif editorial + grotesca). Animaciones para dar
// dinamismo (no plano).
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Primario: naranja.
        pitch: {
          50: "#fff7ed",
          100: "#ffedd5",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
        },
        // Superficies claras (las clases bg-ink-* quedan en tonos claros).
        ink: {
          900: "#ffffff",
          800: "#ffffff",
          700: "#f4eee8",
          600: "#e7ddd2",
          500: "#b9ab9c",
        },
        accent: {
          gold: "#d97706",
          amber: "#ea580c",
          neon: "#f97316",
          danger: "#dc2626",
          info: "#2563eb",
          coral: "#f97316",
          cream: "#211b16", // texto oscuro (las clases text-accent-cream quedan oscuras)
          ink: "#17120e",   // negro cálido
        },
        // slate remapeado a grises legibles sobre fondo claro.
        slate: {
          100: "#1c1917", 200: "#292524", 300: "#44403c", 400: "#6b6b6b",
          500: "#8a8378", 600: "#c9bdae", 700: "#e7ded2", 800: "#f3eee8", 900: "#faf7f3",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 6px 24px -10px rgba(120,80,40,0.18)",
      },
      keyframes: {
        "fade-in": { "0%": { opacity: "0", transform: "translateY(10px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        pop: { "0%": { transform: "scale(0.92)", opacity: "0" }, "100%": { transform: "scale(1)", opacity: "1" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-14px)" } },
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        glow: { "0%,100%": { opacity: "0.35", transform: "scale(1)" }, "50%": { opacity: "0.6", transform: "scale(1.08)" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        pop: "pop 0.25s ease-out",
        float: "float 6s ease-in-out infinite",
        marquee: "marquee 30s linear infinite",
        glow: "glow 7s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
