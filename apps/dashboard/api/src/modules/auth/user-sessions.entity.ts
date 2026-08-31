export interface UserSessions {
  readonly userId: string;
  readonly sessions: {
    readonly id: string;
    readonly userAgent: string | null;
    readonly ipAddress: string | null;
    readonly revokedAt: Date | null;
    readonly expiresAt: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
  }[];
}
