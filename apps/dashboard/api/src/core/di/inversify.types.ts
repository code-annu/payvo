const TYPES = {
  // Util types
  ClientInfoUtil: Symbol.for("ClientInfoUtil"),

  // User types
  UserRepository: Symbol.for("UserRepository"),
  UserService: Symbol.for("UserService"),
  UserController: Symbol.for("UserController"),
  UserRouter: Symbol.for("UserRouter"),
  UserCacheService: Symbol.for("UserCacheService"),
  UserMapper: Symbol.for("UserMapper"),

  // Auth types
  SessionRepository: Symbol.for("SessionRepository"),
  RefreshTokenRepository: Symbol.for("RefreshTokenRepository"),
  AuthController: Symbol.for("AuthController"),
  AuthRouter: Symbol.for("AuthRouter"),
  AuthMapper: Symbol.for("AuthMapper"),
  SignupUsecase: Symbol.for("SignupUsecase"),
  LoginUsecase: Symbol.for("LoginUsecase"),
  RotateTokenUsecase: Symbol.for("RotateTokenUsecase"),
  LogoutUsecase: Symbol.for("LogoutUsecase"),

  // Account types
  GetAccountUsecase: Symbol.for("GetAccountUsecase"),
  UpdateAccountUsecase: Symbol.for("UpdateAccountUsecase"),
  DeleteAccountUsecase: Symbol.for("DeleteAccountUsecase"),
  AccountController: Symbol.for("AccountController"),
  AccountRouter: Symbol.for("AccountRouter"),

  // Merchant types
  MerchantRepository: Symbol.for("MerchantRepository"),
  CreateMerchantUsecase: Symbol.for("CreateMerchantUsecase"),
  GetMerchantDetailsUsecase: Symbol.for("GetMerchantDetailsUsecase"),
  GetUserMerchantsUsecase: Symbol.for("GetUserMerchantsUsecase"),
  DeleteMerchantUsecase: Symbol.for("DeleteMerchantUsecase"),
  MerchantService: Symbol.for("MerchantService"),
  MerchantController: Symbol.for("MerchantController"),
  MerchantRouter: Symbol.for("MerchantRouter"),
  MerchantMapper: Symbol.for("MerchantMapper"),
  MerchantCacheService: Symbol.for("MerchantCacheService"),

  // ApiKey types
  ApiKeyRepository: Symbol.for("ApiKeyRepository"),
  ApiKeyService: Symbol.for("ApiKeyService"),
  ApiKeyController: Symbol.for("ApiKeyController"),
  ApiKeyRouter: Symbol.for("ApiKeyRouter"),
  ApiKeyMapper: Symbol.for("ApiKeyMapper"),
  GenerateApiKeyUsecase: Symbol.for("GenerateApiKeyUsecase"),
  GetActiveApiKeyUsecase: Symbol.for("GetActiveApiKeyUsecase"),
  RotateApiKeyUsecase: Symbol.for("RotateApiKeyUsecase"),
  RevokeApiKeyUsecase: Symbol.for("RevokeApiKeyUsecase"),

  // Internal types
  ValidateApiKeyUsecase: Symbol.for("ValidateApiKeyUsecase"),
  InternalController: Symbol.for("InternalController"),
  InternalRouter: Symbol.for("InternalRouter"),
};

export default TYPES;
