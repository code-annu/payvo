import { serverConfig } from "@payvo/config";
import app from "./app.js";

app.listen(serverConfig.DASHBOARD_API.PORT, () => {
  console.log(
    `Dashboard API is running on http://localhost:${serverConfig.DASHBOARD_API.PORT}`,
  );
});
