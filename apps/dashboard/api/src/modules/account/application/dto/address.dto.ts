import { z } from "zod";
import {
  AddUserAddressSchema,
  UpdateUserAddressSchema,
} from "../../schema/address.schema.js";
import { UserAddressType } from "@payvo/database/types";

export type AddUserAddressInput = z.infer<typeof AddUserAddressSchema.body> & {
  userId: string;
};

export type UpdateUserAddressInput = z.infer<
  typeof UpdateUserAddressSchema.body
> & { userId: string; addressId: string };

export interface UserAddressOutputDto {
  id: string;
  userId: string;
  addressType: UserAddressType;
  label: string | null;
  recipientName: string | null;
  street1: string;
  street2: string | null;
  city: string | null;
  stateOrProvince: string | null;
  postalCode: string | null;
  countryCode: string;
  isDefault: boolean;
}

export interface UserAddressesOutputDto {
  userId: string;
  addresses: {
    id: string;
    addressType: UserAddressType;
    label: string | null;
    recipientName: string | null;
    street1: string;
    street2: string | null;
    city: string | null;
    stateOrProvince: string | null;
    postalCode: string | null;
    countryCode: string;
    isDefault: boolean;
  }[];
}
