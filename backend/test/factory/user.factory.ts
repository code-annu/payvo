import { prisma } from "@/core/prisma/prisma.client";
import bcrypt from "bcrypt";

export default abstract class UserFactory {

  static async createUser(email: string, password: string) {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(password, 10),
        fullname: "Test User",
        isEmailVerified: true,
      },
    });
    return user;
  }
}
