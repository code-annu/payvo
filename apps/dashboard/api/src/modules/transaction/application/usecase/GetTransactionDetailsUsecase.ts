import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import TransactionRepository from "../../repository/transaction.repository.js";
import type {
  GetTransactionDetailsInputDto,
  GetTransactionDetailsOutputDto,
} from "../dto/GetTransactionDetailsDto.js";
import { TransactionNotFoundError } from "../../error/transaction.errors.js";
import MerchantAuthorizationService from "@/modules/merchant/application/merchant-authorization.service.js";

@injectable()
export default class GetTransactionDetailsUsecase {
  constructor(
    @inject(TYPES.TransactionRepository)
    private readonly transactionRepository: TransactionRepository,
    @inject(TYPES.MerchantAuthorizationService)
    private readonly merchantAuthorizationService: MerchantAuthorizationService,
  ) {}

  async execute(
    input: GetTransactionDetailsInputDto,
  ): Promise<GetTransactionDetailsOutputDto> {
    await this.merchantAuthorizationService.requireOwnedActiveMerchant(
      input.merchantId,
      input.userId,
    );

    const transaction = await this.transactionRepository.findDetails({
      id: input.transactionId,
      merchantId: input.merchantId,
    });

    if (!transaction) {
      throw new TransactionNotFoundError();
    }

    return transaction;
  }
}

export { GetTransactionDetailsUsecase as GetTransactionDetails };
