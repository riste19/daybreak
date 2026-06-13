import { Module } from "@nestjs/common";

import { AppConfigModule } from "./config/app-config.module";
import { DeliveryModule } from "./delivery/delivery.module";
import { GenerationModule } from "./generation/generation.module";

@Module({
  imports: [AppConfigModule, GenerationModule, DeliveryModule],
})
export class AppModule {}
