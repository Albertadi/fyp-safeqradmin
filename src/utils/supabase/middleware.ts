import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { AuthApiError } from "@supabase/supabase-js" // Import AuthApiError

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  let user = null
  let authError = null

  try {
    const { data, error } = await supabase.auth.getUser()
    user = data.user
    authError = error // Capture the error if any
  } catch (e: any) {
    // Catch any unexpected errors during getUser() call
    console.error("Middleware: Unexpected error during getUser():", e)
    authError = e // Treat as an auth error for redirection purposes
  }

  // Handle specific Supabase Auth errors like expired refresh tokens
  if (authError instanceof AuthApiError) {
    // Check for common session-related errors [^1]
    if (
      authError.code === "refresh_token_not_found" ||
      authError.code === "session_expired" ||
      authError.code === "jwt_expired"
    ) {
      // Explicitly sign out to clear client-side cookies/storage
      await supabase.auth.signOut()
      // Ensure the response also clears cookies if signOut() didn't fully propagate
      supabaseResponse.cookies.delete("sb-access-token")
      supabaseResponse.cookies.delete("sb-refresh-token")
      // Then proceed with redirection
      const url = request.nextUrl.clone()
      url.pathname = "/" // Redirect to home page
      return NextResponse.redirect(url)
    }
  }

  // Define paths that are publicly accessible without authentication
  const publicPaths = ["/", "/login", "/auth/confirm", "/resetpassword"]

  // Check if the current path is one of the public paths
  const isPublicPath = publicPaths.some((path) => {
    // For the root path, ensure exact match to avoid matching all paths starting with '/'
    if (path === "/") {
      return request.nextUrl.pathname === "/"
    }
    // For other paths, check if the pathname starts with the public path
    return request.nextUrl.pathname.startsWith(path)
  })

  // If there's no user AND the current path is NOT a public path, then redirect to home
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = "/" // Redirect to home page
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
