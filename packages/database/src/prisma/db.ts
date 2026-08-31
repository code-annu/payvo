import postgres from "@prisma/orm-postgres/runtime";
import type { Contract } from "./contract.js";
import contractJson from "./contract.json" with { type: "json" };
import { databaseConfig } from "@payvo/config";

export const db = postgres<Contract>({
  contractJson,
  url: databaseConfig.DATABASE_URL,
});

async function main() {
  const session = await db.orm.public.Session.include("user", (u) =>
    u.select(
      "id",
      "email",
      "fullname",
      "companyName",
      "isEmailVerified",
      "createdAt",
      "updatedAt",
    ),
  ).first();

  if (session) {
    console.log(session.user.email);
  }

  const s = await db.orm.public.Session.include("user", (user) =>
    user.select("id", "passwordHash"),
  ).first();
}
