import { createClient } from '@supabase/supabase-js';

// SR-03: Anon-key client — browser safe
// RLS enforces all access control

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
