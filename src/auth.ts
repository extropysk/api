import { betterAuth } from 'better-auth';
import { createAuthMiddleware } from 'better-auth/api';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { bearer } from 'better-auth/plugins';
import * as jwt from 'jsonwebtoken';
import { MongoClient } from 'mongodb';
import { BetterAuthConfig, JwtConfig } from 'src/config';

const AUTH_PATHS_WITH_JWT = ['/sign-in/email', '/sign-up/email'];

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
    advanced: {
      disableCSRFCheck: true,
    },
    plugins: [bearer()],
    hooks: {
      after: createAuthMiddleware(async (ctx) => {
        if (!AUTH_PATHS_WITH_JWT.includes(ctx.path ?? '')) return;

        const returned = ctx.context.returned as
          | { user: Record<string, any> }
          | undefined;
        if (!returned?.user) return;

        const user = returned.user;
        const token = jwt.sign(
          { email: user.email, name: user.name, role: user.role },
          'qweqw',
          { subject: user.id, expiresIn: '1h' },
        );

        ctx.context.returned = { ...returned, jwt: token };
      }),
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
