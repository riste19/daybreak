// Shared checkout state. Kept OUT of actions.ts because a "use server" file may
// only export async functions — exporting a constant/type from it throws
// "A 'use server' file can only export async functions". Client-safe (no
// server-only imports), so the form component can import the initial state.

export type CheckoutState =
  | { status: "idle" }
  | {
      status: "success";
      planName: string;
      email: string;
      message: string;
      /** True when no account was actually written (Supabase not configured). */
      demo: boolean;
    }
  | {
      status: "error";
      message: string;
      /** Echo back the typed email so the form can repopulate after an error. */
      email: string;
    };

export const initialCheckoutState: CheckoutState = { status: "idle" };
