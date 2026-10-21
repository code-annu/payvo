import { ClientInfoType } from "@payvo/http/client";
import { LoginSchema, SignupSchema } from "@payvo/shared/schema/requests";
import z from "zod";

export type AuthOutput = {
  accessToken: { token: string; expiresAt: Date };
  refreshToken: string;
};

export type SignupInput = z.infer<typeof SignupSchema.body> & {
  client: ClientInfoType;
};
export type LoginInput = z.infer<typeof LoginSchema.body> & {
  client: ClientInfoType;
};
