import MerchantRepository from "@/modules/merchant/repository/merchant.repository.js";
import {
  MerchantInactiveError,
  MerchantNotFoundError,
} from "@/modules/merchant/error/merchant.errors.js";

export async function findActiveMerchantOrThrow(
  merchantRepository: MerchantRepository,
  data: { merchantId: string; userId: string },
) {
  const merchant = await merchantRepository.findOwnedByUser(data);
  if (!merchant) {
    throw new MerchantNotFoundError();
  }
  if (!merchant.isActive) {
    throw new MerchantInactiveError(
      "Inactive merchant cannot perform webhook operations",
    );
  }
  return merchant;
}
