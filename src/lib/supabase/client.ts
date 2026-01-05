import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
      console.warn("Supabase env vars missing. Using mock client.");
      // Ensure we are in browser environment before returning mock client if designed for browser
      // Or just return it. `createBrowserClient` expects browser env.

      // We must return SOMETHING that mimics Supabase client to prevent crashes.
      // And we must NOT call createBrowserClient if keys are missing because it throws.

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

  // This block shouldn't be reached if url/key are missing because of the if block above.
  // However, the if block currently only returns if window is defined (browser).
  // If we are on server (SSR), and keys are missing, we still fall through to createBrowserClient?
  // createBrowserClient is for client-side.

  // If we are on server, we should probably return a dummy or null, but this function is createClient (likely browser client).

  if (!url || !key) {
      // Return a minimal mock that doesn't crash on server/client if keys missing
      return {
             from: () => ({
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
                 onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
             }
         } as any;
  }

  return createBrowserClient(
    url,
    key
  )
}
