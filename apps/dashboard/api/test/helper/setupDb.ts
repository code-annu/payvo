import { prisma } from "@payvo/database/client";

export async function setupDb() {
  await cleanupDb();
  await currencyAndLanguageSetup();
}

async function cleanupDb() {
  await prisma.userAddress.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.userPreference.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.user.deleteMany();
  await prisma.supportedLanguage.deleteMany();
  await prisma.supportedCurrency.deleteMany();
  await prisma.country.deleteMany();
}

async function currencyAndLanguageSetup() {
  await prisma.supportedLanguage.createMany({
    data: [
      { code: "en", name: "English" },
      { code: "es", name: "Spanish" },
    ],
  });

  await prisma.supportedCurrency.createMany({
    data: [
      { code: "USD", name: "US Dollar", minorUnit: 2 },
      { code: "EUR", name: "Euro", minorUnit: 2 },
    ],
  });

  await prisma.country.createMany({
    data: [
      { code: "US", name: "United States" },
      { code: "GB", name: "United Kingdom" },
      { code: "IN", name: "India" },
    ],
  });
}
