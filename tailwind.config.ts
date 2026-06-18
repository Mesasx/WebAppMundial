import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Acento principal: coral cálido de la identidad Claude.
        pitch: {
          50: "#fdf4ef",
          100: "#f9e1d5",
          400: "#e89a7f",
          500: "#d97757", // Claude coral
          600: "#c4603f",
        },
        // Superficies: grises cálidos oscuros (modo oscuro estilo Claude).
        ink: {
          900: "#1a1916",
          800: "#23211c",
          700: "#2f2c26",
          600: "#3d3933",
          500: "#544f47",
        },
        accent: {
          gold: "#e3ab5e",
          amber: "#e0934e",
          neon: "#d97757",
          danger: "#e0654f",
          info: "#8fb3cf",
          coral: "#d97757",
          cream: "#efe9dd",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pop: {
          "0%": { transform: "scale(0.92)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        glow: {
          "0%,100%": { opacity: "0.35", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(1.08)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
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
