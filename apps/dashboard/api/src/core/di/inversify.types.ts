const TYPES = {
  // Util types
  ClientInfoUtil: Symbol.for("ClientInfoUtil"),
  
  // User types
  UserRepository: Symbol.for("UserRepository"),
  UserService: Symbol.for("UserService"),
  UserController: Symbol.for("UserController"),
  UserRouter: Symbol.for("UserRouter"),
  UserCacheService: Symbol.for("UserCacheService"),

  // Auth types
  SessionRepository: Symbol.for("SessionRepository"),
  RefreshTokenRepository: Symbol.for("RefreshTokenRepository"),
  AuthController: Symbol.for("AuthController"),
  AuthService: Symbol.for("AuthService"),
  AuthRouter: Symbol.for("AuthRouter"),

  // Merchant types
  MerchantRepository: Symbol.for("MerchantRepository"),
  MerchantService: Symbol.for("MerchantService"),
  MerchantController: Symbol.for("MerchantController"),
  MerchantRouter: Symbol.for("MerchantRouter"),

  // ApiKey types
  ApiKeyRepository: Symbol.for("ApiKeyRepository"),
  ApiKeyService: Symbol.for("ApiKeyService"),
  ApiKeyController: Symbol.for("ApiKeyController"),
  ApiKeyRouter: Symbol.for("ApiKeyRouter"),

  // Internal types
  InternalService: Symbol.for("InternalService"),
  InternalController: Symbol.for("InternalController"),
  InternalRouter: Symbol.for("InternalRouter"),

};

export default TYPES;
