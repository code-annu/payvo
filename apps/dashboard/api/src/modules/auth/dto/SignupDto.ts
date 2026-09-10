import { z } from "zod";
import { SignupSchema } from "../schema/SignupSchema";
import { ClientInfoType } from "@/core/utils/client.util";

export type SignupDto = z.infer<typeof SignupSchema.body> & {
  client: ClientInfoType;
};
