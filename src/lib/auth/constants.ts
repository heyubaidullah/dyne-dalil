/**
 * Hardcoded demo credentials. The demo user is auto-provisioned the first
 * time someone clicks "Continue as demo user" on /login.
 */
export const DEMO_EMAIL = "demo@dalil.app";
export const DEMO_PASSWORD = "dalildemo2026";

export type AuthResult = { ok: true } | { ok: false; error: string };
