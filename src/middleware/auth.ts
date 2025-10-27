import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isSupabaseEnabled } from '@/lib/supabase-config'

/**
 * Auth middleware for handling authentication on server-side routes
 */
export async function authMiddleware(request: NextRequest) {
  // Skip auth middleware if Supabase is not enabled
  if (!isSupabaseEnabled()) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Refresh session if expired
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Auth middleware error:', error)
    }

    // Add user info to request headers for server components
    if (session?.user) {
      response.headers.set('x-user-id', session.user.id)
      response.headers.set('x-user-email', session.user.email || '')
    }

    return response
  } catch (error) {
    console.error('Auth middleware error:', error)
    return NextResponse.next()
  }
}

/**
 * Check if a route requires authentication
 */
export function requiresAuth(pathname: string): boolean {
  const protectedRoutes = [
    '/profile',
    '/settings',
    '/dashboard',
  ]
  
  return protectedRoutes.some(route => pathname.startsWith(route))
}

/**
 * Check if a route is auth-related (login, signup, etc.)
 */
export function isAuthRoute(pathname: string): boolean {
  const authRoutes = [
    '/auth/login',
    '/auth/signup',
    '/auth/reset-password',
    '/auth/callback',
  ]
  
  return authRoutes.some(route => pathname.startsWith(route))
}

/**
 * Get redirect URL for unauthenticated users
 */
export function getAuthRedirectUrl(request: NextRequest): string {
  const redirectTo = encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)
  return `/auth/login?redirectTo=${redirectTo}`
}

/**
 * Get redirect URL after successful authentication
 */
export function getPostAuthRedirectUrl(request: NextRequest): string {
  const redirectTo = request.nextUrl.searchParams.get('redirectTo')
  return redirectTo || '/'
}