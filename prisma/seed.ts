// Seed: crea una cuenta demo para probar la app rápidamente.
// Ejecuta: npm run db:seed
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@mundial.com";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("La cuenta demo ya existe:", email);
    return;
  }
  await prisma.user.create({
    data: {
      email,
      displayName: "Entrenador Demo",
      passwordHash: await bcrypt.hash("demo1234", 10),
    },
  });
  console.log("✅ Cuenta demo creada:");
  console.log("   email:    demo@mundial.com");
  console.log("   password: demo1234");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
