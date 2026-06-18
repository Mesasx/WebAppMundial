import type { Metadata } from "next";
import { Newsreader, Inter } from "next/font/google";
import "./globals.css";

// Tipografía estilo Claude: serif editorial para titulares + grotesca limpia
// para el cuerpo.
const display = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Manager Mundial 2026",
  description:
    "Reconstruye tu selección desde cero, convence a los cracks y conquista el Mundial 2026 en un universo alternativo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
