import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// ──────────────────────────────────────────────────────────────────────────
// MBS ← BSB SEAMLESS SSO — redeem hand-off (MyBikeStory side)
//
// BSB minted a one-time token in the shared `sso_handoffs` table and sent the
// user here: /auth/sso?token=…. We validate it (service role), mark it used,
// mint a session for the user's email via admin generateLink + verifyOtp, set
// the session cookies on the redirect response, and land them on `next`
// already logged in.
//
// generateLink + verifyOtp(token_hash) is the server-side session-mint path:
// it is NOT PKCE, so it needs no prior code-verifier cookie and works cleanly
// inside a route handler.
//
// Any failure falls back to the normal login page — never an error screen.
// ──────────────────────────────────────────────────────────────────────────

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.mybikestory.co.za";

function safeNext(next: string | undefined | null): string {
  // Only same-site relative paths, to prevent open redirects.
  if (next && next.startsWith("/")) return next;
  return "/sell";
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const loginFallback = `${SITE}/auth/login`;

  if (!token) return NextResponse.redirect(loginFallback);

  try {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Validate the token: exists, unused, unexpired.
    const { data: row } = await admin
      .from("sso_handoffs")
      .select("token, user_id, email, next, expires_at, used_at")
      .eq("token", token)
      .maybeSingle();

    if (!row || row.used_at || new Date(row.expires_at).getTime() < Date.now()) {
      return NextResponse.redirect(loginFallback);
    }

    // 2. Burn it immediately (single use) — before minting the session, so a
    //    replay can't race a second redemption.
    const { error: burnErr } = await admin
      .from("sso_handoffs")
      .update({ used_at: new Date().toISOString() })
      .eq("token", token)
      .is("used_at", null);
    if (burnErr) return NextResponse.redirect(loginFallback);

    const next = safeNext(row.next);

    // 3. Mint a one-time OTP for this user's email.
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: row.email,
    });
    const hashedToken = linkData?.properties?.hashed_token;
    if (linkErr || !hashedToken) {
      console.error("SSO generateLink failed:", linkErr?.message);
      return NextResponse.redirect(loginFallback);
    }

    // 4. Verify the OTP on the SSR server client, writing session cookies onto
    //    the redirect response.
    const response = NextResponse.redirect(`${SITE}${next}`);
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { error: verifyErr } = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: hashedToken,
    });

    if (verifyErr) {
      console.error("SSO verifyOtp failed:", verifyErr.message);
      return NextResponse.redirect(loginFallback);
    }

    return response;
  } catch (e: any) {
    console.error("SSO redeem fatal:", e?.message || e);
    return NextResponse.redirect(loginFallback);
  }
}
