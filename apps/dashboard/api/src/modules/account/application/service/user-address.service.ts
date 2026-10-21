import { dbTransaction, TransactionClient } from "@payvo/database/client";
import { removeUndefined } from "@payvo/shared/util";
import { inject, injectable } from "inversify";
import { AccountTypes } from "../../account.types.js";
import * as addressErrors from "../../error/address.errors.js";
import UserAddressRepository from "../../repository/user-address.repository.js";
import type {
  AddUserAddressInput,
  UpdateUserAddressInput,
} from "../dto/address.dto.js";
import { UserAddressContract } from "../../contract/user-address.contract.js";

@injectable()
export default class UserAddressService implements UserAddressContract {
  constructor(
    @inject(AccountTypes.UserAddressRepository)
    private readonly userAddressRepo: UserAddressRepository,
  ) {}

  async addAddress(input: AddUserAddressInput) {
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

      return address;
    });
  }

  async getAllAddresses(userId: string) {
    const addresses = await this.userAddressRepo.findAllByUserId(userId);
    return addresses;
  }

  async updateAddress(input: UpdateUserAddressInput) {
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
      return address;
    });
  }

  async deleteAddress(userId: string, addressId: string) {
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

  async deleteUserAddresses(
    tx: TransactionClient,
    userId: string,
  ): Promise<void> {
    await this.userAddressRepo.deleteByUserId(tx, userId);
  }
}
