// Authentication and Route Protection Middleware
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client for middleware
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

// Define protected routes and their required roles
const PROTECTED_ROUTES: Record<string, string[]> = {
  '/dashboard': ['*'],
  '/dashboard/admin': ['admin'],
  '/dashboard/plant-manager': ['admin', 'plant_manager'],
  '/dashboard/production': ['admin', 'plant_manager', 'production_lead'],
  '/dashboard/qc': ['admin', 'plant_manager', 'qc_lead', 'qc_staff'],
  '/dashboard/quality': ['admin', 'plant_manager', 'qc_lead', 'qc_staff', 'qa_technician'],
  '/dashboard/inventory': ['admin', 'plant_manager', 'production_lead', 'staff_lead'],
  '/dashboard/security': ['admin', 'plant_manager', 'security_guard', 'gate_control'],
  '/dashboard/approvals': ['admin', 'plant_manager', 'qc_lead'],
  '/weight-notes': ['admin', 'plant_manager', 'qc_lead', 'qc_staff', 'qa_technician'],
  '/forms': ['admin', 'plant_manager', 'production_lead', 'staff_lead', 'qc_lead', 'qc_staff', 'station_staff'],
  '/api': ['*'],
  '/settings': ['admin', 'plant_manager'],
  '/users': ['admin'],
  '/onboarding': ['admin', 'plant_manager']
};

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/health',
  '/_next',
  '/favicon.ico',
  '/api/health',
  '/api/auth',
  '/public'
];

// Admin-only routes
const ADMIN_ROUTES = [
  '/admin',
  '/users',
  '/system',
  '/api/admin'
];

// Development routes (only accessible in development)
const DEV_ROUTES = [
  '/dev',
  '/api/dev',
  '/test'
];

interface UserSession {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  plant_id?: string;
  department?: string;
  status: 'active' | 'inactive'; // ✅ Added missing 'status' property
  is_active: boolean;
  last_login?: string;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const url = request.nextUrl.clone();

  // Skip middleware for static assets and public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Skip middleware in development for dev routes
  if (process.env.NODE_ENV === 'development' && isDevRoute(pathname)) {
    return NextResponse.next();
  }

  try {
    // Get the session token from cookies or Authorization header
    const sessionToken = getSessionToken(request);
    
    if (!sessionToken) {
      return redirectToLogin(url, pathname, 'No session token found');
    }

    // Validate the session and get user data
    const userSession = await validateSession(sessionToken);
    
    if (!userSession) {
      return redirectToLogin(url, pathname, 'Invalid session');
    }

    // Check if user is active
    if (!userSession.is_active) {
      return redirectToLogin(url, pathname, 'Account deactivated');
    }

    // Check route authorization
    const authResult = checkRouteAuthorization(pathname, userSession);
    
    if (!authResult.authorized) {
      return createErrorResponse(403, authResult.reason || 'Access denied', pathname);
    }

    // Add user context to headers for downstream use
    const response = NextResponse.next();
    response.headers.set('x-user-id', userSession.id);
    response.headers.set('x-user-role', userSession.role);
    response.headers.set('x-user-plant', userSession.plant_id || '');
    response.headers.set('x-user-department', userSession.department || '');
    
    // Set security headers
    setSecurityHeaders(response);
    
    return response;

  } catch (rawError) {
    const error = rawError instanceof Error ? rawError : new Error(String(rawError));
    console.error('Middleware error:', error);
    
    // In production, redirect to login for security
    if (process.env.NODE_ENV === 'production') {
      return redirectToLogin(url, pathname, 'Authentication error');
    }
    
    // In development, show the error
    return createErrorResponse(500, `Middleware error: ${error.message}`, pathname);
  }
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    if (route.includes('*')) {
      return pathname.startsWith(route.replace('*', ''));
    }
    return pathname.startsWith(route);
  });
}

function isDevRoute(pathname: string): boolean {
  return DEV_ROUTES.some(route => pathname.startsWith(route));
}

function getSessionToken(request: NextRequest): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try cookies
  const cookieToken = request.cookies.get('sb-access-token')?.value;
  if (cookieToken) {
    return cookieToken;
  }

  // Try session cookie (Supabase default)
  const sessionCookie = request.cookies.get('sb-auth-token')?.value;
  if (sessionCookie) {
    try {
      const parsed = JSON.parse(sessionCookie);
      return parsed.access_token;
    } catch {
      // Invalid JSON in cookie
    }
  }

  return null;
}

async function validateSession(token: string): Promise<UserSession | null> {
  try {
    // ✅ FIXED: Added missing opening brace `{` in destructuring
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.warn('Session validation failed:', error?.message);
      return null;
    }

    // Fetch additional user profile data
    const userProfile = await fetchUserProfile(user.id);
    
    if (!userProfile) {
      console.warn('User profile not found for:', user.id);
      return null;
    }

    return {
      id: user.id,
      email: user.email || '',
      role: userProfile.role,
      permissions: userProfile.permissions || [],
      plant_id: userProfile.plant_id,
      department: userProfile.department,
      status: userProfile.status || 'active',
      is_active: userProfile.status === 'active',
      last_login: user.last_sign_in_at
    };
  } catch (rawError) {
    const error = rawError instanceof Error ? rawError : new Error(String(rawError));
    console.error('Session validation error:', error);
    return null;
  }
}

async function fetchUserProfile(userId: string): Promise<UserSession | null> {
  try {
    // In a real implementation, this would query your user profiles table
    // For now, we'll return a mock profile based on the user ID
    
    // Try to fetch from your backend API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      return await response.json();
    }

    // Fallback to mock data for development
    return {
      id: userId,
      email: 'mock@clamflow.com',
      role: 'qa_technician',
      permissions: ['read', 'write'],
      plant_id: 'plant_001',
      department: 'Quality Assurance',
      status: 'active',
      is_active: true,
      last_login: new Date().toISOString()
    };
  } catch (rawError) {
    const error = rawError instanceof Error ? rawError : new Error(String(rawError));
    console.error('Error fetching user profile:', error);
    
    // Return mock data for development
    return {
      id: userId,
      email: 'mock@clamflow.com',
      role: 'qa_technician',
      permissions: ['read', 'write'],
      plant_id: 'plant_001',
      department: 'Quality Assurance',
      status: 'active',
      is_active: true,
      last_login: new Date().toISOString()
    };
  }
}

function checkRouteAuthorization(pathname: string, user: UserSession): {
  authorized: boolean;
  reason?: string;
} {
  // Check admin-only routes
  if (isAdminRoute(pathname) && user.role !== 'admin') {
    return {
      authorized: false,
      reason: 'Admin access required'
    };
  }

  // Find matching protected route
  const matchingRoute = Object.keys(PROTECTED_ROUTES).find(route => 
    pathname.startsWith(route)
  );

  if (!matchingRoute) {
    // Route not found in protection config, allow by default for authenticated users
    return { authorized: true };
  }

  const requiredRoles = PROTECTED_ROUTES[matchingRoute];

  // '*' means any authenticated user is allowed
  if (requiredRoles.includes('*')) {
    return { authorized: true };
  }

  // Check if user's role is in the required roles
  if (requiredRoles.includes(user.role)) {
    return { authorized: true };
  }

  // Check hierarchical permissions (admin can access everything)
  if (user.role === 'admin') {
    return { authorized: true };
  }

  // Check plant manager permissions for their plant
  if (user.role === 'plant_manager' && user.plant_id) {
    const plantRestrictedRoles = ['plant_manager', 'production_lead', 'staff_lead', 'qc_lead', 'qc_staff', 'station_staff'];
    if (requiredRoles.some(role => plantRestrictedRoles.includes(role))) {
      return { authorized: true };
    }
  }

  return {
    authorized: false,
    reason: `Insufficient permissions. Required: ${requiredRoles.join(' or ')}, User has: ${user.role}`
  };
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some(route => pathname.startsWith(route));
}

function redirectToLogin(url: URL, originalPath: string, reason?: string): NextResponse {
  // Store the original path for redirect after login
  url.pathname = '/login';
  url.searchParams.set('returnUrl', originalPath);
  
  if (reason) {
    url.searchParams.set('message', reason);
  }

  const response = NextResponse.redirect(url);
  
  // Clear any existing session cookies
  response.cookies.delete('sb-access-token');
  response.cookies.delete('sb-auth-token');
  
  return response;
}

function createErrorResponse(status: number, message: string, path: string): NextResponse {
  const errorResponse = {
    error: message,
    statusCode: status,
    timestamp: new Date().toISOString(),
    path
  };

  return new NextResponse(
    JSON.stringify(errorResponse),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'X-Error-Source': 'auth-middleware'
      }
    }
  );
}

function setSecurityHeaders(response: NextResponse): void {
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // CSP header for additional security
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.vercel.app",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' ",
    "connect-src 'self' *.supabase.co *.railway.app ws: wss:",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', cspHeader);

  // HSTS header for HTTPS enforcement in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
}

// Export configuration for Next.js
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};

// Helper functions for use in components
export function hasRole(userRole: string, requiredRoles: string[]): boolean {
  if (requiredRoles.includes('*')) return true;
  if (requiredRoles.includes(userRole)) return true;
  if (userRole === 'admin') return true;
  return false;
}

export function canAccessRoute(pathname: string, userRole: string): boolean {
  const matchingRoute = Object.keys(PROTECTED_ROUTES).find(route => 
    pathname.startsWith(route)
  );
  
  if (!matchingRoute) return true;
  
  const requiredRoles = PROTECTED_ROUTES[matchingRoute];
  return hasRole(userRole, requiredRoles);
}

// Role hierarchy for permission checking
export const ROLE_HIERARCHY: Record<string, number> = {
  'admin': 10,
  'plant_manager': 8,
  'production_lead': 6,
  'staff_lead': 5,
  'qc_lead': 5,
  'qc_staff': 4,
  'station_staff': 3,
  'qa_technician': 3,
  'security_guard': 2,
  'gate_control': 2
};

export function hasHigherRole(userRole: string, requiredRole: string): boolean {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0);
}