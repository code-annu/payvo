import z from "zod";

const ProjectCreateBodySchema = z.object({
  name: z
    .string("Project name is required")
    .trim()
    .nonempty("Project name cannot be empty")
    .min(2, "Project name must be at least 2 characters long")
    .max(100, "Project name must be at most 100 characters"),
});

export const ProjectCreateSchema = {
  body: ProjectCreateBodySchema,
};
