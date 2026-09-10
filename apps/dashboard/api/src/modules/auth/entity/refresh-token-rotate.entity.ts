export interface RefreshTokenRotate {
  readonly id: string;
  readonly tokenHash: string;
  readonly revokedAt: Date | null;
  readonly session: {
    readonly id: string;
    readonly expiresAt: Date;
    readonly revokedAt: Date | null;
    readonly user: {
      readonly id: string;
      readonly deletedAt: Date | null;
    };
  };
}
