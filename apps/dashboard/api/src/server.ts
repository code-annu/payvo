import { appConfig } from "@payvo/config/app";
import app from "./app.js";

app.listen(appConfig.port, "0.0.0.0",() => {
  console.log(`Dashboard API is running on port ${appConfig.port}`);
});
