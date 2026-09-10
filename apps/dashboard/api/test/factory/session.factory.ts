import { client } from "@payvo/database/client";
import type { Session } from "@payvo/database/types";
import { addDays } from "date-fns";

export interface SessionOverrides {
  userAgent?: string | null;
  ipAddress?: string | null;
  expiresAt?: string;
  revokedAt?: string | null;
}

export abstract class SessionFactory {
  static async createSession(
    userId: string,
    overrides: SessionOverrides = {},
  ): Promise<Session> {
    const session = await client.orm.public.Session.create({
      userId,
      userAgent: overrides.userAgent ?? "supertest/1.0",
      ipAddress: overrides.ipAddress ?? "127.0.0.1",
      expiresAt: overrides.expiresAt ?? addDays(new Date(), 30).toISOString(),
    });

    if (overrides.revokedAt !== undefined) {
      const updated = await client.orm.public.Session.where({
        id: session.id,
      }).update({
        revokedAt: overrides.revokedAt,
      });
      if (!updated) throw new Error("Failed to update session revokedAt");
      return updated;
    }

    return session;
  }

  static async findSession(
    where: Parameters<typeof client.orm.public.Session.first>[0],
  ): Promise<Session | null> {
    return client.orm.public.Session.first(where);
  }

  static async findSessionById(id: string): Promise<Session | null> {
    return client.orm.public.Session.first({ id });
  }

  static async findSessionByUserId(userId: string): Promise<Session | null> {
    return client.orm.public.Session.first({ userId });
  }
}
