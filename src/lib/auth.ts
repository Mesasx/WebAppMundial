// Autenticación: registro/login con email+contraseña (bcrypt) y sesión JWT
// firmada (jose) almacenada en cookie httpOnly. Seguridad básica pero correcta.

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

const COOKIE = "mm_session";
const ALG = "HS256";

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET ?? "dev-secret-cambia-esto";
  return new TextEncoder().encode(s);
}

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

export async function createSession(userId: string): Promise<void> {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSession(): void {
  cookies().delete(COOKIE);
}

export async function getUserId(): Promise<string | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return (payload.uid as string) ?? null;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const uid = await getUserId();
  if (!uid) return null;
  return prisma.user.findUnique({
    where: { id: uid },
    select: { id: true, email: true, displayName: true, createdAt: true },
  });
}

export async function requireUserId(): Promise<string> {
  const uid = await getUserId();
  if (!uid) throw new Error("UNAUTHORIZED");
  return uid;
}
