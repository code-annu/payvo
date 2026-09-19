import { Container } from "inversify";
import TYPES from "./inversify.types.js";

// User module
import UserRepository from "@/modules/user/repository/user.repository.js";
import UserMapper from "@/modules/user/user.mapper.js";

// Auth module
import AuthMapper from "@/modules/auth/auth.mapper.js";
import SessionRepository from "@/modules/auth/repository/session.repository.js";
import RefreshTokenRepository from "@/modules/auth/repository/refresh-token.repository.js";
import SignupUsecase from "@/modules/auth/application/usecase/SignupUsecase.js";
import LoginUsecase from "@/modules/auth/application/usecase/LoginUsecase.js";
import RotateTokenUsecase from "@/modules/auth/application/usecase/RotateTokenUsecase.js";
import LogoutUsecase from "@/modules/auth/application/usecase/LogoutUsecase.js";
import AuthController from "@/modules/auth/auth.controller.js";
import AuthRouter from "@/modules/auth/auth.router.js";

// Account module
import GetAccountUsecase from "@/modules/account/application/usecase/GetAccountUsecase.js";
import UpdateAccountUsecase from "@/modules/account/application/usecase/UpdateAccountUsecase.js";
import DeleteAccountUsecase from "@/modules/account/application/usecase/DeleteAccountUsecase.js";
import AccountController from "@/modules/account/account.controller.js";
import AccountRouter from "@/modules/account/account.router.js";

// Merchant module
import MerchantMapper from "@/modules/merchant/merchant.mapper.js";
import MerchantRepository from "@/modules/merchant/repository/merchant.repository.js";
import CreateMerchantUsecase from "@/modules/merchant/application/usecase/CreateMerchantUsecase.js";
import GetMerchantDetailsUsecase from "@/modules/merchant/application/usecase/GetMerchantDetailsUsecase.js";
import GetUserMerchantsUsecase from "@/modules/merchant/application/usecase/GetUserMerchantsUsecase.js";
import DeleteMerchantUsecase from "@/modules/merchant/application/usecase/DeleteMerchantUsecase.js";
import MerchantController from "@/modules/merchant/merchant.controller.js";
import MerchantRouter from "@/modules/merchant/merchant.router.js";

// Api-Key module
import ApiKeyMapper from "@/modules/api-key/api-key.mapper.js";
import ApiKeyRepository from "@/modules/api-key/repository/api-key.repository.js";
import GenerateApiKeyUsecase from "@/modules/api-key/application/usecase/GenerateApiKeyUsecase.js";
import GetActiveApiKeyUsecase from "@/modules/api-key/application/usecase/GetActiveApiKeyUsecase.js";
import RotateApiKeyUsecase from "@/modules/api-key/application/usecase/RotateApiKeyUsecase.js";
import RevokeApiKeyUsecase from "@/modules/api-key/application/usecase/RevokeApiKeyUsecase.js";
import ApiKeyController from "@/modules/api-key/api-key.controller.js";
import ApiKeyRouter from "@/modules/api-key/api-key.router.js";

// Util
import ClientInfoUtil from "@/core/util/client.util.js";
import ValidateApiKeyUsecase from "@/internals/application/usecase/ValidateApiKeyUsecase.js";
import InternalController from "@/internals/internal.controller.js";
import InternalRouter from "@/internals/internal.router.js";

const container = new Container();

// Util bindings
container.bind(TYPES.ClientInfoUtil).to(ClientInfoUtil);

// User bindings
container.bind(TYPES.UserMapper).to(UserMapper);
container.bind(TYPES.UserRepository).to(UserRepository);

// Auth bindings
container.bind(TYPES.AuthMapper).to(AuthMapper);
container.bind(TYPES.SessionRepository).to(SessionRepository);
container.bind(TYPES.RefreshTokenRepository).to(RefreshTokenRepository);
container.bind(TYPES.SignupUsecase).to(SignupUsecase);
container.bind(TYPES.LoginUsecase).to(LoginUsecase);
container.bind(TYPES.RotateTokenUsecase).to(RotateTokenUsecase);
container.bind(TYPES.LogoutUsecase).to(LogoutUsecase);
container.bind(TYPES.AuthController).to(AuthController);
container.bind(TYPES.AuthRouter).to(AuthRouter);

// Account bindings
container.bind(TYPES.GetAccountUsecase).to(GetAccountUsecase);
container.bind(TYPES.UpdateAccountUsecase).to(UpdateAccountUsecase);
container.bind(TYPES.DeleteAccountUsecase).to(DeleteAccountUsecase);
container.bind(TYPES.AccountController).to(AccountController);
container.bind(TYPES.AccountRouter).to(AccountRouter);

// Merchant bindings
container.bind(TYPES.MerchantMapper).to(MerchantMapper);
container.bind(TYPES.MerchantRepository).to(MerchantRepository);
container.bind(TYPES.CreateMerchantUsecase).to(CreateMerchantUsecase);
container.bind(TYPES.GetMerchantDetailsUsecase).to(GetMerchantDetailsUsecase);
container.bind(TYPES.GetUserMerchantsUsecase).to(GetUserMerchantsUsecase);
container.bind(TYPES.DeleteMerchantUsecase).to(DeleteMerchantUsecase);
container.bind(TYPES.MerchantController).to(MerchantController);
container.bind(TYPES.MerchantRouter).to(MerchantRouter);

// Api-Key bindings
container.bind(TYPES.ApiKeyMapper).to(ApiKeyMapper);
container.bind(TYPES.ApiKeyRepository).to(ApiKeyRepository);
container.bind(TYPES.GenerateApiKeyUsecase).to(GenerateApiKeyUsecase);
container.bind(TYPES.GetActiveApiKeyUsecase).to(GetActiveApiKeyUsecase);
container.bind(TYPES.RotateApiKeyUsecase).to(RotateApiKeyUsecase);
container.bind(TYPES.RevokeApiKeyUsecase).to(RevokeApiKeyUsecase);
container.bind(TYPES.ApiKeyController).to(ApiKeyController);
container.bind(TYPES.ApiKeyRouter).to(ApiKeyRouter);

// Internal bindings
container.bind(TYPES.ValidateApiKeyUsecase).to(ValidateApiKeyUsecase);
container.bind(TYPES.InternalController).to(InternalController);
container.bind(TYPES.InternalRouter).to(InternalRouter);

export default container;
