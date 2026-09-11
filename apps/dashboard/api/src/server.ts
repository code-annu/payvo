import { appConfig } from "@payvo/config/app";
import app from "./app.js";

app.listen(appConfig.port, () => {
  console.log(`Server is running on port: ${appConfig.port}`);
});
