import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './auth-schema';
export * from './auth-schema';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export function createDrizzleDb(connectionString: string) {
  const client = postgres(connectionString);
  return drizzle(client, { schema });
}

export type Db = PostgresJsDatabase<typeof schema>;
