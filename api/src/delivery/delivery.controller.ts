import {
  BadGatewayException,
  BadRequestException,
  Body,
  Controller,
  Post,
} from "@nestjs/common";

import { DeliveryService } from "./delivery.service";
import { SendDailyInputSchema, type SendDailyResult } from "./domain/types";

/**
 * Dev/test surface for the delivery flow, shaped like GenerationController.
 * POST a SendDailyInput, get back a SendDailyResult. NOT a product endpoint —
 * no auth, no persistence; the scheduler phase will call DeliveryService
 * directly rather than going through HTTP.
 */
@Controller("delivery")
export class DeliveryController {
  constructor(private readonly delivery: DeliveryService) {}

  @Post("send")
  async send(@Body() body: unknown): Promise<SendDailyResult> {
    const parsed = SendDailyInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(
        parsed.error.issues.map(
          (i) => `${i.path.join(".") || "(root)"}: ${i.message}`,
        ),
      );
    }
    try {
      return await this.delivery.sendDaily(parsed.data);
    } catch (err) {
      // Surface provider failures (e.g. Resend's sandbox 403 "only your own
      // address") readably instead of a generic 500 — this is a debug surface.
      throw new BadGatewayException(
        err instanceof Error ? err.message : String(err),
      );
    }
  }
}
