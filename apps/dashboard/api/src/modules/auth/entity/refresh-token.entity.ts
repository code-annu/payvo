export interface RefreshToken {
  readonly id: string;
  readonly tokenHash: string;
  readonly sessionId: string;
  readonly revokedById: string | null;
  readonly revokedAt: Date | null;
  readonly createdAt: Date;
}
