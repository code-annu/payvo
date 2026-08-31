import z from "zod";

const RefreshTokenCookieSchema = z.object({
  refreshToken: z
    .string("Refresh token is required")
    .trim()
    .nonempty("Refresh token cannot be empty"),
});

export const RefreshTokenSchema = {
  cookies: RefreshTokenCookieSchema,
};
