import { User as PrismaUser } from "@payvo/database/types";
import { injectable } from "inversify";
import { User } from "./entity/user.entity.js";

@injectable()
export default class UserMapper {
  toUserEntity(user: PrismaUser): User {
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      fullname: user.fullname,
      companyName: user.companyName,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
      deletedAt: user.deletedAt ? new Date(user.deletedAt) : null,
      isEmailVerified: user.isEmailVerified,
    };
  }
}
