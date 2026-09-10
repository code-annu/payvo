import { appConfig } from "@payvo/config/app";
import app from "./app";

app.listen(appConfig.port, () => {
  console.log(`Server is running on port: ${appConfig.port}`);
});
