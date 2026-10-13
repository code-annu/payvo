import { prisma } from "@payvo/database/client";

export async function setupDb() {
  await cleanupDb();
  await ensureAddressDefaultConstraint();
  await currencyAndLanguageSetup();
}

async function ensureAddressDefaultConstraint() {
  await prisma.$executeRaw`
    CREATE UNIQUE INDEX IF NOT EXISTS user_addresses_one_default_per_type
    ON user_addresses (user_id, address_type)
    WHERE is_default = TRUE
  `;
}

async function cleanupDb() {
  await prisma.apiKey.deleteMany();
  await prisma.merchant.deleteMany();
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
