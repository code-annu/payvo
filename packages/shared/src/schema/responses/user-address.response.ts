import { UserAddressTypeSchema } from "../fields/user-address.fields.js";
import z from "zod";

export type UserAddressTypeValue = z.infer<typeof UserAddressTypeSchema>;

export interface UserAddressResponse {
  id: string;
  userId: string;
  addressType: UserAddressTypeValue;
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
