import { client } from "@payvo/database/client";
import type { RefreshToken } from "@payvo/database/types";
import {
  generateRefreshToken,
  hashRefreshToken,
} from "@payvo/shared/refresh-token";

export interface RefreshTokenOverrides {
  revokedAt?: string | null;
  revokedById?: string | null;
}

export interface CreateRefreshTokenResult {
  rawToken: string;
  record: RefreshToken;
}

export abstract class RefreshTokenFactory {
  static async createRefreshToken(
    sessionId: string,
    overrides: RefreshTokenOverrides = {},
  ): Promise<CreateRefreshTokenResult> {
    const rawToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(rawToken);

    const record = await client.orm.public.RefreshToken.create({
      sessionId,
      tokenHash,
    });

    if (overrides.revokedAt !== undefined) {
      const updated = await client.orm.public.RefreshToken.where({
        id: record.id,
      }).update({
        revokedAt: overrides.revokedAt,
        revokedById: overrides.revokedById ?? null,
      });
      if (!updated) throw new Error("Failed to update refresh token revokedAt");
      return { rawToken, record: updated };
    }

    return { rawToken, record };
  }

  static async findRefreshToken(
    where: Parameters<typeof client.orm.public.RefreshToken.first>[0],
  ): Promise<RefreshToken | null> {
    return client.orm.public.RefreshToken.first(where);
  }

  static async findRefreshTokenById(id: string): Promise<RefreshToken | null> {
    return client.orm.public.RefreshToken.first({ id });
  }

  static async findRefreshTokenBySessionId(
    sessionId: string,
  ): Promise<RefreshToken | null> {
    return client.orm.public.RefreshToken.first({ sessionId });
  }
}
