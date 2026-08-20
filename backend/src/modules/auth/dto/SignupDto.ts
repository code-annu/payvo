import { ClientInfoType } from "@/shared/util/client-info.util";

export interface SignupDto {
  fullname: string;
  email: string;
  companyName?: string | null;
  password: string;
  client: ClientInfoType;
}
