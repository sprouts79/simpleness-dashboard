import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY!;

// Server-only client — never import this in client components
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});
