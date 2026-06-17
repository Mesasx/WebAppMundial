import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Modo Manager Mundial 2026",
  description:
    "Reconstruye tu selección desde cero, convence a los cracks y conquista el Mundial 2026 en un universo alternativo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
