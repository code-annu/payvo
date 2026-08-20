import { prisma } from "@/core/prisma/prisma.client";
import { Prisma } from "@/generated/prisma";
import { injectable } from "inversify";
import { Session } from "../entity/session.entity";

@injectable()
export default class SessionRepository {
  private readonly db = prisma;

  async create(data: Prisma.SessionUncheckedCreateInput): Promise<Session> {
    return this.db.session.create({ data, include: { user: true } });
  }

  async findById(id: string): Promise<Session> {
    return this.db.session.findUniqueOrThrow({
      where: { id },
      include: { user: true },
    });
  }

  async revoke(id: string) {
    return this.db.session.updateMany({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllByUserId(userId: string) {
    return this.db.session.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    });
  }
}
