const TYPES = {
  // Util types
  JWTUtil: Symbol.for("JWTUtil"),
  ClientInfoUtil: Symbol.for("ClientInfoUtil"),

  // User types
  UserController: Symbol.for("UserController"),
  UserRouter: Symbol.for("UserRouter"),
  UserService: Symbol.for("UserService"),
  UserRepository: Symbol.for("UserRepository"),

  // Auth types
  AuthController: Symbol.for("AuthController"),
  AuthRouter: Symbol.for("AuthRouter"),
  AuthService: Symbol.for("AuthService"),
  SessionRepository: Symbol.for("SessionRepository"),
  RefreshTokenRepository: Symbol.for("RefreshTokenRepository"),

  // Merchant types
  MerchantController: Symbol.for("MerchantController"),
  MerchantRouter: Symbol.for("MerchantRouter"),
  MerchantService: Symbol.for("MerchantService"),
  MerchantRepository: Symbol.for("MerchantRepository"),

  // Api Key types
  ApiKeyController: Symbol.for("ApiKeyController"),
  ApiKeyRouter: Symbol.for("ApiKeyRouter"),
  BaseApiKeyRouter: Symbol.for("BaseApiKeyRouter"),
  ApiKeyService: Symbol.for("ApiKeyService"),
  ApiKeyRepository: Symbol.for("ApiKeyRepository"),
  ApiKeyUtil: Symbol.for("ApiKeyUtil"),
};

export default TYPES;

