export interface BetterAuthConfig {
  secret: string;
  url: string;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export interface Config {
  port: number;
  mongodbUri: string;
  betterAuth: BetterAuthConfig;
  jwt: JwtConfig;
}

export default (): Config => {
  return {
    port: parseInt(process.env.PORT || '3000', 10),
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/extropy',
    betterAuth: {
      secret: process.env.BETTER_AUTH_SECRET || '',
      url: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
    },
    jwt: {
      secret: process.env.JWT_SECRET || '',
      expiresIn: process.env.JWT_EXPIRATION || '1h',
    },
  };
};
