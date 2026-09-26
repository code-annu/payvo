import { client } from "@payvo/database/client";
import PaymentMethodFactory from "../factory/payment-method.factory.js";

export default async function setupDb() {
  await resetDb();
  await seedPaymentMethods();
}

async function resetDb() {
  await client.orm.public.User.where({}).deleteAll();
  await client.orm.public.Session.where({}).deleteAll();
  await client.orm.public.RefreshToken.where({}).deleteAll();
  await client.orm.public.Merchant.where({}).deleteAll();
  await client.orm.public.ApiKey.where({}).deleteAll();
  await client.orm.public.PaymentOrder.where({}).deleteAll();
  await client.orm.public.PaymentMethod.where({}).deleteAll();
  await client.orm.public.PaymentAttempt.where({}).deleteAll();
}

async function seedPaymentMethods() {
  await PaymentMethodFactory.createPaymentMethod({
    code: "card",
    name: "Card",
    iconUrl: "https://example.com/card.svg",
  });
  await PaymentMethodFactory.createPaymentMethod({
    code: "bank_transfer",
    name: "Bank transfer",
    iconUrl: "https://example.com/bank-transfer.svg",
  });
}
