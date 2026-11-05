import { prisma, type TransactionClient } from "@payvo/database/client";
import type {
  UserAddress,
  UserAddressType,
  UserAddressUncheckedCreateInput,
  UserAddressUpdateInput,
} from "@payvo/database/types";
import { injectable } from "inversify";

@injectable()
export default class UserAddressRepository {
  private readonly db = prisma;

  findAllByUserId(userId: string): Promise<UserAddress[]> {
    return this.db.userAddress.findMany({
      where: { userId },
      orderBy: [
        { addressType: "asc" },
        { isDefault: "desc" },
        { createdAt: "asc" },
      ],
    });
  }

  findByUserIdAndId(
    tx: TransactionClient,
    userId: string,
    addressId: string,
  ): Promise<UserAddress | null> {
    return tx.userAddress.findFirst({ where: { id: addressId, userId } });
  }

  create(
    tx: TransactionClient,
    data: UserAddressUncheckedCreateInput,
  ): Promise<UserAddress> {
    return tx.userAddress.create({ data });
  }

  async clearDefaultForUserAndType(
    tx: TransactionClient,
    userId: string,
    addressType: UserAddressType,
    excludingAddressId?: string,
  ): Promise<void> {
    await tx.userAddress.updateMany({
      where: {
        userId,
        addressType,
        isDefault: true,
        ...(excludingAddressId ? { id: { not: excludingAddressId } } : {}),
      },
      data: { isDefault: false },
    });
  }

  update(
    tx: TransactionClient,
    addressId: string,
    data: UserAddressUpdateInput,
  ): Promise<UserAddress> {
    return tx.userAddress.update({ where: { id: addressId }, data });
  }

  delete(tx: TransactionClient, addressId: string): Promise<UserAddress> {
    return tx.userAddress.delete({ where: { id: addressId } });
  }

  findFirstOtherByUserIdAndType(
    tx: TransactionClient,
    userId: string,
    addressType: UserAddressType,
    excludingAddressId: string,
  ): Promise<UserAddress | null> {
    return tx.userAddress.findFirst({
      where: {
        userId,
        addressType,
        id: { not: excludingAddressId },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  setDefault(tx: TransactionClient, addressId: string): Promise<UserAddress> {
    return tx.userAddress.update({
      where: { id: addressId },
      data: { isDefault: true },
    });
  }
}
