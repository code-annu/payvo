import { Request } from "express";
import { UAParser } from "ua-parser-js";

export type ClientInfoType = {
  ipAddress: string | null;
  userAgent: string | null;
};

export function getClientInfo(req: Request): ClientInfoType {
  const userAgent = req.headers["user-agent"];
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  return {
    ipAddress: req.ip ?? null,
    userAgent: result.ua ?? null,
  };
}
