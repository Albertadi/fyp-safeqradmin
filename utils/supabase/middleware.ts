import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.next();

  const supabase: SupabaseClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Ensure `name` and `value` are defined and strings
            if (typeof name === 'string' && typeof value === 'string') {
              response.cookies.set(name, value, options);
            }
          });
        },
      },
    }
  );

  await supabase.auth.getUser();

  return response;
}
