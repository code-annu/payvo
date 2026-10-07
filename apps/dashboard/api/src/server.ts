import { appConfig } from "@payvo/config/app";
import app from "./app.js";

async function bootstrap() {
  app.listen(appConfig.port, "0.0.0.0", (error) => {
    console.log(`Server is running on port: ${appConfig.port}`);
    if (error) {
      console.error("Error is: ", error);
    }
  });
}

bootstrap().catch((error) => {
  console.error("Failed to bootstrap server:", error);
  process.exit(1);
});
