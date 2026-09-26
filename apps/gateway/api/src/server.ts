import { appConfig } from "@payvo/config/app";
import app from "./app.js";
import { paymentOrderExpirationWorker } from "./workers/payment-order.worker.js";

async function bootstrapApp() {
  paymentOrderExpirationWorker();

  app.listen(appConfig.port, () => {
    console.log(`Server is running at port: ${appConfig.port}`);
  });
}

bootstrapApp();
