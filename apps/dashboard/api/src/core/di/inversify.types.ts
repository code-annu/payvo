const TYPES = {
  // Util types
  ClientInfoUtil: Symbol.for("ClientInfoUtil"),

  // User types
  UserRepository: Symbol.for("UserRepository"),
  UserMapper: Symbol.for("UserMapper"),
  UserService: Symbol.for("UserService"),

  // Account types
  UserProfileRepository: Symbol.for("UserProfileRepository"),
  UserPreferencesRepository: Symbol.for("UserPreferencesRepository"),
  AccountMapper: Symbol.for("AccountMapper"),
  AccountService: Symbol.for("AccountService"),
  AccountController: Symbol.for("AccountController"),
  AccountRouter: Symbol.for("AccountRouter"),

  // Auth types
  SessionRepository: Symbol.for("SessionRepository"),
  RefreshTokenRepository: Symbol.for("RefreshTokenRepository"),
  AuthService: Symbol.for("AuthService"),
  AuthController: Symbol.for("AuthController"),
  AuthRouter: Symbol.for("AuthRouter"),
};

export default TYPES;
