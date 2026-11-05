import { prisma } from "@payvo/database/client";
import {
  UserAddressType,
  type UserAddress,
  type UserAddressUncheckedCreateInput,
} from "@payvo/database/types";

export default abstract class UserAddressFactory {
  static async create(
    userId: string,
    data: Partial<Omit<UserAddressUncheckedCreateInput, "userId">> = {},
  ): Promise<UserAddress> {
    return prisma.userAddress.create({
      data: {
        userId,
        addressType: UserAddressType.CONTACT,
        street1: "123 Main Street",
        countryCode: "US",
        isDefault: false,
        ...data,
      },
    });
  }

  static async find(addressId: string): Promise<UserAddress | null> {
    return prisma.userAddress.findUnique({ where: { id: addressId } });
  }

  static async findByUserId(userId: string): Promise<UserAddress[]> {
    return prisma.userAddress.findMany({
      where: { userId },
      orderBy: [{ addressType: "asc" }, { isDefault: "desc" }],
    });
  }
}
