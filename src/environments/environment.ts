/**
 * Supabase config.
 * The anon key is designed to be public (it only works together with RLS
 * policies) — it is safe to ship in the frontend bundle.
 *
 * Get both values from: Supabase Dashboard → Project Settings → API
 */
export const environment = {
  production: false,
  supabaseUrl: 'YOUR_SUPABASE_URL',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY',
};
