import { Container } from "inversify";
import MerchantMapper from "./mapper/merchant.mapper.js";
import MerchantRepository from "./repository/merchant.repository.js";
import MerchantService from "./application/service/merchant.service.js";
import MerchantController from "./controller/merchant.controller.js";
import MerchantRouter from "./router/merchant.router.js";
import { MerchantTypes } from "./merchant.types.js";

export { MerchantTypes } from "./merchant.types.js";

export function registerMerchantModule(container: Container): void {
  container.bind(MerchantTypes.MerchantRepository).to(MerchantRepository);
  container.bind(MerchantTypes.MerchantMapper).to(MerchantMapper);
  container.bind(MerchantTypes.MerchantService).to(MerchantService);
  container
    .bind(MerchantTypes.MerchantContract)
    .toService(MerchantTypes.MerchantService);
  container.bind(MerchantTypes.MerchantController).to(MerchantController);
  container.bind(MerchantTypes.MerchantRouter).to(MerchantRouter);
}
