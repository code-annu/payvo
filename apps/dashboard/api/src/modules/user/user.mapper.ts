import { User as PrismaUser } from "@payvo/database";
import { User } from "./entity/user.entity.js";
import { injectable } from "inversify";

@injectable()
export default class UserMapper {
  toUserEntity(user: PrismaUser): User {
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      fullname: user.fullname,
      companyName: user.companyName,
      isEmailVerified: user.isEmailVerified,
      deletedAt: user.deletedAt ? new Date(user.deletedAt) : null,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
    };
  }
}
