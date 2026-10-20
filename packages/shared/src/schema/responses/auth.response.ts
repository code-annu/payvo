export type AuthTokenResponse = { accessToken: string; expiresAt: Date };
export type AuthMeResponse = {
  email: string;
  emailVerifiedAt: Date | null;
  passwordChangedAt: Date | null;
  createdOn: Date;
};
