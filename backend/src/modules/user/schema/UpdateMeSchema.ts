import z from "zod";

const UpdateMeBodySchema = z.object({
  fullname: z
    .string()
    .trim()
    .nonempty("Full name cannot be empty")
    .min(3, "Full name must be at least 3 characters long")
    .max(100, "Full name must be at most 100 characters")
    .optional(),
  companyName: z
    .string()
    .trim()
    .max(100, "Company name must be at most 100 characters")
    .nullish(),
});

export const UpdateMeSchema = {
  body: UpdateMeBodySchema,
};
