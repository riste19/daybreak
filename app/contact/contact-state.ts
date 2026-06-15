// Shared contact-form state. Kept OUT of actions.ts because a "use server" file
// may only export async functions. Client-safe (no server-only imports).

export type ContactField = "name" | "email" | "subject" | "message";

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

export const initialContactState: ContactState = { status: "idle" };
