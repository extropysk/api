import { betterAuth } from 'better-auth';
import { createAuthMiddleware } from 'better-auth/api';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { MongoClient } from 'mongodb';
import { BetterAuthConfig, JwtConfig } from 'src/config';
import { Payload, sign } from '@extropysk/nest-core';

const AUTH_PATHS_WITH_JWT = [
  '/sign-in/email',
  '/sign-up/email',
  '/get-session',
];

export function createAuth(config: {
  mongodbUri: string;
  betterAuth: BetterAuthConfig;
  jwt: JwtConfig;
}) {
  const client = new MongoClient(config.mongodbUri);
  const db = client.db();

  return betterAuth({
    database: mongodbAdapter(db, { client, transaction: false }),
    basePath: '/auth',
    secret: config.betterAuth.secret,
    baseURL: config.betterAuth.url,
    emailAndPassword: {
      enabled: true,
    },
    trustedOrigins: ['*'],
    advanced: {
      disableCSRFCheck: true,
    },
    hooks: {
      after: createAuthMiddleware(async (ctx) => {
        if (!AUTH_PATHS_WITH_JWT.includes(ctx.path ?? '')) return;

        const returned = ctx.context.returned as
          | { user: Record<string, any> }
          | undefined;
        if (!returned?.user) return;

        const user = returned.user;

        const payload: Payload = {
          id: user.id,
          email: user.email,
          roles: [],
        };

        const token = sign(payload, config.jwt.secret, config.jwt.expiresIn);
        ctx.context.returned = { ...returned, jwt: token };
      }),
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
