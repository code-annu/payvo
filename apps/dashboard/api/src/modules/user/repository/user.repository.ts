import { prisma, type TransactionClient } from "@payvo/database/client";
import { User, type UserCreateInput } from "@payvo/database/types";
import { injectable } from "inversify";

@injectable()
export default class UserRepository {
  private readonly db = prisma;
  constructor() {}

  async create(input: UserCreateInput): Promise<User> {
    return this.db.user.create({ data: input });
  }

  async findByEmailIncludeDeleted(email: string): Promise<User | null> {
    return this.db.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findFirst({
      where: { email: email, deletedAt: null },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { id, deletedAt: null },
    });
  }

  async softDelete(
    data: { userId: string; now: Date },
    tx?: TransactionClient,
  ): Promise<User> {
    return (tx ?? this.db).user.update({
      where: { id: data.userId, deletedAt: null },
      data: { deletedAt: data.now },
    });
  }
}
