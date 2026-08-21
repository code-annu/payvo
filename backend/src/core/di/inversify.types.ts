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

  // Project types
  ProjectController: Symbol.for("ProjectController"),
  ProjectRouter: Symbol.for("ProjectRouter"),
  ProjectService: Symbol.for("ProjectService"),
  ProjectRepository: Symbol.for("ProjectRepository"),
};

export default TYPES;

