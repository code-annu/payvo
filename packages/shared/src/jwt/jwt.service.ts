import jwt from "jsonwebtoken";
import crypto from "crypto";
import { addDays } from "date-fns";
import { JWTPayloadType } from "./jwt-payload.type.js";

export class JWTService {
  generateAccessToken<T>(
    payload: JWTPayloadType | T,
    options: { secret: string; expiresInMinute: number },
  ): string {
    return jwt.sign(payload as Object, options.secret, {
      expiresIn: `${options.expiresInMinute}m`,
    });
  }

  verifyAccessToken<T>(token: string, secret: string): T | JWTPayloadType {
    return jwt.verify(token, secret) as T;
  }

  generateRefreshToken(options: { expiresInDays: number; length?: number }) {
    const token = crypto.randomBytes(options.length ?? 64).toString("hex");

    return {
      token: this.hashToken(token),
      expiresAt: addDays(new Date(), options.expiresInDays),
    };
  }

  hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }
}
