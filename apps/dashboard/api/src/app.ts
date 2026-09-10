import cookieParser from "cookie-parser";
import express, { type Express } from "express";
import handleError from "./core/middleware/error-handler.middleware";
import container from "./core/di/inversify.config";
import TYPES from "./core/di/inversify.types";
import AuthRouter from "./modules/auth/auth.router";

const app: Express = express();

// app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

const authRouter = container.get<AuthRouter>(TYPES.AuthRouter);
app.use("/api/auth", authRouter.router);

app.use(handleError);

export default app;
