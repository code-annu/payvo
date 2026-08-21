import { prisma } from "@/core/prisma/prisma.client";
import crypto from "crypto";

export default abstract class ProjectFactory {
  static async createProject(
    userId: string,
    name: string = "Test Project",
    isActive: boolean = true,
  ) {
    const project = await prisma.project.create({
      data: {
        userId,
        name,
        isActive,
      },
    });
    return project;
  }

  static async createApiKey(
    projectId: string,
    overrides: {
      keyType?: "SECRET" | "PUBLISHABLE";
      environment?: "TEST" | "LIVE";
      keyPrefix?: string;
      keyHash?: string;
      isActive?: boolean;
      lastUsedAt?: Date | null;
      revokedAt?: Date | null;
    } = {},
  ) {
    const apiKey = await prisma.apiKey.create({
      data: {
        projectId,
        keyType: overrides.keyType ?? "SECRET",
        environment: overrides.environment ?? "TEST",
        keyPrefix: overrides.keyPrefix ?? "sk_test_",
        keyHash: overrides.keyHash ?? crypto.randomBytes(32).toString("hex"),
        isActive: overrides.isActive ?? true,
        lastUsedAt: overrides.lastUsedAt ?? null,
        revokedAt: overrides.revokedAt ?? null,
      },
    });
    return apiKey;
  }
}

