import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import container from "./core/di/inversify.config.js";
import TYPES from "./core/di/inversify.types.js";
import AuthRouter from "./modules/auth/auth.router.js";
import UserRouter from "./modules/user/user.router.js";
import MerchantRouter from "./modules/merchant/merchant.router.js";
import ApiKeyRouter from "./modules/api-key/api-key.router.js";
import handleError from "./core/middleware/error-handler.middleware.js";
import cors from "cors";
import { corsConfig } from "@payvo/config/cors";

const app: Express = express();

console.log(corsConfig);
const corsOptions = {
  origin: corsConfig.origin,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // if you're sending cookies or auth headers
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use("/health", (_, res) => {
  res.send("OK");
});

const authRouter = container.get<AuthRouter>(TYPES.AuthRouter);
const userRouter = container.get<UserRouter>(TYPES.UserRouter);
const merchantRouter = container.get<MerchantRouter>(TYPES.MerchantRouter);
const apiKeyRouter = container.get<ApiKeyRouter>(TYPES.ApiKeyRouter);

app.use("/api/auth", authRouter.router);
app.use("/api/users", userRouter.router);
app.use("/api/merchants", merchantRouter.router);
app.use("/api/merchants", apiKeyRouter.router);

app.use(handleError);

export default app;
