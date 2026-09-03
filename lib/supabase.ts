import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL تنظیم نشده است.");
  }

  if (!supabasePublishableKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY تنظیم نشده است."
    );
  }

  return createClient(supabaseUrl, supabasePublishableKey);
}

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!client) {
    client = getSupabaseClient();
  }

  return client;
}

// ساخت کلاینت به‌صورت lazy باعث می‌شود Vercel هنگام build
// به متغیرهای محیطی Supabase نیاز نداشته باشد؛ کلاینت در زمان
// اجرای واقعی API و فقط در صورت استفاده ساخته می‌شود.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, property, receiver) {
    const value = Reflect.get(getClient(), property, receiver);

    return typeof value === "function"
      ? value.bind(getClient())
      : value;
  },
});
