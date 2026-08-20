import { ClientInfoType } from "@/shared/util/client-info.util"

export interface LoginDto{
    email:string,
    password:string
    client: ClientInfoType
}