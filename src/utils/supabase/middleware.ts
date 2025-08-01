import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

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

  // IMPORTANT: DO NOT REMOVE auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("Middleware: Request Path:", request.nextUrl.pathname)
  console.log("Middleware: User ID:", user ? user.id : "No user")
  console.log("Middleware: User Email:", user ? user.email : "N/A")

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
    console.log("Middleware: Redirecting unauthenticated user from protected path to /")
    const url = request.nextUrl.clone()
    url.pathname = "/" // Redirect to home page
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
