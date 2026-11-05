import { UserAddressType } from "@payvo/database/types";

export interface UserAddressRequestBody {
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

export function createAddressRequestBody(
  overrides: Partial<UserAddressRequestBody> = {},
): UserAddressRequestBody {
  return {
    addressType: UserAddressType.SHIPPING,
    label: null,
    recipientName: null,
    street1: "123 Main Street",
    street2: null,
    city: "New York",
    stateOrProvince: "NY",
    postalCode: "10001",
    countryCode: "US",
    isDefault: false,
    ...overrides,
  };
}
