import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { loadCareer } from "@/lib/career-service";
import { projectState } from "@/lib/project";

// GET /api/careers/:id — estado proyectado de una carrera
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const loaded = await loadCareer(params.id, userId);
  if (!loaded) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  return NextResponse.json({ state: projectState(loaded.state) });
}

// DELETE /api/careers/:id — elimina una carrera
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const career = await prisma.career.findUnique({ where: { id: params.id } });
  if (!career || career.userId !== userId) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }
  await prisma.career.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
