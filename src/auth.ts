/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { bearer } from 'better-auth/plugins';
import { MongoClient } from 'mongodb';

const client = new MongoClient(
  process.env.MONGODB_URI || 'mongodb://localhost:27017/extropy',
);
const db = client.db();

export const auth = betterAuth({
  database: mongodbAdapter(db, { client, transaction: false }),
  basePath: '/api/auth',
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    disableCSRFCheck: true,
  },
  plugins: [bearer()],
});

export type Auth = typeof auth;
