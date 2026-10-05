import app from "./app.js";
import { serverConfig } from "@payvo/config/server";

async function bootstrapApp() {
  app.listen(serverConfig.port, () => {
    console.log(`Server is running at port: ${serverConfig.port}`);
  });
}

bootstrapApp();
