import z from "zod";

export const ValidateApiKeySchema = {
  body: z.object({
    keyId: z
      .string("keyId is required")
      .trim()
      .nonempty("keyId cannot be empty"),
    keySecret: z
      .string("keySecret is required")
      .trim()
      .nonempty("keySecret cannot be empty"),
  }),
};
