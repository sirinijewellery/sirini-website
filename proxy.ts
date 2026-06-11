import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user;
  const isAdmin = session?.user?.isAdmin === true;

  // Lowercase before matching — on case-insensitive filesystems (Windows/macOS
  // dev) "/Admin" can resolve to the same route and would bypass these checks.
  const pathname = nextUrl.pathname.toLowerCase();

  const isAuthPage = pathname.startsWith("/login") ||
                     pathname.startsWith("/register");
  const isProtectedPage =
    pathname.startsWith("/wishlist") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/checkout");
  const isAdminPage = pathname.startsWith("/admin");

  // Redirect logged-in users away from auth pages
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  // Require login for protected pages
  if (isProtectedPage && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Require admin for admin pages. Send unauthenticated/non-admin users to
  // the login page (with callbackUrl) instead of silently bouncing them to the
  // homepage, so visiting /admin directly actually prompts for login.
  if (isAdminPage && !isAdmin) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
