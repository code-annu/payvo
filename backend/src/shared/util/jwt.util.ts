import jwt from "jsonwebtoken";
import { StringValue } from "ms";
import { injectable } from "inversify";
import crypto from "crypto";
import { addDays } from "date-fns";
import ENV from "@/core/config/env";

export interface JWTPayload {
  sub: string;
  sid: string;
}

@injectable()
export default class JWTUtil {
  private readonly ACCESS_TOKEN_SECRET = ENV.JWT_ACCESS_SECRET;
  private readonly ACCESS_TOKEN_EXPIRE = (ENV.JWT_ACCESS_EXPIRES_IN ??
    "1m") as StringValue;

  generateAccessToken = (payload: JWTPayload): string => {
    const token = jwt.sign(
      { ...payload, jti: crypto.randomUUID() },
      this.ACCESS_TOKEN_SECRET,
      { expiresIn: this.ACCESS_TOKEN_EXPIRE },
    );
    return token;
  };

  generateRefreshToken(length = 64): string {
    return crypto.randomBytes(length).toString("hex");
  }

  hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  verifyAccessToken = (token: string): JWTPayload => {
    return jwt.verify(token, this.ACCESS_TOKEN_SECRET) as JWTPayload;
  };

  generateRefreshTokenExpiry(): Date {
    return addDays(new Date(), ENV.JWT_REFRESH_EXPIRES_IN);
  }
}
