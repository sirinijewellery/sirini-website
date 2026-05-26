import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user;
  const isAdmin = session?.user?.isAdmin === true;

  const isAuthPage = nextUrl.pathname.startsWith("/login") ||
                     nextUrl.pathname.startsWith("/register");
  const isProtectedPage =
    nextUrl.pathname.startsWith("/wishlist") ||
    nextUrl.pathname.startsWith("/account") ||
    nextUrl.pathname.startsWith("/checkout");
  const isAdminPage = nextUrl.pathname.startsWith("/admin");

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

  // Require admin for admin pages
  if (isAdminPage && !isAdmin) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
