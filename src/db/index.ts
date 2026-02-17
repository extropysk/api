import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './auth-schema';

export function createDrizzleDb(connectionString: string) {
  const client = postgres(connectionString);
  return drizzle(client, { schema });
}
