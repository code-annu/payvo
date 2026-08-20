import { prisma } from "@/core/prisma/prisma.client";

export async function resetDb() {
  await prisma.refreshToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
}
