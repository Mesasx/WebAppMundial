import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        pitch: {
          50: "#eafff2",
          100: "#c8ffe0",
          400: "#22e07a",
          500: "#10b95f",
          600: "#0a9c4e",
        },
        ink: {
          900: "#0a0e14",
          800: "#111722",
          700: "#1a2230",
          600: "#27313f",
          500: "#3a4658",
        },
        accent: {
          gold: "#ffce4b",
          amber: "#ffa726",
          neon: "#22e07a",
          danger: "#ff5d5d",
          info: "#4aa8ff",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pop": {
          "0%": { transform: "scale(0.92)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        "pop": "pop 0.25s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
