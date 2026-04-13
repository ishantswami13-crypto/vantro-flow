import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type DbInstance = ReturnType<typeof drizzle<typeof schema>>;

let _db: DbInstance | undefined;

function getInstance(): DbInstance {
  if (!_db) {
    _db = drizzle(neon(process.env.DATABASE_URL!), { schema });
  }
  return _db;
}

// Lazy proxy: neon() is never called at module load time, only on first query
export const db = new Proxy({} as DbInstance, {
  get(_target, prop: string | symbol) {
    return getInstance()[prop as keyof DbInstance];
  },
});
