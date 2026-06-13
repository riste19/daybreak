import { Module } from "@nestjs/common";

import { AppConfigService } from "../config/app-config.service";
import { GenerationModule } from "../generation/generation.module";
import { DeliveryController } from "./delivery.controller";
import { DeliveryService } from "./delivery.service";
import { EMAIL_CLIENT } from "./email/email-client";
import { ResendClient } from "./email/resend.client";
import { ConsoleEmailClient } from "./email/console.client";

@Module({
  imports: [GenerationModule],
  controllers: [DeliveryController],
  providers: [
    DeliveryService,
    {
      // Resend when a key is configured; otherwise log-only, so the flow is
      // testable with zero setup (same degrade-gracefully posture as Gemini).
      provide: EMAIL_CLIENT,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) =>
        config.resendApiKey ? new ResendClient(config) : new ConsoleEmailClient(),
    },
  ],
})
export class DeliveryModule {}
