import { betterAuth } from 'better-auth';
import { createAuthMiddleware } from 'better-auth/api';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createDrizzleDb } from 'src/db';
import * as schema from 'src/db/auth-schema';
import { BetterAuthConfig, JwtConfig } from 'src/config';
import { Payload, sign } from '@extropysk/nest-core';

const AUTH_PATHS_WITH_JWT = [
  '/sign-in/email',
  '/sign-up/email',
  '/get-session',
];

export function createAuth(config: {
  databaseUrl: string;
  betterAuth: BetterAuthConfig;
  jwt: JwtConfig;
}) {
  const db = createDrizzleDb(config.databaseUrl);

  return betterAuth({
    database: drizzleAdapter(db, { provider: 'pg', schema }),
    basePath: '/auth',
    secret: config.betterAuth.secret,
    baseURL: config.betterAuth.url,
    emailAndPassword: {
      enabled: true,
    },
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
