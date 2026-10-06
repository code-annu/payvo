import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import TransactionRepository from "../../repository/transaction.repository.js";
import type {
  GetMerchantTransactionsInputDto,
  GetMerchantTransactionsOutputDto,
} from "../dto/GetMerchantTransactionsDto.js";
import MerchantAuthorizationService from "@/modules/merchant/application/merchant-authorization.service.js";

@injectable()
export default class GetMerchantTransactionsUsecase {
  constructor(
    @inject(TYPES.TransactionRepository)
    private readonly transactionRepository: TransactionRepository,
    @inject(TYPES.MerchantAuthorizationService)
    private readonly merchantAuthorizationService: MerchantAuthorizationService,
  ) {}

  async execute(
    input: GetMerchantTransactionsInputDto,
  ): Promise<GetMerchantTransactionsOutputDto> {
    await this.merchantAuthorizationService.requireOwnedActiveMerchant(
      input.merchantId,
      input.userId,
    );

    const transactions = await this.transactionRepository.findByMerchantId(
      input.merchantId,
    );

    return {
      merchantId: input.merchantId,
      transactions,
    };
  }
}

export { GetMerchantTransactionsUsecase as GetMerchantTransactions };
