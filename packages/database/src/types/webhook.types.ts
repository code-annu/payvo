import { db } from "../prisma/db.js";

export type Webhook = Awaited<
  ReturnType<typeof db.orm.public.Webhook.create>
>;

export type WebhookCreateInput = Parameters<
  typeof db.orm.public.Webhook.create
>[0];

type WebhookWhereChain = ReturnType<typeof db.orm.public.Webhook.where>;
export type WebhookUpdateInput = Parameters<WebhookWhereChain["update"]>[0];