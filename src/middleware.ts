export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/((?!api/auth|api/stripe/webhook|_next/static|_next/image|favicon.ico|auth).*)",
  ],
};
