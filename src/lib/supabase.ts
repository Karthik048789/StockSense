import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

export const isSupabaseConfigured = () => {
  return (
    supabaseUrl.length > 0 &&
    supabaseAnonKey.length > 0 &&
    !supabaseUrl.includes("your-project-url")
  );
};

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key"
);
