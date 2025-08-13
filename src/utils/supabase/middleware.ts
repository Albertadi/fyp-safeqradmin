import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { AuthApiError } from "@supabase/supabase-js"

const LOGIN_PATH = "/" // change to "/login" if that's your actual login page
const PUBLIC_PATHS = ["/", "/login", "/auth/confirm", "/resetpassword"]

function isPublicPath(pathname: string) {
  // exact match for "/" to avoid prefix catch-all
  if (pathname === "/") return true
  return PUBLIC_PATHS.some((p) => p !== "/" && pathname.startsWith(p))
}

function redirectIfNotAlreadyHere(request: NextRequest, toPath: string) {
  if (request.nextUrl.pathname === toPath) return null
  const url = request.nextUrl.clone()
  url.pathname = toPath
  return NextResponse.redirect(url)
}

function deleteSupabaseCookies(req: NextRequest, res: NextResponse) {
  // Remove any cookie that starts with "sb-" (Supabase sets project-scoped cookie names)
  for (const c of req.cookies.getAll()) {
    if (c.name.startsWith("sb-")) {
      res.cookies.delete(c.name)
    }
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

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
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  let user = null
  let authError: unknown = null

  try {
    const { data, error } = await supabase.auth.getUser()
    user = data.user
    authError = error ?? null
  } catch (e) {
    // Unexpected failures from getUser()
    authError = e
  }

  // Handle explicit Supabase auth API errors (expired/invalid sessions)
  if (authError instanceof AuthApiError) {
    const code = authError.code
    if (code === "refresh_token_not_found" || code === "session_expired" || code === "jwt_expired") {
      // Best-effort sign out; do not await to avoid delaying the redirect
      supabase.auth.signOut().catch((e) => console.error("Middleware signOut error:", e))

      // Clear SB cookies on the response
      deleteSupabaseCookies(request, supabaseResponse)

      const redirect = redirectIfNotAlreadyHere(request, LOGIN_PATH)
      if (redirect) return redirect
      // Already on login/home; let the request continue to render the page
      return supabaseResponse
    }
  }

  // If there is no user AND the current path is NOT public, send to login/home.
  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    const redirect = redirectIfNotAlreadyHere(request, LOGIN_PATH)
    if (redirect) return redirect
    return supabaseResponse
  }

  return supabaseResponse
}
