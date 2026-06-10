import { BadRequestException, Body, Controller, Post } from "@nestjs/common";

import { GenerationService } from "./generation.service";
import { GenerationInputSchema, type GenerationResult } from "./domain/types";

/**
 * Dev/test surface for the generation engine. POST a GenerationInput, get back a
 * GenerationResult. This is NOT a product endpoint — no auth, no persistence.
 */
@Controller("generate")
export class GenerationController {
  constructor(private readonly generation: GenerationService) {}

  @Post("preview")
  async preview(@Body() body: unknown): Promise<GenerationResult> {
    const parsed = GenerationInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(
        parsed.error.issues.map(
          (i) => `${i.path.join(".") || "(root)"}: ${i.message}`,
        ),
      );
    }
    return this.generation.generate(parsed.data);
  }
}
