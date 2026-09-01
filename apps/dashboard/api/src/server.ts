import { appConfig } from "@payvo/config/app";
import app from "./app.js";

app.listen(appConfig.port, () => {
  console.log(`Dashboard API is running on http://localhost:${appConfig.port}`);
});
