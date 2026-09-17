import { client, TransactionClient } from "@payvo/database/client";
import { UserCreateInput, UserUpdateInput } from "@payvo/database/types";
import { inject, injectable } from "inversify";
import { User } from "../entity/user.entity.js";
import TYPES from "@/core/di/inversify.types.js";
import UserMapper from "../user.mapper.js";

@injectable()
export default class UserRepository {
  private readonly db = client;

  constructor(@inject(TYPES.UserMapper) private readonly mapper: UserMapper) {}

  async create(data: UserCreateInput): Promise<User> {
    const user = await this.db.orm.public.User.create(data);
    return this.mapper.toUserEntity(user);
  }

  async update(id: string, updates: UserUpdateInput): Promise<User | null> {
    const user = await this.db.orm.public.User.where({
      id,
      deletedAt: null,
    }).update(updates);
    return user ? this.mapper.toUserEntity(user) : null;
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.db.orm.public.User.first({ id, deletedAt: null });
    return user ? this.mapper.toUserEntity(user) : null;
  }

  async findByIdIncludingDeleted(id: string): Promise<User | null> {
    const user = await this.db.orm.public.User.first({ id });
    return user ? this.mapper.toUserEntity(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.db.orm.public.User.first({
      email,
      deletedAt: null,
    });
    return user ? this.mapper.toUserEntity(user) : null;
  }

  async findByEmailIncludingDeleted(email: string): Promise<User | null> {
    const user = await this.db.orm.public.User.first({ email });
    return user ? this.mapper.toUserEntity(user) : null;
  }

  async softDelete(
    tx: TransactionClient,
    data: { id: string; deletedAt: Date },
  ): Promise<User | null> {
    const user = await tx.orm.public.User.where({
      id: data.id,
      deletedAt: null,
    }).update({ deletedAt: data.deletedAt.toISOString() });

    return user ? this.mapper.toUserEntity(user) : null;
  }

  async revokeSessionsForAccountDeletion(
    tx: TransactionClient,
    data: { userId: string; revokedAt: Date },
  ) {
    const { userId, revokedAt } = data;
    const deletedSessions = await tx.orm.public.Session.where({
      userId,
      revokedAt: null,
    }).updateAll({ revokedAt: revokedAt.toISOString() });
    return { sessionIds: deletedSessions.map((session) => session.id) };
  }

  async revokeRefreshTokensForAccountDeletion(
    tx: TransactionClient,
    data: { sessionIds: string[]; revokedAt: Date },
  ) {
    const { sessionIds, revokedAt } = data;
    await tx.orm.public.RefreshToken.where((t) => t.sessionId.in(sessionIds))
      .where({ revokedAt: null })
      .updateAll({ revokedAt: revokedAt.toISOString() });
  }

  async disableMerchantForAccountDeletion(
    tx: TransactionClient,
    data: { userId: string },
  ) {
    const disabledMerchants = await tx.orm.public.Merchant.where({
      userId: data.userId,
      isActive: true,
    }).updateAll({ isActive: false });
    return { merchantIds: disabledMerchants.map((merchant) => merchant.id) };
  }

  async revokeApiKeysForAccountDeletion(
    tx: TransactionClient,
    data: { merchantIds: string[]; revokedAt: Date },
  ) {
    const { merchantIds, revokedAt } = data;
    const revokedApiKeys = await tx.orm.public.ApiKey.where((t) =>
      t.merchantId.in(merchantIds),
    )
      .where((t) => t.status.in(["ACTIVE", "GRACE_PERIOD"]))
      .where({ revokedAt: null })
      .updateAll({ revokedAt: revokedAt.toISOString(), status: "REVOKED" });
    return { apiKeyIds: revokedApiKeys.map((apiKey) => apiKey.id) };
  }
}
