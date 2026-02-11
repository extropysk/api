export interface Config {
  port: number;
  mongodbUri: string;
  betterAuthSecret: string;
  betterAuthUrl: string;
  jwtSecret: string;
}

export default (): Config => {
  return {
    port: parseInt(process.env.PORT || '3000', 10),
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/extropy',
    betterAuthSecret: process.env.BETTER_AUTH_SECRET || '',
    betterAuthUrl: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
    jwtSecret: process.env.JWT_SECRET || '',
  };
};
