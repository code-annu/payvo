import { SessionWithUser, Session as PrismaSession } from "@payvo/database";
import { injectable } from "inversify";
import { Session } from "./entity/session.entity.js";
import { UserSessions } from "./user-sessions.entity.js";

@injectable()
export default class AuthMapper {
  toSessionEntity(session: SessionWithUser): Session {
    return {
      id: session.id,
      user: {
        id: session.user.id,
        email: session.user.email,
        isEmailVerified: session.user.isEmailVerified,
        deletedAt: session.user.deletedAt,
        createdAt: new Date(session.user.createdAt),
        updatedAt: new Date(session.user.updatedAt),
      },
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      revokedAt: session.revokedAt ? new Date(session.revokedAt) : null,
      expiresAt: new Date(session.expiresAt),
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
    };
  }

  toUserSessionsEntity(
    userId: string,
    prismaSessions: PrismaSession[],
  ): UserSessions {
    return {
      userId: userId,
      sessions: prismaSessions.map((session) => ({
        id: session.id,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        revokedAt: session.revokedAt ? new Date(session.revokedAt) : null,
        expiresAt: new Date(session.expiresAt),
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
      })),
    };
  }
}
