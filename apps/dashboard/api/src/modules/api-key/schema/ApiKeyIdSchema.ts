import z from "zod";

export const ApiKeyIdSchema = z.object({
  id: z
    .uuid("Api key must be a valid UUID")
    .trim()
    .nonempty("Api key id cannot be empty"),
});
