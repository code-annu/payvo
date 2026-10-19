import z from "zod";

export const UserAddressTypeSchema = z.enum(
  ["CONTACT", "BILLING", "SHIPPING", "OTHER"],
  "Address type must be one of them ['CONTACT', 'BILLING', 'SHIPPING', 'OTHER']",
);

export const AddressLabelSchema = z
  .string("Address label must be a valid string")
  .trim()
  .max(100, "Address label must not exceed 100 characters")
  .nullish();

export const RecipientNameSchema = z
  .string("Recipient name must be a valid string")
  .trim()
  .max(120, "Recipient name must not exceed 120 characters")
  .nullish();

export const StreetAddressSchema = z
  .string("Street address must be a valid string")
  .trim()
  .nonempty("Street address cannot be empty")
  .min(1)
  .max(255, "Street address must not exceed 255 characters");

export const StreetAddressLine2Schema = z
  .string("Street address must be a valid string")
  .trim()
  .max(255, "Street address must not exceed 255 characters")
  .nullish();

export const CitySchema = z
  .string("City must be a valid string")
  .trim()
  .max(120, "City must not exceed 120 characters")
  .nullish();

export const StateOrProvinceSchema = z
  .string("State or province must be a valid string")
  .trim()
  .max(120, "State or province must not exceed 120 characters")
  .nullish();

export const PostalCodeSchema = z
  .string("Postal code must be a valid string")
  .trim()
  .max(32, "Postal code must not exceed 32 characters")
  .nullish();

export const CountryCodeSchema = z
  .string("Country code must be a valid string")
  .trim()
  .length(2, "Country code must be exactly 2 characters");

export const IsDefaultAddressSchema = z.boolean(
  "Default address flag must be a boolean",
);

export const AddressIdSchema = z.uuid("Address id must be a valid uuid").trim();

export const UserAddressSchema = z.object({
  addressType: UserAddressTypeSchema,
  label: AddressLabelSchema,
  recipientName: RecipientNameSchema,
  street1: StreetAddressSchema,
  street2: StreetAddressLine2Schema,
  city: CitySchema,
  stateOrProvince: StateOrProvinceSchema,
  postalCode: PostalCodeSchema,
  countryCode: CountryCodeSchema,
  isDefault: IsDefaultAddressSchema,
});
