import { inject, injectable } from "inversify";
import { db, UserCreateInput, UserUpdateInput } from "@payvo/database";
import { User } from "../entity/user.entity.js";
import UserMapper from "../user.mapper.js";
import TYPES from "@/core/di/inversify.types.js";

@injectable()
export default class UserRepository {
  constructor(@inject(TYPES.UserMapper) private readonly mapper: UserMapper) {}

  async createUser(data: UserCreateInput): Promise<User> {
    const user = await db.orm.public.User.create(data);
    return this.mapper.toUserEntity(user);
  }

  async findUserById(id: string): Promise<User | null> {
    const user = await db.orm.public.User.first({ id });
    return user ? this.mapper.toUserEntity(user) : null;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const user = await db.orm.public.User.first({ email });
    return user ? this.mapper.toUserEntity(user) : null;
  }

  async updateUser(id: string, updates: UserUpdateInput): Promise<User | null> {
    const user = await db.orm.public.User.where({ id, deletedAt: null }).update(
      updates,
    );
    return user ? this.mapper.toUserEntity(user) : null;
  }

  async softDeleteUser(id: string) {
    await db.orm.public.User.where({ id, deletedAt: null }).update({
      deletedAt: new Date().toISOString(),
    });
  }

  async restoreUser(id: string): Promise<User | null> {
    const user = await db.orm.public.User.where({ id }).update({
      deletedAt: null,
    });
    return user ? this.mapper.toUserEntity(user) : null;
  }
}
