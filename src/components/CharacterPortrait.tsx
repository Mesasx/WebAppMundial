"use client";
import { useState } from "react";
import type { GameCharacter } from "@/lib/narrative";

// Muestra la ilustración del personaje si existe en /public/characters;
// si no, cae con elegancia a un avatar con emoji. Así la historia funciona ya
// y las imágenes aparecen solas en cuanto se añadan los PNG.
export function CharacterPortrait({
  character,
  size = 160,
}: {
  character: GameCharacter;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-pitch-100 to-white border border-[#ece2d5] shadow-card grid place-items-center"
        style={{ width: size, height: size }}
      >
        {!failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={character.file}
            alt={character.name}
            onError={() => setFailed(true)}
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <span style={{ fontSize: size * 0.5 }} className="animate-float">{character.emoji}</span>
        )}
      </div>
      <div className="text-center">
        <div className="font-bold leading-tight">{character.name}</div>
        <div className="text-xs text-slate-500">{character.role}</div>
      </div>
    </div>
  );
}
