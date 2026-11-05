import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabasePublishableKey &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  !supabaseUrl.includes('your-project-id') &&
  supabasePublishableKey !== 'your-publishable-key-here' &&
  !supabasePublishableKey.includes('your-publishable-key')
);

/**
 * Supabase client instance.
 * Returns null if environment variables are not yet provided,
 * allowing the application to run seamlessly on local verified data.
 */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

if (!isSupabaseConfigured && import.meta.env.DEV) {
  // Helpful architectural notice for developer
  console.info(
    '[KTU Notes Hub] Supabase environment variables not configured yet. Using local verified college academic data.'
  );
}
