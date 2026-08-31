import TYPES from "@/core/di/inversify.types.js";
import { inject, injectable } from "inversify";
import AuthMapper from "../auth.mapper.js";
import { Session } from "../entity/session.entity.js";
import {
  db,
  SessionCreateInput,
  SessionUpdateInput,
  SessionWithUser,
} from "@payvo/database";
import { UserSessions } from "../user-sessions.entity.js";

@injectable()
export default class SessionRepository {
  constructor(@inject(TYPES.AuthMapper) private readonly mapper: AuthMapper) {}

  async createSession(data: SessionCreateInput): Promise<Session> {
    const session = await db.orm.public.Session.include("user").create(data);
    return this.mapper.toSessionEntity(session as SessionWithUser);
  }

  async findSessionById(id: string): Promise<Session | null> {
    const session = await db.orm.public.Session.include("user").first({ id });
    return session
      ? this.mapper.toSessionEntity(session as SessionWithUser)
      : null;
  }

  async findSessionsByUserId(userId: string): Promise<UserSessions> {
    const sessions = await db.orm.public.Session.where({ userId }).all();
    return this.mapper.toUserSessionsEntity(userId, sessions);
  }

  async findSessionByTokenHash(tokenHash: string): Promise<Session | null> {
    const session = await db.orm.public.Session.include("user").first({
      tokenHash,
    });
    return session
      ? this.mapper.toSessionEntity(session as SessionWithUser)
      : null;
  }

  async updateSession(
    id: string,
    data: SessionUpdateInput,
  ): Promise<Session | null> {
    const session = await db.orm.public.Session.where({ id })
      .include("user")
      .update(data);
    return session
      ? this.mapper.toSessionEntity(session as SessionWithUser)
      : null;
  }

  async revokeSession(id: string): Promise<void> {
    await db.orm.public.Session.where({ id }).update({
      revokedAt: new Date().toISOString(),
    });
  }

  async revokeSessionByUserId(userId: string) {
    await db.orm.public.Session.where({ userId }).updateAll({
      revokedAt: new Date().toISOString(),
    });
  }
}
