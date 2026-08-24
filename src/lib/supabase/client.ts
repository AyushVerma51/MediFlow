import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Return a mock client for build-time / when env vars are not set
    return new Proxy({} as any, {
      get: (_target, prop) => {
        if (prop === 'auth') return { getUser: async () => ({ data: { user: null } }), signInWithPassword: async () => ({ error: new Error('Supabase not configured') }), signOut: async () => ({ error: null }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }) };
        if (prop === 'from') return () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }) });
        return () => {};
      }
    });
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
