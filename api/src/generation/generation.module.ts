import { Module } from "@nestjs/common";

import { GenerationController } from "./generation.controller";
import { GenerationService } from "./generation.service";
import { GeminiClient } from "./gemini/gemini.client";
import { LLM_CLIENT } from "./gemini/llm-client";

@Module({
  controllers: [GenerationController],
  providers: [
    GenerationService,
    // The engine depends on the LlmClient interface; Gemini is the implementation.
    { provide: LLM_CLIENT, useClass: GeminiClient },
  ],
})
export class GenerationModule {}
