import z from "zod";

export const RefreshTokenSchema = {
  cookies: z.object({
    refreshToken: z
      .string("Refresh token is required")
      .trim()
      .nonempty("Refresh token cannot be empty"),
  }),
};
