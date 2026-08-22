import express from "express";
import cookieParser from "cookie-parser";
import container from "@/core/di/inversify.config";
import TYPES from "@/core/di/inversify.types";
import AuthRouter from "@/modules/auth/auth.router";
import UserRouter from "@/modules/user/user.router";
import MerchantRouter from "@/modules/merchant/merchant.router";
import ApiKeyRouter from "@/modules/api-keys/router/api-key.router";
import handleError from "@/shared/middleware/error-handler.middleware";

const app = express();

// app.use(cors());
// app.use(compression());
// app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRouter = container.get<AuthRouter>(TYPES.AuthRouter);
app.use("/api/auth", authRouter.router);

const userRouter = container.get<UserRouter>(TYPES.UserRouter);
app.use("/api/user", userRouter.router);

const merchantRouter = container.get<MerchantRouter>(TYPES.MerchantRouter);
app.use("/api/merchants", merchantRouter.router);

const apiKeyRouter = container.get<ApiKeyRouter>(TYPES.ApiKeyRouter);
app.use("/api/api-keys", apiKeyRouter.router);

// Error handler (must be last)
app.use(handleError);

export default app;
