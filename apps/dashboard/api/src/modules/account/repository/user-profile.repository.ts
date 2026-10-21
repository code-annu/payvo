import { prisma, type TransactionClient } from "@payvo/database/client";
import type {
  Prisma,
  UserProfile,
  UserProfileUncheckedCreateInput,
  UserProfileUpdateInput,
} from "@payvo/database/types";
import { injectable } from "inversify";

const userProfileRelations = {
  preferredCurrency: true,
  preferredLanguage: true,
} satisfies Prisma.UserProfileInclude;

@injectable()
export default class UserProfileRepository {
  private readonly db = prisma;

  findByUserId(userId: string): Promise<UserProfile | null> {
    return this.db.userProfile.findUnique({
      where: { userId },
      include: userProfileRelations,
    });
  }

  create(tx: TransactionClient, data: UserProfileUncheckedCreateInput) {
    return tx.userProfile.create({ data, include: userProfileRelations });
  }

  update(tx: TransactionClient, userId: string, data: UserProfileUpdateInput) {
    return tx.userProfile.update({
      where: { userId },
      data,
      include: userProfileRelations,
    });
  }

  findByUserIdWithRelations(userId: string) {
    return this.db.userProfile.findUnique({
      where: { userId },
      include: userProfileRelations,
    });
  }

  async deleteByUserId(tx: TransactionClient, userId: string): Promise<void> {
    await tx.userProfile.deleteMany({ where: { userId } });
  }
}
