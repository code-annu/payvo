export interface RefreshToken {
  readonly id: string;
  readonly sessionId: string;
  readonly tokenHash: string;
  readonly revokedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
