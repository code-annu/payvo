import type { UserAddress } from "@payvo/database/types";
import { injectable } from "inversify";
import type {
  UserAddressOutputDto,
  UserAddressesOutputDto,
} from "../application/dto/address.dto.js";

@injectable()
export default class UserAddressMapper {
  mapToUserAddressOutput(address: UserAddress): UserAddressOutputDto {
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

  mapToUserAddressesOutput(
    userId: string,
    addresses: UserAddress[],
  ): UserAddressesOutputDto {
    return {
      userId,
      addresses: addresses.map((address) => {
        const { userId: _addressUserId, ...output } =
          this.mapToUserAddressOutput(address);
        return output;
      }),
    };
  }
}
