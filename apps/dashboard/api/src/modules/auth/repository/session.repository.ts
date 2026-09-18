import { injectable, inject } from "inversify";
import AuthMapper from "../auth.mapper.js";
import TYPES from "@/core/di/inversify.types.js";
import { client, TransactionClient } from "@payvo/database/client";
import { SessionCreateInput } from "@payvo/database/types";
import { Session } from "../entity/session.entity.js";

@injectable()
export default class SessionRepository {
  private readonly db = client;
  constructor(@inject(TYPES.AuthMapper) private readonly mapper: AuthMapper) {}

  async create(data: SessionCreateInput): Promise<Session> {
    const session = await this.db.orm.public.Session.create(data);
    return this.mapper.toSessionEntity(session);
  }

  async extendExpiryDate(
    tx: TransactionClient,
    data: { id: string; expiresAt: Date; now: Date },
  ): Promise<Session | null> {
    const session = await tx.orm.public.Session.where({
      id: data.id,
      revokedAt: null,
    })
      .where((s) => s.expiresAt.gt(data.now.toISOString()))
      .update({
        expiresAt: data.expiresAt.toISOString(),
      });
    return session ? this.mapper.toSessionEntity(session) : null;
  }

  async revokeForLogout(
    tx: TransactionClient,
    data: { id: string; now: Date },
  ): Promise<void> {
    await tx.orm.public.Session.where({
      id: data.id,
      revokedAt: null,
    }).update({ revokedAt: data.now.toISOString() });
  }
}
