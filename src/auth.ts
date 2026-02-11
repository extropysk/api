/* eslint-disable @typescript-eslint/no-unsafe-call */

import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { bearer } from 'better-auth/plugins';
import { MongoClient } from 'mongodb';

export function createAuth(config: {
  mongodbUri: string;
  betterAuthSecret: string;
  betterAuthUrl: string;
}) {
  const client = new MongoClient(config.mongodbUri);
  const db = client.db();

  return betterAuth({
    database: mongodbAdapter(db, { client, transaction: false }),
    basePath: '/auth',
    secret: config.betterAuthSecret,
    baseURL: config.betterAuthUrl,
    emailAndPassword: {
      enabled: true,
    },
    advanced: {
      disableCSRFCheck: true,
    },
    plugins: [bearer()],
  });
}

export type Auth = ReturnType<typeof createAuth>;
