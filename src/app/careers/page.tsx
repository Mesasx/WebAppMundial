import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CareersList } from "@/components/CareersList";

export const dynamic = "force-dynamic";

export default async function CareersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const careers = await prisma.career.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true, nationName: true, baseCountry: true, difficulty: true,
      phase: true, stageLabel: true, finished: true, result: true, updatedAt: true,
    },
  });

  const trophies = careers.filter((c) => c.result?.includes("Campeón")).length;

  return (
    <CareersList
      userName={user.displayName}
      careers={careers.map((c) => ({ ...c, updatedAt: c.updatedAt.toISOString() }))}
      trophies={trophies}
    />
  );
}
