import { Container } from "inversify";
import { registerUserModule } from "@/modules/user/user.module.js";
import { registerAuthModule } from "@/modules/auth/auth.module.js";
import { registerAccountModule } from "@/modules/account/account.module.js";

const container = new Container();

registerUserModule(container);
registerAuthModule(container);
registerAccountModule(container);

export default container;
