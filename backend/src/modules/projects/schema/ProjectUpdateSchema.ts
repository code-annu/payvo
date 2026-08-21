import z from "zod";

const ProjectUpdateBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .nonempty("Project name cannot be empty")
      .min(2, "Project name must be at least 2 characters long")
      .max(100, "Project name must be at most 100 characters")
      .optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => data.name !== undefined || data.isActive !== undefined,
    {
      message: "At least one field (name or isActive) must be provided for update",
    },
  );

export const ProjectUpdateSchema = {
  body: ProjectUpdateBodySchema,
};
