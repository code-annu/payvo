import { serverConfig } from "@payvo/config/server";
import app from "./app.js";

app.listen(serverConfig.port, () => {
  console.log(`Server is running on port ${serverConfig.port}`);
});
