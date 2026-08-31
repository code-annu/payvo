import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import container from "./core/di/inversify.config.js";
import TYPES from "./core/di/inversify.types.js";
import AuthRouter from "./modules/auth/auth.router.js";
import handleError from "./core/middleware/error-handler.middleware.js";

const app: Express = express();

app.use(express.json());
app.use(cookieParser());
app.use("/health", (_, res) => {
  res.send("OK");
});

const authRouter = container.get<AuthRouter>(TYPES.AuthRouter);

app.use("/api/auth", authRouter.router);

app.use(handleError);

export default app;
