import { Module } from "@nestjs/common";

import { AppConfigModule } from "./config/app-config.module";
import { GenerationModule } from "./generation/generation.module";

@Module({
  imports: [AppConfigModule, GenerationModule],
})
export class AppModule {}
