import z from "zod";
import { LoginSchema } from "../schema/LoginSchema";
import { ClientInfoType } from "@/core/utils/client.util";

export type LoginDto = z.infer<typeof LoginSchema.body> & {
  client: ClientInfoType;
};
