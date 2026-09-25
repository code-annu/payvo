import { ClientInfoType } from "@/core/util/client.util.js";
import z from "zod";
import { LoginSchema } from "../../schema/LoginSchema.js";

export type LoginDto = z.infer<typeof LoginSchema.body> & {
  client: ClientInfoType;
};
