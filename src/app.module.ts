import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import config, { Config } from 'src/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { createAuth } from 'src/auth';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [config] }),
    AuthModule.forRootAsync({
      disableGlobalAuthGuard: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Config, true>) => ({
        auth: createAuth({
          mongodbUri: configService.get('mongodbUri'),
          betterAuthSecret: configService.get('betterAuthSecret'),
          betterAuthUrl: configService.get('betterAuthUrl'),
          jwtSecret: configService.get('jwtSecret'),
        }),
      }),
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
  ],
})
export class AppModule {}
