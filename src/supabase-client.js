import { createClient } from "@supabase/supabase-js";

const projectUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const publicKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

export const hasSupabaseConfig =
  /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(projectUrl) &&
  publicKey.length > 20 &&
  !publicKey.includes("YOUR_");

export const supabase = hasSupabaseConfig
  ? createClient(projectUrl, publicKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    })
  : null;
