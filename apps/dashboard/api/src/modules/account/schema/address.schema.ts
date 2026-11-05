import {
  AddressIdSchema,
  AddressLabelSchema,
  CitySchema,
  CountryCodeSchema,
  IsDefaultAddressSchema,
  PostalCodeSchema,
  RecipientNameSchema,
  StateOrProvinceSchema,
  StreetAddressLine2Schema,
  StreetAddressSchema,
  UserAddressTypeSchema,
} from "@payvo/shared/schema";
import z from "zod";

export const AddUserAddressSchema = {
  body: z.strictObject({
    addressType: UserAddressTypeSchema,
    label: AddressLabelSchema.transform((value) =>
      value === undefined ? null : value,
    ),
    recipientName: RecipientNameSchema.transform((value) =>
      value === undefined ? null : value,
    ),
    street1: StreetAddressSchema,
    street2: StreetAddressLine2Schema.transform((value) =>
      value === undefined ? null : value,
    ),
    city: CitySchema.transform((value) => (value === undefined ? null : value)),
    stateOrProvince: StateOrProvinceSchema.transform((value) =>
      value === undefined ? null : value,
    ),
    postalCode: PostalCodeSchema.transform((value) =>
      value === undefined ? null : value,
    ),
    countryCode: CountryCodeSchema,
    isDefault: IsDefaultAddressSchema,
  }),
};

export const UserAddressParamsSchema = z.strictObject({
  addressId: AddressIdSchema.nonempty("Address id cannot be empty"),
});

export const UpdateUserAddressSchema = {
  params: UserAddressParamsSchema,
  body: AddUserAddressSchema.body
    .partial()
    .refine(
      (data) => Object.keys(data).length > 0,
      "At least one address field must be provided",
    ),
};
