import "dotenv/config";
import { definePrismaConfig } from "@prisma/cli-engine";
import { defineConfig as ormConfig } from "@prisma/orm-postgres/config";
import { databaseConfig } from "@payvo/config/database";

export default definePrismaConfig({
  orm: ormConfig({
    contract: "./src/prisma/contract.prisma",
    db: {
      connection: databaseConfig.url,
    },
  }),
}) as ReturnType<typeof definePrismaConfig>;
