import { Session } from "./session.entity";

export interface RefreshToken {
  readonly id: string;
  readonly tokenHash: string;
  readonly session: Session;
  readonly expiresAt: Date;
  readonly revokedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
