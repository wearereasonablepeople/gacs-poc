import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

/* eslint-disable @typescript-eslint/no-var-requires */
const session = require('express-session');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const pgSession = require('connect-pg-simple')(session);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          'img-src': ["'self'", 'data:', 'blob:', '*'],
        },
      },
    }),
  );

  // CORS – allow all three frontends + extra origins (e.g. ngrok tunnels)
  const allowAllOrigins = process.env.CORS_ALLOW_ALL === 'true';

  const corsOrigins: (string | RegExp)[] = [
    process.env.UI_URL || 'http://localhost:3000',
    process.env.REPORTING_URL || 'http://localhost:3001',
    process.env.MONITORING_URL || 'http://localhost:3002',
  ];
  if (process.env.EXTRA_CORS_ORIGINS) {
    corsOrigins.push(...process.env.EXTRA_CORS_ORIGINS.split(',').map((o) => o.trim()));
  }
  if (process.env.ALLOW_NGROK === 'true') {
    corsOrigins.push(/\.ngrok(-free)?\.app$/);
  }

app.enableCors(
  allowAllOrigins
    ? { origin: true, credentials: true }
    : {
        origin: corsOrigins,
        credentials: true,
      },
);

  app.use(cookieParser());

  // Session store backed by PostgreSQL
  app.use(
    session({
      store: new pgSession({
        conString: process.env.DATABASE_URL,
        tableName: 'session',
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  const port = process.env.API_PORT || 4000;
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}`);
}

bootstrap();
