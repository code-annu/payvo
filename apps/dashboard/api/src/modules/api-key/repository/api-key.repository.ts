import { prisma } from "@payvo/database/client";
import type {
  ApiKey,
  ApiKeyEnvironment,
  ApiKeyUncheckedCreateInput,
} from "@payvo/database/types";
import { injectable } from "inversify";

@injectable()
export default class ApiKeyRepository {
  private readonly db = prisma;

  findActiveKey(input: {
    merchantId: string;
    environment: ApiKeyEnvironment;
  }): Promise<ApiKey | null> {
    return this.db.apiKey.findFirst({
      where: {
        merchantId: input.merchantId,
        environment: input.environment,
        status: "ACTIVE",
      },
    });
  }

  create(data: ApiKeyUncheckedCreateInput): Promise<ApiKey> {
    return this.db.apiKey.create({ data });
  }
}
