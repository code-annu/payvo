export interface User {
  readonly id: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly fullname: string;
  readonly companyName: string | null;
  readonly isEmailVerified: boolean;
  readonly deletedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
