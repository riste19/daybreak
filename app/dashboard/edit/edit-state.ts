/**
 * State for the preferences editor's Server Action. Kept out of actions.ts: a
 * "use server" file may only export async functions, so the type + initial value
 * live here (same pattern as checkout-state / login-state).
 */

export type EditState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export const initialEditState: EditState = { status: "idle" };
