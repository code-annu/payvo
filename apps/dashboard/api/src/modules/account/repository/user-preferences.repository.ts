import { prisma, type TransactionClient } from "@payvo/database/client";
import type {
  Prisma,
  UserPreferenceUncheckedCreateInput,
  UserPreferenceUpdateInput,
} from "@payvo/database/types";
import { injectable } from "inversify";

const accountPreferenceRelations = {
  preferredLanguage: true,
  preferredCurrency: true,
} satisfies Prisma.UserPreferenceInclude;

@injectable()
export default class UserPreferencesRepository {
  private readonly db = prisma;

  findByUserId(userId: string) {
    return this.db.userPreference.findUnique({ where: { userId } });
  }

  create(tx: TransactionClient, data: UserPreferenceUncheckedCreateInput) {
    return tx.userPreference.create({
      data,
      include: accountPreferenceRelations,
    });
  }

  update(
    tx: TransactionClient,
    userId: string,
    data: UserPreferenceUpdateInput,
  ) {
    return tx.userPreference.update({
      where: { userId },
      data,
      include: accountPreferenceRelations,
    });
  }

  findByUserIdWithRelations(userId: string) {
    return this.db.userPreference.findUnique({
      where: { userId },
      include: accountPreferenceRelations,
    });
  }

  async deleteByUserId(tx: TransactionClient, userId: string): Promise<void> {
    await tx.userPreference.deleteMany({ where: { userId } });
  }
}
