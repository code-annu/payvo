import { prisma, type TransactionClient } from "@payvo/database/client";
import type {
  UserProfile,
  UserProfileUncheckedCreateInput,
  UserProfileUpdateInput,
} from "@payvo/database/types";
import { injectable } from "inversify";

@injectable()
export default class UserProfileRepository {
  private readonly db = prisma;

  findByUserId(userId: string): Promise<UserProfile | null> {
    return this.db.userProfile.findUnique({ where: { userId } });
  }

  create(
    tx: TransactionClient,
    data: UserProfileUncheckedCreateInput,
  ): Promise<UserProfile> {
    return tx.userProfile.create({ data });
  }

  update(
    tx: TransactionClient,
    userId: string,
    data: UserProfileUpdateInput,
  ): Promise<UserProfile> {
    return tx.userProfile.update({
      where: { userId },
      data,
    });
  }

  async deleteByUserId(tx: TransactionClient, userId: string): Promise<void> {
    await tx.userProfile.deleteMany({ where: { userId } });
  }
}
