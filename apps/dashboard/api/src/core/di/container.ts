import { Container } from "inversify";
import { registerUserModule } from "@/modules/user/user.module.js";
import { registerAuthModule } from "@/modules/auth/auth.module.js";
import { registerAccountModule } from "@/modules/account/account.module.js";
import { registerMerchantModule } from "@/modules/merchant/merchant.module.js";
import { registerApiKeyModule } from "@/modules/api-key/api-key.module.js";

const container = new Container();

registerUserModule(container);
registerAuthModule(container);
registerAccountModule(container);
registerMerchantModule(container);
registerApiKeyModule(container);

export default container;
