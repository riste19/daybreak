import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";

import { AppConfigModule } from "./config/app-config.module";
import { DeliveryModule } from "./delivery/delivery.module";
import { GenerationModule } from "./generation/generation.module";
import { EngineAuthGuard } from "./common/engine-auth.guard";

@Module({
  imports: [AppConfigModule, GenerationModule, DeliveryModule],
  providers: [{ provide: APP_GUARD, useClass: EngineAuthGuard }],
})
export class AppModule {}
