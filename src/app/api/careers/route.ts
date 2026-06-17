import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { createCareerState } from "@/lib/engine/career";
import { deriveMeta } from "@/lib/career-service";
import { NATIONS } from "@/data/nations";
import { FLAGS } from "@/data/players";

const createSchema = z.object({
  nationName: z.string().min(2).max(40),
  baseCountry: z.string().min(2).max(40),
  difficulty: z.enum(["easy", "normal", "hard", "realistic", "chaos"]),
});

function flagFor(country: string): string {
  const nation = NATIONS.find((n) => n.name === country);
  if (nation) return nation.flag;
  const key = country.replace(/ /g, "_");
  return FLAGS[key] ?? "🏳️";
}

// GET /api/careers — lista de carreras del usuario
export async function GET() {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const careers = await prisma.career.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true, nationName: true, baseCountry: true, difficulty: true,
      phase: true, stageLabel: true, finished: true, result: true,
      createdAt: true, updatedAt: true,
    },
  });
  return NextResponse.json({ careers });
}

// POST /api/careers — crea una nueva carrera
export async function POST(req: Request) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { nationName, baseCountry, difficulty } = parsed.data;
  const state = createCareerState({
    nationName,
    baseCountry,
    flag: flagFor(baseCountry),
    difficulty,
  });
  const meta = deriveMeta(state);
  const career = await prisma.career.create({
    data: {
      userId,
      state: JSON.stringify(state),
      nationName: meta.nationName,
      baseCountry: meta.baseCountry,
      difficulty: meta.difficulty,
      phase: meta.phase,
      stageLabel: meta.stageLabel,
      finished: meta.finished,
      result: meta.result,
    },
  });
  return NextResponse.json({ id: career.id });
}
