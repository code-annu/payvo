import crypto from "node:crypto";

export function generateSignature(input: {
  secret: string;
  payload: string;
}): string {
  const { secret, payload } = input;
  const hash = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return `sha256=${hash}`;
}
