import { injectable, inject } from "inversify";
import UserMapper from "../user.mapper.js";
import TYPES from "@/core/di/inversify.types.js";
import { client } from "@payvo/database/client";
import { UserCreateInput, UserUpdateInput } from "@payvo/database/types";
import { User } from "../entity/user.entity.js";

@injectable()
export default class UserRepository {
  private readonly db = client;
  constructor(@inject(TYPES.UserMapper) private readonly mapper: UserMapper) {}

  async create(data: UserCreateInput): Promise<User> {
    const user = await this.db.orm.public.User.create(data);
    return this.mapper.toUserEntity(user);
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

  async findById(id: string): Promise<User | null> {
    const user = await this.db.orm.public.User.first({
      id,
      deletedAt: null,
    });
    return user ? this.mapper.toUserEntity(user) : null;
  }

  async update(id: string, data: UserUpdateInput): Promise<User | null> {
    const user = await this.db.orm.public.User.where({
      id,
      deletedAt: null,
    }).update(data);
    return user ? this.mapper.toUserEntity(user) : null;
  }

  async softDelete(id: string): Promise<User | null> {
    const user = await this.db.orm.public.User.where({
      id,
      deletedAt: null,
    }).update({ deletedAt: new Date().toISOString() });
    return user ? this.mapper.toUserEntity(user) : null;
  }
}
