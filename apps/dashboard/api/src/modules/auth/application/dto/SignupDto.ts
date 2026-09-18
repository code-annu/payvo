import { ClientInfoType } from "@/core/util/client.util.js";
import { z } from "zod";
import { SignupSchema } from "../../schema/SignupSchema.js";

export type SignupDto = z.infer<typeof SignupSchema.body> & {
  client: ClientInfoType;
};
