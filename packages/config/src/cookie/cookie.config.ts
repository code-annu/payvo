export const cookieConfig = {
  refreshToken: (maxAgeInDays: number, path: string) => ({
    key: "refreshToken",
    options: {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path,
      maxAge: maxAgeInDays * 24 * 60 * 60 * 1000,
    },
  }),
};
//   path: "/api/auth/rotate-token",

