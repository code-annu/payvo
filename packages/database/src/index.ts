export { db } from "./prisma/db.js";
import { db } from "./prisma/db.js";

type User = Awaited<ReturnType<typeof db.orm.public.User.create>>;
type Post = Awaited<ReturnType<typeof db.orm.public.Post.create>>;

export { User, Post };
