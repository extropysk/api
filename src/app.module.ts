import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import config, { BetterAuthConfig, Config, JwtConfig } from 'src/config';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { createAuth } from 'src/auth';
import { CoreModule } from '@extropysk/nest-core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [config] }),
    AuthModule.forRootAsync({
      disableGlobalAuthGuard: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Config, true>) => ({
        auth: createAuth({
          mongodbUri: configService.get('mongodbUri'),
          betterAuth: configService.get<BetterAuthConfig>('betterAuth'),
          jwt: configService.get<JwtConfig>('jwt'),
        }),
      }),
    }),
    CoreModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwt = configService.get<JwtConfig>('jwt') as JwtConfig;
        return { jwt };
      },
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
  ],
})
export class AppModule {}
