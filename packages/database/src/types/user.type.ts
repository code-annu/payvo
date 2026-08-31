import { db } from "../prisma/db.js";

export type User = Awaited<ReturnType<typeof db.orm.public.User.create>>;

export type UserCreateInput = Pick<
  User,
  "email" | "passwordHash" | "companyName" | "fullname"
>;

export type UserUpdateInput = Partial<
  Pick<UserCreateInput, "fullname" | "companyName">
>;



