import z from "zod";

export const UpdateUserSchema = {
  body: z.object({
    fullname: z
      .string()
      .trim()
      .min(3, "Fullname must be at least 3 characters long")
      .max(50, "Fullname must be at most 100 characters long")
      .optional(),
    companyName: z
      .string()
      .trim()
      .max(100, "Company name must be at most 100 characters long")
      .nullish(),
  }),
};
