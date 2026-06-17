import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { loadCareer, saveCareer } from "@/lib/career-service";
import { applyAction, type Action } from "@/lib/actions";
import { projectState } from "@/lib/project";

// POST /api/careers/:id/action — aplica una acción de juego y guarda el estado.
// El guardado es automático tras cada acción (autosave).
export async function POST(req: Request, { params }: { params: { id: string } }) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const action = (await req.json().catch(() => null)) as Action | null;
  if (!action || typeof action.type !== "string") {
    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  }
  const loaded = await loadCareer(params.id, userId);
  if (!loaded) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  let result;
  try {
    result = applyAction(loaded.state, action);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
  await saveCareer(params.id, loaded.state);

  return NextResponse.json({ result, state: projectState(loaded.state) });
}
