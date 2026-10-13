import { Container } from "inversify";
import ApiKeyService from "./application/service/api-key.service.js";
import ApiKeyMapper from "./mapper/api-key.mapper.js";
import ApiKeyRepository from "./repository/api-key.repository.js";
import { ApiKeyTypes } from "./api-key.types.js";
import ApiKeyController from "./controller/api-key.controller.js";
import ApiKeyRouter from "./router/api-key.router.js";

export { ApiKeyTypes } from "./api-key.types.js";

export function registerApiKeyModule(container: Container): void {
  container.bind(ApiKeyTypes.ApiKeyRepository).to(ApiKeyRepository);
  container.bind(ApiKeyTypes.ApiKeyMapper).to(ApiKeyMapper);
  container.bind(ApiKeyTypes.ApiKeyService).to(ApiKeyService);
  container.bind(ApiKeyTypes.ApiKeyController).to(ApiKeyController);
  container.bind(ApiKeyTypes.ApiKeyRouter).to(ApiKeyRouter);
}
