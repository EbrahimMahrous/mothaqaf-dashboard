import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = ["/dashboard", "/hero", "/files", "/newsletter", "/settings"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("mosaqaf_token")?.value;

  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  if (isProtected && !token) {
    // No cookies — though there might be data in localStorage
    // That’s why AuthGuard handles protection on the client side
  }

  if (pathname === "/login") {
    // We don't perform a redirect if the token exists — AuthProvider handles it
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
