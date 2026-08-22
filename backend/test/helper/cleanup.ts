import { prisma } from "@/core/prisma/prisma.client";

export async function resetDb() {
  await prisma.apiKey.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.paymentAttempt.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.merchant.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
}

