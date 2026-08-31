import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Vitest global setup: ensures the .env file from the dashboard API
 * directory is loaded regardless of which directory vitest is invoked from.
 * This runs before any test file is imported.
 *
 * Uses manual parsing instead of dotenv to avoid dependency resolution issues
 * when vitest is invoked from the workspace root.
 */
export function setup() {
  const envPath = resolve(import.meta.dirname, ".env");
  let content: string;
  try {
    content = readFileSync(envPath, "utf-8");
  } catch {
    return; // .env file not found, skip
  }

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    // Strip surrounding quotes and inline comments
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    } else {
      // Remove inline comments for unquoted values
      const commentIndex = value.indexOf(" #");
      if (commentIndex !== -1) {
        value = value.slice(0, commentIndex).trim();
      }
    }

    // Only set if not already defined (don't override existing env vars)
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
