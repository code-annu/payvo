import { SessionCreateInput } from "@payvo/database/types";
import { injectable } from "inversify";
import { Session } from "../entity/session.entity";
import { client, TransactionClient } from "@payvo/database/client";
import { stringToDate, stringToDateNullable } from "@/core/utils/date.utils";

@injectable()
export default class SessionRepository {
  private readonly db = client;
  async create(data: SessionCreateInput): Promise<Session> {
    const session = await this.db.orm.public.Session.create(data);
    return {
      ...session,
      revokedAt: stringToDateNullable(session.revokedAt),
      updatedAt: stringToDate(session.updatedAt),
      expiresAt: stringToDate(session.expiresAt),
      createdAt: stringToDate(session.createdAt),
    };
  }

  async extendExpiryDate(
    tx: TransactionClient,
    data: { id: string; expiresAt: Date },
  ): Promise<Session | null> {
    const { id, expiresAt } = data;
    const session = await tx.orm.public.Session.where({ id }).update({
      expiresAt: expiresAt.toISOString(),
    });

    return session
      ? {
          ...session,
          revokedAt: stringToDateNullable(session.revokedAt),
          updatedAt: stringToDate(session.updatedAt),
          expiresAt: stringToDate(session.expiresAt),
          createdAt: stringToDate(session.createdAt),
        }
      : null;
  }

  async revoke(tx: TransactionClient, data: { id: string }) {
    await tx.orm.public.Session.where({ id: data.id }).update({
      revokedAt: new Date().toISOString(),
    });
  }
}
