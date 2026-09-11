import { z } from "zod";
import { SignupSchema } from "../schema/SignupSchema.js";
import { ClientInfoType } from "@/core/utils/client.util.js";

export type SignupDto = z.infer<typeof SignupSchema.body> & {
  client: ClientInfoType;
};
