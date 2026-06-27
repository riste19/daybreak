/**
 * Server-only Paddle SDK client. Holds the secret API key and the webhook
 * secret — never import this from a Client Component (the `server-only` guard
 * turns that into a build error).
 *
 * Used by the webhook route (app/api/webhooks/paddle/route.ts) to verify
 * signatures and, when needed, resolve a customer's email.
 */

import "server-only";

import { Environment, Paddle } from "@paddle/paddle-node-sdk";

let client: Paddle | null = null;

/** Lazily build (and cache) the Paddle client. Throws if the API key is unset. */
export function getPaddle(): Paddle {
  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) throw new Error("PADDLE_API_KEY is not set");
  if (!client) {
    client = new Paddle(apiKey, {
      environment:
        process.env.NEXT_PUBLIC_PADDLE_ENV === "production"
          ? Environment.production
          : Environment.sandbox,
    });
  }
  return client;
}

/** The Notifications webhook signing secret (`pdl_ntfset_…` settings page). */
export function paddleWebhookSecret(): string {
  return process.env.PADDLE_WEBHOOK_SECRET ?? "";
}
