export interface Session {
  readonly id: string;
  readonly user: {
    readonly id: string;
    readonly email: string;
    readonly isEmailVerified: boolean;
    readonly deletedAt: string | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;
  };
  readonly userAgent: string | null;
  readonly ipAddress: string | null;
  readonly revokedAt: Date | null;
  readonly expiresAt: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
