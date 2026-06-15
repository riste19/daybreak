// Shared checkout state. Kept OUT of actions.ts because a "use server" file may
// only export async functions — exporting a constant/type from it throws
// "A 'use server' file can only export async functions". Client-safe (no
// server-only imports), so the form component can import the initial state.

/** Entered values echoed back on error so the modal can repopulate (no CVC). */
export interface CheckoutValues {
  email: string;
  cardName: string;
  cardNumber: string;
  cardExpiry: string;
}

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
      /** Echo typed values (minus CVC) so the form can repopulate after an error. */
      values: CheckoutValues;
    };

export const initialCheckoutState: CheckoutState = { status: "idle" };
