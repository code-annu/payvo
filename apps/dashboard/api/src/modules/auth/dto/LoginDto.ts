import z from "zod";
import { LoginSchema } from "../schema/LoginSchema.js";
import { ClientInfoType } from "@/core/utils/client.util.js";

export type LoginDto = z.infer<typeof LoginSchema.body> & {
  client: ClientInfoType;
};
