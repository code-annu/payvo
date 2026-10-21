import type { UserAddress } from "@payvo/database/types";
import { injectable } from "inversify";
import type { UserAddressResponse } from "@payvo/shared/schema/responses";

@injectable()
export default class UserAddressMapper {
  mapToUserAddressResponse(address: UserAddress): UserAddressResponse {
    return {
      id: address.id,
      userId: address.userId,
      addressType: address.addressType,
      label: address.label,
      recipientName: address.recipientName,
      street1: address.street1,
      street2: address.street2,
      city: address.city,
      stateOrProvince: address.stateOrProvince,
      postalCode: address.postalCode,
      countryCode: address.countryCode,
      isDefault: address.isDefault,
    };
  }

  mapToUserAddressesResponse(addresses: UserAddress[]): UserAddressResponse[] {
    return addresses.map(this.mapToUserAddressResponse);
  }
}
