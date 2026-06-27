import { EventName, type SubscriptionNotification } from "@paddle/paddle-node-sdk";

import { getPaddle, paddleWebhookSecret } from "@/lib/billing/paddle.server";
import { mapPaddleStatus, planForPriceId } from "@/lib/billing/config";
import { syncPaddleSubscription } from "@/lib/supabase/storage";

/**
 * Paddle Notifications webhook — the source of truth for billing state.
 *
 * Paddle (our Merchant of Record) owns the card, the trial, the trial→paid
 * auto-charge, and dunning. It tells us what happened here; we mirror the
 * subscription lifecycle into our `subscriptions` row so the daily cron emails
 * the right people. Provisioning a brand-new buyer's account also happens here
 * (via syncPaddleSubscription → provisionSubscriber), so it survives the buyer
 * closing the tab right after paying.
 *
 * Setup: in Paddle → Developer tools → Notifications, point a destination at
 * `${NEXT_PUBLIC_SITE_URL}/api/webhooks/paddle`, subscribe to the
 * `subscription.*` events, and copy its signing secret into PADDLE_WEBHOOK_SECRET.
 *
 * We need the RAW request body to verify the signature — `req.text()` gives us
 * that untouched (App Router never pre-parses), so no body-parser config needed.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const secret = paddleWebhookSecret();
  if (!secret) {
    console.error("[paddle] PADDLE_WEBHOOK_SECRET not set — refusing webhook");
    return new Response("Webhook not configured", { status: 500 });
  }

  const signature = req.headers.get("paddle-signature") ?? "";
  if (!signature) return new Response("Missing signature", { status: 400 });

  const raw = await req.text();

  let event;
  try {
    event = await getPaddle().webhooks.unmarshal(raw, secret, signature);
  } catch (err) {
    console.error("[paddle] signature verification failed", err);
    return new Response("Invalid signature", { status: 400 });
  }
  if (!event) return new Response("OK", { status: 200 });

  try {
    switch (event.eventType) {
      case EventName.SubscriptionCreated:
      case EventName.SubscriptionUpdated:
      case EventName.SubscriptionActivated:
      case EventName.SubscriptionTrialing:
      case EventName.SubscriptionPastDue:
      case EventName.SubscriptionPaused:
      case EventName.SubscriptionResumed:
      case EventName.SubscriptionCanceled:
        await handleSubscription(event.data);
        break;
      default:
        // Transaction.*, customer.*, etc. — not needed for delivery state.
        break;
    }
  } catch (err) {
    // 500 → Paddle retries with backoff, so a transient DB blip self-heals.
    console.error(`[paddle] handler failed for ${event.eventType}`, err);
    return new Response("Handler error", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}

async function handleSubscription(data: SubscriptionNotification): Promise<void> {
  // Which plan? Prefer the price id (authoritative); fall back to the plan we
  // stamped into customData at checkout, then to the only paid plan.
  const priceId = data.items?.[0]?.price?.id ?? null;
  const planId =
    (priceId ? planForPriceId(priceId)?.planId : undefined) ??
    (typeof data.customData?.plan === "string" ? data.customData.plan : undefined) ??
    "daily";

  // Which email? We stamp it into customData at checkout; if absent (e.g. Paddle
  // collected it), resolve it from the customer record.
  let email =
    typeof data.customData?.email === "string" ? data.customData.email : null;
  if (!email && data.customerId) {
    try {
      const customer = await getPaddle().customers.get(data.customerId);
      email = customer.email ?? null;
    } catch (err) {
      console.error("[paddle] could not resolve customer email", err);
    }
  }
  if (!email) {
    console.error("[paddle] no email for subscription", data.id, "— skipping");
    return;
  }

  const periodEnd = data.currentBillingPeriod?.endsAt ?? data.nextBilledAt ?? null;
  const status = mapPaddleStatus(data.status);

  await syncPaddleSubscription({
    email,
    plan: planId,
    status,
    paddleSubscriptionId: data.id,
    paddleCustomerId: data.customerId ?? null,
    trialEndsAt: status === "trial" ? periodEnd : null,
    currentPeriodEnd: periodEnd,
  });
}
