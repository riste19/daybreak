"use server";

import { site } from "@/lib/config";
import { escapeHtml, isEmailConfigured, sendEmail } from "@/lib/email/send";
import { isValidEmail, normalizeEmail } from "@/lib/validation";
import type { ContactField, ContactState } from "./contact-state";

// State type + initial state live in ./contact-state — a "use server" file may
// only export async functions.

const MAX_MESSAGE = 2000;

/**
 * Validates a contact submission server-side, then emails it to the team inbox
 * (`site.contactEmail`) via Resend, with the sender's address as reply-to so a
 * reply lands back in their inbox.
 *
 * When the email transport isn't configured (no RESEND_API_KEY / EMAIL_FROM —
 * e.g. local dev) it degrades gracefully: the message is logged and the user
 * still sees the success state, mirroring how the auth/subscribe actions behave
 * without keys.
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

  // No transport configured (local dev) → log and report success so the flow
  // can still be exercised without keys.
  if (!isEmailConfigured()) {
    console.info("[contact] message (demo — email transport not configured)", {
      name,
      email,
      subject: subject || "(none)",
      length: message.length,
    });
    return successState(name, email);
  }

  const emailSubject = subject
    ? `[Contact] ${subject}`
    : `[Contact] New message from ${name}`;
  const text =
    `New message from the contact form\n\n` +
    `Name: ${name}\n` +
    `Email: ${email}\n` +
    `Subject: ${subject || "(none)"}\n\n` +
    `${message}\n`;
  const html =
    `<p><strong>New message from the contact form</strong></p>` +
    `<p><strong>Name:</strong> ${escapeHtml(name)}<br />` +
    `<strong>Email:</strong> ${escapeHtml(email)}<br />` +
    `<strong>Subject:</strong> ${escapeHtml(subject || "(none)")}</p>` +
    `<p style="white-space:pre-wrap;">${escapeHtml(message)}</p>`;

  try {
    await sendEmail({
      to: site.contactEmail,
      subject: emailSubject,
      html,
      text,
      replyTo: email,
    });
  } catch (err) {
    console.error("[contact] send failed", err);
    return {
      status: "error",
      message:
        "Something went wrong sending your message. Please try again in a moment.",
      fieldErrors: {},
      values: { name, email, subject, message },
    };
  }

  return successState(name, email);
}

function successState(name: string, email: string): ContactState {
  const firstName = name.split(/\s+/)[0];
  return {
    status: "success",
    message: `Thanks, ${firstName} — your message is on its way. We'll reply to ${email} soon.`,
  };
}
