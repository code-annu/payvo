import { User } from "@/modules/user/entity/user.entity";

export interface Session {
  readonly id: string;
  readonly user: User;
  readonly userAgent: string | null;
  readonly ipAddress: string | null;
  readonly revokedAt: Date | null;
  readonly expiresAt: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
