import { dbTransaction } from "@payvo/database/client";
import { removeUndefined } from "@payvo/shared/util";
import { inject, injectable } from "inversify";
import { AccountTypes } from "../../account.types.js";
import * as addressErrors from "../../error/address.errors.js";
import UserAddressMapper from "../../mapper/user-address.mapper.js";
import UserAddressRepository from "../../repository/user-address.repository.js";
import type {
  AddUserAddressInput,
  UpdateUserAddressInput,
  UserAddressOutputDto,
  UserAddressesOutputDto,
} from "../dto/address.dto.js";

@injectable()
export default class UserAddressService {
  constructor(
    @inject(AccountTypes.UserAddressRepository)
    private readonly userAddressRepo: UserAddressRepository,
    @inject(AccountTypes.UserAddressMapper)
    private readonly userAddressMapper: UserAddressMapper,
  ) {}

  async addAddress(input: AddUserAddressInput): Promise<UserAddressOutputDto> {
    const { userId, ...addressData } = input;

    return dbTransaction(async (tx) => {
      if (addressData.isDefault) {
        await this.userAddressRepo.clearDefaultForUserAndType(
          tx,
          userId,
          addressData.addressType,
        );
      }

      const address = await this.userAddressRepo.create(tx, {
        ...addressData,
        userId,
      });

      return this.userAddressMapper.mapToUserAddressOutput(address);
    });
  }

  async getAllAddresses(userId: string): Promise<UserAddressesOutputDto> {
    const addresses = await this.userAddressRepo.findAllByUserId(userId);
    return this.userAddressMapper.mapToUserAddressesOutput(userId, addresses);
  }

  async updateAddress(
    input: UpdateUserAddressInput,
  ): Promise<UserAddressOutputDto> {
    const { userId, addressId, ...addressUpdates } = input;

    return dbTransaction(async (tx) => {
      const existingAddress = await this.userAddressRepo.findByUserIdAndId(
        tx,
        userId,
        addressId,
      );
      if (!existingAddress) {
        throw new addressErrors.AddressNotFoundError();
      }

      const updates = removeUndefined(addressUpdates);
      const nextAddressType =
        updates.addressType ?? existingAddress.addressType;
      const willBeDefault = updates.isDefault ?? existingAddress.isDefault;

      if (willBeDefault) {
        await this.userAddressRepo.clearDefaultForUserAndType(
          tx,
          userId,
          nextAddressType,
          addressId,
        );
      }

      const address = await this.userAddressRepo.update(tx, addressId, updates);
      return this.userAddressMapper.mapToUserAddressOutput(address);
    });
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    await dbTransaction(async (tx) => {
      const address = await this.userAddressRepo.findByUserIdAndId(
        tx,
        userId,
        addressId,
      );
      if (!address) {
        throw new addressErrors.AddressNotFoundError();
      }

      await this.userAddressRepo.delete(tx, addressId);

      if (address.isDefault) {
        const replacement =
          await this.userAddressRepo.findFirstOtherByUserIdAndType(
            tx,
            userId,
            address.addressType,
            addressId,
          );
        if (replacement) {
          await this.userAddressRepo.setDefault(tx, replacement.id);
        }
      }
    });
  }
}
