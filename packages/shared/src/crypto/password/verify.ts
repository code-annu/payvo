import argon2 from "argon2";

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return await argon2.verify(hash, password);
}
