import {
  CreateUserProfileSchema,
  UpdateUserProfileSchema,
} from "@payvo/shared/schema/requests";
import { StripUndefined } from "@payvo/shared/util";
import z from "zod";

export type CreateUserProfileInput = StripUndefined<
  z.infer<typeof CreateUserProfileSchema.body>
> & { userId: string };

export type UpdateUserProfileInput = z.infer<
  typeof UpdateUserProfileSchema.body
> & { userId: string };
