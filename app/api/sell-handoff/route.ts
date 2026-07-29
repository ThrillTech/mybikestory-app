import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

// ──────────────────────────────────────────────────────────────────────────
// BSB → MBS SEAMLESS SSO — mint hand-off (BSB side)
//
// A logged-in BSB user tapping "Sell my bike" hits this route. It mints a
// short-lived, single-use token in the shared `sso_handoffs` table and redirects
// to mybikestory.co.za/auth/sso?token=…. MBS redeems it and logs the user in.
//
// Only the opaque token travels in the URL — never tokens, email, or user id.
//
// Query: ?next=<path on MBS to land on, e.g. /sell?bikeId=abc>
// ──────────────────────────────────────────────────────────────────────────

const MBS_URL = "https://www.mybikestory.co.za";
const TOKEN_TTL_SECONDS = 90;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Not logged in on BSB → send them to MBS's normal sign-in for the target.
    const rawNext = request.nextUrl.searchParams.get("next") || "/sell";
    // Only allow relative paths, to prevent open-redirect abuse.
    const next = rawNext.startsWith("/") ? rawNext : "/sell";

    if (!user?.email) {
      return NextResponse.redirect(`${MBS_URL}/auth/login?next=${encodeURIComponent(next)}`);
    }

    const service = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Opportunistic housekeeping — keep the table from growing unbounded.
    await service.rpc("bsb_purge_sso_handoffs").catch(() => {});

    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + TOKEN_TTL_SECONDS * 1000).toISOString();

    const { error } = await service.from("sso_handoffs").insert({
      token,
      user_id: user.id,
      email: user.email,
      next,
      expires_at: expiresAt,
    });

    if (error) {
      console.error("🚨 SSO mint failed:", JSON.stringify(error));
      // Fall back to a normal login rather than blocking the sale.
      return NextResponse.redirect(`${MBS_URL}/auth/login?next=${encodeURIComponent(next)}`);
    }

    return NextResponse.redirect(`${MBS_URL}/auth/sso?token=${token}`);
  } catch (e: any) {
    console.error("❌ SSO mint fatal:", e);
    return NextResponse.redirect(`${MBS_URL}/auth/login`);
  }
}
