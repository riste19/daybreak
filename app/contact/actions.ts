"use server";

import { isValidEmail, normalizeEmail } from "@/lib/validation";

/** What the contact form renders from. `idle` is the pre-submit state. */
export type ContactState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | {
      status: "error";
      message: string;
      fieldErrors: Partial<Record<ContactField, string>>;
      /** Echo back what was typed so the form can repopulate after an error. */
      values: Record<ContactField, string>;
    };

type ContactField = "name" | "email" | "subject" | "message";

export const initialContactState: ContactState = { status: "idle" };

const MAX_MESSAGE = 2000;

/**
 * Validates a contact submission server-side. There is no email-delivery or
 * persistence layer in the repo yet (see `api/README.md` — Phase 1 is the
 * generation engine only), so an accepted message is logged for now. Wire this
 * to real delivery (transactional email / a `contact_messages` table) later —
 * the validation and the success contract stay the same.
 */
export async function submitContactMessage(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = normalizeEmail(formData.get("email"));
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  const fieldErrors: Partial<Record<ContactField, string>> = {};
  if (!name) fieldErrors.name = "Please tell us your name.";
  if (!email) fieldErrors.email = "We need an email so we can reply.";
  else if (!isValidEmail(email)) fieldErrors.email = "That email doesn't look quite right.";
  if (!message) fieldErrors.message = "Add a short note so we know how to help.";
  else if (message.length > MAX_MESSAGE)
    fieldErrors.message = `Keep it under ${MAX_MESSAGE.toLocaleString()} characters.`;

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Please fix the highlighted fields and try again.",
      fieldErrors,
      values: { name, email, subject, message },
    };
  }

  // Accepted. No delivery pipeline yet — log so it's visible during dev.
  console.info("[contact] new message", {
    name,
    email,
    subject: subject || "(none)",
    length: message.length,
  });

  const firstName = name.split(/\s+/)[0];
  return {
    status: "success",
    message: `Thanks, ${firstName} — your message is on its way. We'll reply to ${email} soon.`,
  };
}
