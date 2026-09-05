const TYPES = {
  // Util types
  ClientInfoUtil: Symbol.for("ClientInfoUtil"),
  StringUtil: Symbol.for("StringUtil"),

  // User types
  UserRepository: Symbol.for("UserRepository"),
  UserMapper: Symbol.for("UserMapper"),
  UserService: Symbol.for("UserService"),
  UserController: Symbol.for("UserController"),
  UserRouter: Symbol.for("UserRouter"),

  // Auth types
  AuthMapper: Symbol.for("AuthMapper"),
  SessionRepository: Symbol.for("SessionRepository"),
  AuthController: Symbol.for("AuthController"),
  AuthService: Symbol.for("AuthService"),
  AuthRouter: Symbol.for("AuthRouter"),

  // Merchant types
  MerchantRepository: Symbol.for("MerchantRepository"),
  MerchantMapper: Symbol.for("MerchantMapper"),
  MerchantService: Symbol.for("MerchantService"),
  MerchantController: Symbol.for("MerchantController"),
  MerchantRouter: Symbol.for("MerchantRouter"),

  // ApiKey types
  ApiKeyRepository: Symbol.for("ApiKeyRepository"),
  ApiKeyMapper: Symbol.for("ApiKeyMapper"),
  ApiKeyService: Symbol.for("ApiKeyService"),
  ApiKeyController: Symbol.for("ApiKeyController"),
  ApiKeyRouter: Symbol.for("ApiKeyRouter"),
};

export default TYPES;
