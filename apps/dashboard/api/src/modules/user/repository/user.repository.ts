import { client, TransactionClient } from "@payvo/database/client";
import { UserCreateInput, UserUpdateInput } from "@payvo/database/types";
import { injectable } from "inversify";
import { User } from "../entity/user.entity.js";
import { stringToDate, stringToDateNullable } from "@/core/utils/date.utils.js";

@injectable()
export default class UserRepository {
  private readonly db = client;

  async create(data: UserCreateInput): Promise<User> {
    const user = await this.db.orm.public.User.create(data);
    return {
      ...user,
      deletedAt: stringToDateNullable(user.deletedAt),
      createdAt: stringToDate(user.createdAt),
      updatedAt: stringToDate(user.updatedAt),
    };
  }

  async update(id: string, updates: UserUpdateInput): Promise<User | null> {
    const user = await this.db.orm.public.User.where({
      id,
      deletedAt: null,
    }).update(updates);
    return user
      ? {
          ...user,
          deletedAt: stringToDateNullable(user.deletedAt),
          createdAt: stringToDate(user.createdAt),
          updatedAt: stringToDate(user.updatedAt),
        }
      : null;
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.db.orm.public.User.first({ id });
    return user
      ? {
          ...user,
          deletedAt: stringToDateNullable(user.deletedAt),
          createdAt: stringToDate(user.createdAt),
          updatedAt: stringToDate(user.updatedAt),
        }
      : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.db.orm.public.User.first({ email });
    return user
      ? {
          ...user,
          deletedAt: stringToDateNullable(user.deletedAt),
          createdAt: stringToDate(user.createdAt),
          updatedAt: stringToDate(user.updatedAt),
        }
      : null;
  }

  async softDelete(tx: TransactionClient, id: string): Promise<User | null> {
    const user = await tx.orm.public.User.where({ id, deletedAt: null }).update(
      { deletedAt: new Date().toISOString() },
    );

    return user
      ? {
          ...user,
          deletedAt: stringToDateNullable(user.deletedAt),
          createdAt: stringToDate(user.createdAt),
          updatedAt: stringToDate(user.updatedAt),
        }
      : null;
  }

  async revokeSessions(tx: TransactionClient, userId: string) {
    const deletedSessions = await tx.orm.public.Session.where({
      userId,
      revokedAt: null,
    }).updateAll({
      revokedAt: new Date().toISOString(),
    });
    return { sessionIds: deletedSessions.map((session) => session.id) };
  }

  async revokeRefreshTokens(tx: TransactionClient, sessionIds: string[]) {
    await tx.orm.public.RefreshToken.where((t) => t.sessionId.in(sessionIds))
      .where({ revokedAt: null })
      .updateAll({ revokedAt: new Date().toISOString() });
  }
}
