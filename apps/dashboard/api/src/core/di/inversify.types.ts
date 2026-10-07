const TYPES = {
  // Util types
  ClientInfoUtil: Symbol.for("ClientInfoUtil"),

  // User types
  UserRepository: Symbol.for("UserRepository"),
  UserService: Symbol.for("UserService"),
  UserController: Symbol.for("UserController"),
  UserRouter: Symbol.for("UserRouter"),
  UserMapper: Symbol.for("UserMapper"),
  UserCache: Symbol.for("UserCache"),

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
  MerchantController: Symbol.for("MerchantController"),
  MerchantRouter: Symbol.for("MerchantRouter"),
  MerchantMapper: Symbol.for("MerchantMapper"),
  MerchantCache: Symbol.for("MerchantCache"),
  MerchantAuthorizationService: Symbol.for("MerchantAuthorizationService"),

  // ApiKey types
  ApiKeyRepository: Symbol.for("ApiKeyRepository"),
  ApiKeyService: Symbol.for("ApiKeyService"),
  ApiKeyController: Symbol.for("ApiKeyController"),
  ApiKeyRouter: Symbol.for("ApiKeyRouter"),
  ApiKeyMapper: Symbol.for("ApiKeyMapper"),
  GenerateApiKeyUsecase: Symbol.for("GenerateApiKeyUsecase"),
  GetActiveApiKeyUsecase: Symbol.for("GetActiveApiKeyUsecase"),
  ListMerchantApiKeysUsecase: Symbol.for("ListMerchantApiKeysUsecase"),
  RotateApiKeyUsecase: Symbol.for("RotateApiKeyUsecase"),
  RevokeApiKeyUsecase: Symbol.for("RevokeApiKeyUsecase"),
  ApiKeyCache: Symbol.for("ApiKeyCache"),

  // Webhook types
  WebhookRepository: Symbol.for("WebhookRepository"),
  WebhookMapper: Symbol.for("WebhookMapper"),
  WebhookController: Symbol.for("WebhookController"),
  WebhookRouter: Symbol.for("WebhookRouter"),
  CreateWebhookUsecase: Symbol.for("CreateWebhookUsecase"),
  GetMerchantWebhooksUsecase: Symbol.for("GetMerchantWebhooksUsecase"),
  GetWebhookDetailsUsecase: Symbol.for("GetWebhookDetailsUsecase"),
  DeleteWebhookUsecase: Symbol.for("DeleteWebhookUsecase"),
  UpdateWebhookUsecase: Symbol.for("UpdateWebhookUsecase"),

  // Transaction types
  TransactionRepository: Symbol.for("TransactionRepository"),
  TransactionMapper: Symbol.for("TransactionMapper"),
  TransactionController: Symbol.for("TransactionController"),
  TransactionRouter: Symbol.for("TransactionRouter"),
  GetMerchantTransactionsUsecase: Symbol.for("GetMerchantTransactionsUsecase"),
  GetTransactionDetailsUsecase: Symbol.for("GetTransactionDetailsUsecase"),
};

export default TYPES;
