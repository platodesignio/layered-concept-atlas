import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth(
  (
    req: NextRequest & {
      auth: { user?: { isAdmin?: boolean } } | null;
    }
  ) => {
    const { pathname } = req.nextUrl;
    const session = req.auth;

    // Admin routes require admin role
    if (pathname.startsWith("/admin")) {
      if (!session?.user) {
        return NextResponse.redirect(new URL("/auth/signin", req.url));
      }
      if (!(session.user as { isAdmin?: boolean }).isAdmin) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    // App routes require authentication
    if (pathname.startsWith("/app")) {
      if (!session?.user) {
        return NextResponse.redirect(
          new URL(
            `/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`,
            req.url
          )
        );
      }
    }

    return NextResponse.next();
  }
);

export const config = {
  matcher: ["/app/:path*", "/admin/:path*"],
};
