import { updateSession } from "@/lib/supabase/proxy";
import { type NextRequest } from "next/server";
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - site.webmanifest (PWA manifest)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    "/((?!_next/static|_next/image|favicon.ico|site\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
