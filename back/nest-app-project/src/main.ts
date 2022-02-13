import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';
import { Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

const port = process.env.NEST_PORT || 4000;

const httpsOptions = {
  key: fs.readFileSync('/ssl/privkey.pem'),
  cert: fs.readFileSync('/ssl/fullchain.pem'),
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { httpsOptions, cors: true });
  app.enableCors();
  await app.listen(port);
  Logger.log(`Starting nestjs on ${process.env.URL}:${port}`, "Bootstrap");
}
bootstrap();
