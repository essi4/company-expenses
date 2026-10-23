export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://kswthodsqvptpxrqfgbb.supabase.co";

// This is a public Supabase publishable key and is safe to ship to the browser.
// Keeping it as a fallback ensures the production Worker can initialize Supabase Auth
// even when NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not injected by the platform.
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_ScAgnzy4aW99Z0G7Hdblhw_Wb0Ev_pU";
