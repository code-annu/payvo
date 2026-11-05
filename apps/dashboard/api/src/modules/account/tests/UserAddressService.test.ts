import { beforeEach, describe, expect, it, vi } from "vitest";
import { dbTransaction, type TransactionClient } from "@payvo/database/client";
import { UserAddressType, type UserAddress } from "@payvo/database/types";
import UserAddressService from "../application/service/user-address.service.js";
import * as addressErrors from "../error/address.errors.js";
import UserAddressMapper from "../mapper/user-address.mapper.js";
import UserAddressRepository from "../repository/user-address.repository.js";

vi.mock("@payvo/database/client", () => ({
  dbTransaction: vi.fn(),
  prisma: {},
}));

const userId = "02b6e011-cb0f-4472-8d85-9b6332028a30";
const addressId = "13d84e90-646d-42b8-8ba2-441338db58f6";
const transactionClient = {} as TransactionClient;
const address: UserAddress = {
  id: addressId,
  userId,
  addressType: UserAddressType.SHIPPING,
  label: null,
  recipientName: null,
  street1: "1 Main Street",
  street2: null,
  city: null,
  stateOrProvince: null,
  postalCode: null,
  countryCode: "US",
  isDefault: true,
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
  updatedAt: new Date("2025-01-01T00:00:00.000Z"),
};

function createServiceTestContext() {
  const repository = new UserAddressRepository();
  const clearDefault = vi
    .spyOn(repository, "clearDefaultForUserAndType")
    .mockResolvedValue();
  const create = vi.spyOn(repository, "create").mockResolvedValue(address);
  const findAll = vi.spyOn(repository, "findAllByUserId").mockResolvedValue([]);
  const findByUserIdAndId = vi
    .spyOn(repository, "findByUserIdAndId")
    .mockResolvedValue(address);
  const update = vi.spyOn(repository, "update").mockResolvedValue(address);
  const deleteAddress = vi
    .spyOn(repository, "delete")
    .mockResolvedValue(address);
  const findReplacement = vi
    .spyOn(repository, "findFirstOtherByUserIdAndType")
    .mockResolvedValue(null);
  const setDefault = vi
    .spyOn(repository, "setDefault")
    .mockResolvedValue(address);

  return {
    service: new UserAddressService(repository, new UserAddressMapper()),
    clearDefault,
    create,
    findAll,
    findByUserIdAndId,
    update,
    deleteAddress,
    findReplacement,
    setDefault,
  };
}

describe("UserAddressService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dbTransaction).mockImplementation((callback) =>
      callback(transactionClient),
    );
  });

  it("clears the current default before adding a new default address", async () => {
    const context = createServiceTestContext();

    await context.service.addAddress({
      userId,
      addressType: UserAddressType.SHIPPING,
      label: null,
      recipientName: null,
      street1: "1 Main Street",
      street2: null,
      city: null,
      stateOrProvince: null,
      postalCode: null,
      countryCode: "US",
      isDefault: true,
    });

    expect(context.clearDefault).toHaveBeenCalledWith(
      transactionClient,
      userId,
      UserAddressType.SHIPPING,
    );
    expect(context.create).toHaveBeenCalledWith(
      transactionClient,
      expect.objectContaining({ userId, isDefault: true }),
    );
  });

  it("returns all addresses through the mapper", async () => {
    const context = createServiceTestContext();
    context.findAll.mockResolvedValue([address]);

    await expect(context.service.getAllAddresses(userId)).resolves.toEqual({
      userId,
      addresses: [
        {
          id: address.id,
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
        },
      ],
    });
  });

  it("checks ownership and clears the target type before setting a default", async () => {
    const context = createServiceTestContext();

    await context.service.updateAddress({
      userId,
      addressId,
      isDefault: true,
    });

    expect(context.findByUserIdAndId).toHaveBeenCalledWith(
      transactionClient,
      userId,
      addressId,
    );
    expect(context.clearDefault).toHaveBeenCalledWith(
      transactionClient,
      userId,
      address.addressType,
      addressId,
    );
    expect(context.update).toHaveBeenCalledWith(transactionClient, addressId, {
      isDefault: true,
    });
  });

  it("returns not found when updating an address owned by another user", async () => {
    const context = createServiceTestContext();
    context.findByUserIdAndId.mockResolvedValue(null);

    await expect(
      context.service.updateAddress({
        userId,
        addressId,
        street1: "New street",
      }),
    ).rejects.toBeInstanceOf(addressErrors.AddressNotFoundError);
    expect(context.update).not.toHaveBeenCalled();
  });

  it("promotes a same-type replacement after deleting the default", async () => {
    const context = createServiceTestContext();
    const replacement = {
      ...address,
      id: "another-address-id",
      isDefault: false,
    };
    context.findReplacement.mockResolvedValue(replacement);
    context.setDefault.mockResolvedValue({
      ...replacement,
      isDefault: true,
    });

    await context.service.deleteAddress(userId, addressId);

    expect(context.deleteAddress).toHaveBeenCalledWith(
      transactionClient,
      addressId,
    );
    expect(context.findReplacement).toHaveBeenCalledWith(
      transactionClient,
      userId,
      address.addressType,
      addressId,
    );
    expect(context.setDefault).toHaveBeenCalledWith(
      transactionClient,
      replacement.id,
    );
    expect(context.deleteAddress.mock.invocationCallOrder[0]!).toBeLessThan(
      context.setDefault.mock.invocationCallOrder[0]!,
    );
  });
});
