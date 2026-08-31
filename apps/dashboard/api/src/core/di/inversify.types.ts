const TYPES = {
  // Util types
  ClientInfoUtil: Symbol.for("ClientInfoUtil"),

  // Shared types
  JWTService: Symbol.for("JWTService"),
  PasswordHashService: Symbol.for("PasswordHashService"),

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
};

export default TYPES;
