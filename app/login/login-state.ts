// Shared login state. Kept OUT of actions.ts because a "use server" file may
// only export async functions. Client-safe (no server-only imports), so the
// login form can import the initial state.

export type LoginState =
  | { status: "idle" }
  | { status: "sent"; email: string; demo: boolean }
  | { status: "error"; message: string; email: string };

export const initialLoginState: LoginState = { status: "idle" };
