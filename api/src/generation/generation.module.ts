import { Module } from "@nestjs/common";

import { AppConfigService } from "../config/app-config.service";
import { GenerationController } from "./generation.controller";
import { GenerationService } from "./generation.service";
import { GeminiClient } from "./llm/gemini.client";
import { AnthropicClient } from "./llm/anthropic.client";
import { FallbackLlmClient } from "./llm/fallback-llm-client";
import { LLM_CLIENT, type LlmClient } from "./llm/llm-client";

@Module({
  controllers: [GenerationController],
  providers: [
    GenerationService,
    {
      // The engine depends on the LlmClient interface. In production it's an
      // ordered provider chain: Gemini primary, Anthropic Haiku fallback when its
      // key is configured. Add more providers by pushing onto the list — the
      // GenerationService is unaffected.
      provide: LLM_CLIENT,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService): LlmClient => {
        // One Gemini client per configured key, in priority order — the engine
        // fails over from one to the next when a key errors / runs out of quota.
        const providers: LlmClient[] = config.geminiApiKeys.map(
          (apiKey, i) =>
            new GeminiClient({
              apiKey,
              model: config.geminiModel,
              name: `gemini-${i + 1}`,
            }),
        );
        // Anthropic Haiku as a final fallback when its key is configured.
        if (config.anthropicApiKey) {
          providers.push(new AnthropicClient(config));
        }
        return providers.length === 1
          ? providers[0]
          : new FallbackLlmClient(providers);
      },
    },
  ],
  // DeliveryModule composes generation into the send flow.
  exports: [GenerationService],
})
export class GenerationModule {}
