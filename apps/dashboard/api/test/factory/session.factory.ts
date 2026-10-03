import { client } from "@payvo/database/client";
import {
  Session,
  SessionCreateInput,
  SessionUpdateInput,
} from "@payvo/database/types";

export default abstract class SessionFactory {
  static async create(data: SessionCreateInput): Promise<Session> {
    return client.orm.public.Session.create(data);
  }

  static async get(id: string): Promise<Session | null> {
    return client.orm.public.Session.first({ id });
  }

  static async update(
    id: string,
    data: SessionUpdateInput,
  ): Promise<Session | null> {
    return client.orm.public.Session.where({ id }).update(data);
  }

  static async delete(id: string): Promise<void> {
    await client.orm.public.Session.where({ id }).deleteAll();
    return;
  }
}
