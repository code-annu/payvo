import {
  ApiKeyEnvironment,
  ApiKeyType,
} from "@/modules/api-keys/entity/api-key.entity";
import crypto from "crypto";
import { injectable } from "inversify";

@injectable()
export default class ApiKeyUtil {
  generateApiKey(type: ApiKeyType, environment: ApiKeyEnvironment) {
    const random = crypto.randomBytes(32).toString("base64url");

    return `${type}_${environment}_${random}`;
  }
  hashApiKey(key: string): string {
    return crypto.createHash("sha256").update(key).digest("hex");
  }
}
