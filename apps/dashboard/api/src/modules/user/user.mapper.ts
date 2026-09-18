import type { User as PrismaUser } from "@payvo/database/types";
import { injectable } from "inversify";

import type { User } from "./entity/user.entity.js";

@injectable()
export default class UserMapper {
  toUserEntity(prismaUser: PrismaUser): User {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      passwordHash: prismaUser.passwordHash,
      fullname: prismaUser.fullname,
      companyName: prismaUser.companyName,
      isEmailVerified: prismaUser.isEmailVerified,
      deletedAt: prismaUser.deletedAt ? new Date(prismaUser.deletedAt) : null,
      createdAt: new Date(prismaUser.createdAt),
      updatedAt: new Date(prismaUser.updatedAt),
    };
  }
}
