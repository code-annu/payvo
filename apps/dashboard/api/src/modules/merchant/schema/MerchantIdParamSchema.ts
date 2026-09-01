import z from "zod";

export const merchantIdParamsSchema = z.object({
  id: z.uuid("Valid merchant id is required"),
});
