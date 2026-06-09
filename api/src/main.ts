import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { AppConfigService } from "./config/app-config.service";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config = app.get(AppConfigService);

  await app.listen(config.port);
  Logger.log(
    `daily-email-api (generation engine) listening on http://localhost:${config.port}`,
    "Bootstrap",
  );
}

void bootstrap();
