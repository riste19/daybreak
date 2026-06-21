# Daybreak emails

React Email implementation of Daybreak's six lifecycle/daily emails, built from a
shared set of layout components so the states share code instead of duplicating
it. All copy that varies is prop-driven; the AI-generated motivational body is
passed in (`bodyParagraphs`) and never hardcoded.

## Install

```bash
# from the repo root (pnpm — see CLAUDE.md)
pnpm add @react-email/components resend
pnpm add -D react-email
```

## Preview locally

```bash
pnpm exec email dev --dir emails
# then open http://localhost:3000
```

`email dev` lists every template (files with a default export). Each renders with
the realistic `*.PreviewProps` defined at the bottom of its file — no lorem.

Optional: add a script to `package.json` → `"email": "email dev --dir emails"`.

## Layout

```
emails/
  theme.ts            design tokens — the single re-skin point (colors/fonts/spacing)
  config.ts           DOMAIN, the `from` constant, brand links, unsubscribe mailto
  send.ts             sendDaybreakEmail() — Resend call + List-Unsubscribe one-click
  index.ts            barrel export
  components/
    EmailLayout.tsx   Html/Head/Body/Container + fonts + Header + Footer + Preview
    Header.tsx        sunburst mark + "Daybreak" wordmark + optional gradient bar
    Footer.tsx        CTA + legal copy vary by variant ('trial' | 'paid' | 'sample')
    CTAButton.tsx     branded button (primary / secondary)
    DailyBody.tsx     shared daily body: subject → paragraphs → signature → meta
  templates/
    SampleEmail.tsx               not-yet-subscribed; footer CTA = start free trial
    DailyTrialEmail.tsx           in-trial daily + "Day X of 7" line
    DailyPaidEmail.tsx            paid daily, no trial chrome
    WelcomeEmail.tsx              trial just started; CTA = set preferences
    TrialEndingEmail.tsx          day-6 heads-up; charge amount + date; CTA = manage
    PaymentConfirmationEmail.tsx  receipt; CTA = manage billing
```

## Send (example)

```tsx
import { DailyPaidEmail, sendDaybreakEmail } from "@/emails";

const unsubscribeUrl = `https://daybreakmail.com/unsubscribe?t=${token}`;

await sendDaybreakEmail({
  to: "reader@example.com",
  subject: "You are not behind. You are exactly here.",
  unsubscribeUrl,
  react: (
    <DailyPaidEmail
      subject="You are not behind. You are exactly here."
      bodyParagraphs={paragraphs} // AI-generated upstream
      tone="stoic"
      themeOfDay="identity"
      unsubscribeUrl={unsubscribeUrl}
    />
  ),
});
```

## NOT handled in code — deliverability checklist

These are infrastructure/DNS tasks, not template code:

- [x] **SPF / DKIM** — already configured in Resend for `daybreakmail.com` (the
      domain is verified; see CLAUDE.md → Deployment).
- [ ] **DMARC enforcement** — add/strengthen a `_dmarc` TXT record. Start at
      `p=none` to monitor, then move to `quarantine` → `reject`.
- [ ] **One-click unsubscribe endpoint** — `send.ts` already emits
      `List-Unsubscribe-Post: List=Unsubscribe-One-Click`, but it's inert until
      `app/unsubscribe` (currently a GET page) gains a **POST** route handler that
      reads the token and unsubscribes **without further interaction** (RFC 8058).
- [ ] **BIMI / VMC** — to show the Daybreak logo in supporting inboxes, publish a
      BIMI record + a Verified Mark Certificate. A later task; not required to send.
- [ ] **Display-font hosting** — the optional `Fraunces` webfont in `theme.ts`
      ships disabled (Georgia is the guaranteed fallback). Self-host a woff2 and
      set `theme.displayWebFont.url` to enable it in clients that support webfonts.

## Notes

- **Mirrors:** `theme.ts` is a hand-kept copy of the engine palette
  (`api/src/delivery/template/render-email.ts`) and the builder preview
  (`components/email-builder/email-preview.tsx`). Change one, change all three.
- **Not yet wired:** this set is standalone. The live daily send still runs
  through the NestJS engine's HTML-string renderer; wiring these in (and deciding
  whether the engine or the root app renders them) is a follow-up.
```
