import { NextResponse, type NextRequest } from "next/server";

// Optimistic check only: real authorization happens in lib/auth/dal.ts on every page and action.
export function proxy(req: NextRequest) {
  const hasSession = req.cookies.has("esg_session");
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/dashboard") && !hasSession) {
    const url = new URL("/login", req.nextUrl);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
