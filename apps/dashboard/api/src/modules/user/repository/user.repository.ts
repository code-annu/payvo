import { client } from "@payvo/database/client";
import { UserCreateInput, UserUpdateInput } from "@payvo/database/types";
import { injectable } from "inversify";
import { User } from "../entity/user.entity";
import { stringToDate, stringToDateNullable } from "@/core/utils/date.utils";

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
    const user = await this.db.orm.public.User.where({ id }).update(updates);
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
}
