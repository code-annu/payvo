import { appConfig } from "@payvo/config/app";
import app from "./app.js";
import { connectRedis } from "@payvo/redis";

async function bootstrap() {
  await connectRedis();

  app.listen(appConfig.port, () => {
    console.log(`Server is running on port: ${appConfig.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to bootstrap server:", error);
  process.exit(1);
});

