import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { loadCareer } from "@/lib/career-service";
import { projectState } from "@/lib/project";
import { GameClient } from "./GameClient";

export const dynamic = "force-dynamic";

export default async function PlayPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const loaded = await loadCareer(params.id, user.id);
  if (!loaded) notFound();
  return <GameClient careerId={params.id} initialState={projectState(loaded.state)} />;
}
