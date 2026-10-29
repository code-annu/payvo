export type AuthOutput = {
  accessToken: { token: string; expiresAt: Date };
  refreshToken: string;
};
