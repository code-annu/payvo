import { genSalt, hash, compare } from "bcrypt";

export class PasswordHashService {
  async hashPassword(
    password: string,
    saltRounds: number = 10,
  ): Promise<string> {
    const salt = await genSalt(saltRounds);
    return hash(password, salt);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return compare(password, hash);
  }
}
