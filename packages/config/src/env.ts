import "dotenv/config";
import z, { type ZodType } from "zod";

export function validateEnv<T extends ZodType>(
  schema: T,
  moduleName?: string,
): z.infer<T> {
  const result = schema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues ?? [];
    const formattedErrors = issues
      .map(
        (issue) => `  - [${issue.path.join(".") || "root"}]: ${issue.message}`,
      )
      .join("\n");

    const header = moduleName
      ? `❌ [${moduleName} Config] Invalid environment configuration:`
      : `❌ Invalid environment configuration:`;

    console.error(`\n${header}\n${formattedErrors}\n`);
    throw new Error(`${header}\n${formattedErrors}`);
  }

  return result.data;
}
