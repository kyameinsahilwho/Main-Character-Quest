import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
      console.warn("Supabase env vars missing. Using mock client.");
      if (typeof window !== 'undefined') {
         // Comprehensive mock to allow app to function without Supabase
         const mockClient = {
             from: (table: string) => ({
                 select: () => ({
                     eq: () => ({
                         order: () => Promise.resolve({ data: [], error: null }),
                         single: () => Promise.resolve({ data: null, error: null }),
                         maybeSingle: () => Promise.resolve({ data: null, error: null })
                     }),
                     order: () => Promise.resolve({ data: [], error: null }),
                     single: () => Promise.resolve({ data: null, error: null })
                 }),
                 insert: () => Promise.resolve({ error: null }),
                 update: () => ({ eq: () => ({ in: () => Promise.resolve({ error: null }), ...Promise.resolve({ error: null }) }), ...Promise.resolve({ error: null }) }),
                 delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
             }),
             auth: {
                 getUser: () => Promise.resolve({ data: { user: null }, error: null }),
                 getSession: () => Promise.resolve({ data: { session: null }, error: null }),
                 onAuthStateChange: (callback: any) => {
                     // Immediately invoke with null session to settle loading states
                     callback('SIGNED_OUT', null);
                     return { data: { subscription: { unsubscribe: () => {} } } };
                 },
                 signInWithPassword: () => Promise.resolve({ error: { message: "Mock client - cannot sign in" } }),
                 signUp: () => Promise.resolve({ error: { message: "Mock client - cannot sign up" } }),
                 signOut: () => Promise.resolve({ error: null }),
             }
         };
         return mockClient as any;
      }
  }

  return createBrowserClient(
    url!,
    key!
  )
}
