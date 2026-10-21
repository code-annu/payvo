import { z } from "zod";
import {
  AddUserAddressSchema,
  UpdateUserAddressSchema,
} from "@payvo/shared/schema/requests";

export type AddUserAddressInput = z.infer<typeof AddUserAddressSchema.body> & {
  userId: string;
};

export type UpdateUserAddressInput = z.infer<
  typeof UpdateUserAddressSchema.body
> & { userId: string; addressId: string };
