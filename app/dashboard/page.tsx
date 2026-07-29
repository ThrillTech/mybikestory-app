import { createClient } from "@/lib/supabase/server";
// ── SWITCHER: service-role client, used ONLY when viewing a child's data.
//    A parent and child are separate auth users; RLS blocks the parent from
//    reading a child's rows through the normal client, so after verifying the
//    guardian link in code we read the child's data with the service role. ──
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BikeMenu } from "@/components/bike-menu";
import SignOutButton from "@/components/sign-out-button";
import { getSubscriptionStatus, isPremium } from "@/lib/subscription";
import { FREE_BIKE_LIMIT, FREE_COMPONENT_LIMIT } from "@/lib/pricing";
import { LogRideButton } from "@/components/log-ride-button";
import { KidsEstimateEditor } from "@/components/kids-estimate-editor";
import { KidsComponentManager } from "@/components/kids-component-manager";
import { KidsLogRide } from "@/components/kids-log-ride";
import { KidsLogService } from "@/components/kids-log-service";
import { StravaConnectButton } from "@/components/strava-connect-button";
import { StravaPromptTracker } from "@/components/strava-prompt-tracker";
// ── SWITCHER: guardian access helpers. resolveEffectiveRider returns the child
//    id ONLY if this user is that child's verified guardian, else the user's own
//    id; getChildren feeds the switcher row. ──
import { resolveEffectiveRider, getChildren } from "@/lib/guardianship";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MBS_URL = "https://www.mybikestory.co.za";

// ── SWITCHER: the page now reads an optional ?rider=<childId> from the URL.
//    searchParams is awaited so this works whether Next passes a Promise
//    (Next 15) or a plain object (Next 14) — `await` handles both. ──
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ rider?: string }>;
}) {

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/auth/login");

  // ── SWITCHER: work out whose dashboard we're showing ─────────────────────
  const sp = await searchParams;
  const requestedRider = typeof sp?.rider === "string" ? sp.rider : null;

  // Returns the child's id only if `user` is that child's guardian; otherwise
  // (no param, or a rider they don't manage) it returns the user's own id.
  const effectiveRiderId = await resolveEffectiveRider(user.id, requestedRider);
  const viewingRiderId = effectiveRiderId ?? user.id;
  const isChildView = viewingRiderId !== user.id;

  // The children this user manages — an empty list means the switcher never
  // renders, so nothing changes for ordinary riders.
  const children = await getChildren(user.id);

  // Data client: the normal RLS client for your own view, the service-role
  // client when viewing a child (RLS would otherwise return nothing).
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const db = isChildView ? serviceClient : supabase;
  // ─────────────────────────────────────────────────────────────────────────

  const { data: bikes, error } = await db
    .from("bikes")
    .select(`
      id,
      name,
      brand,
      model,
      profile_photo_url,
      photo_urls,
      is_ebike,
      strava_gear_id,
      estimated_hours_per_ride,
      estimated_rides_per_week,
      components (
        id,
        type,
        brand,
        model,
        current_hours,
        current_lower_hours,
        current_km,
        service_interval_hours,
        oem_interval_lower,
        oem_interval_full,
        my_service_interval_lower,
        my_service_interval,
        tracking_unit,
        status,
        oem_status,
        my_status,
        oem_lower_status,
        my_lower_status
      )
    `)
    // ── SWITCHER: scope to the rider being viewed (self or child) ──
    .eq("user_id", viewingRiderId);

  if (error) console.error("Error fetching bikes:", error);

  // ── LIFETIME USAGE PER BIKE ────────────────────────────────────────────
  // Read from the bike_usage_totals VIEW, which derives each bike's lifetime
  // hours and km from the rides still attributed to it, plus whatever the rider
  // declared the bike had done before BSB (initial_hours / initial_km).
  //
  // ── SWITCHER: an explicit user_id filter is now REQUIRED. The view is
  //    security_invoker, so on the normal client RLS already scopes it — but the
  //    service-role client bypasses RLS and would otherwise return EVERY rider's
  //    totals. The filter makes both paths safe. ──
  const { data: usageTotals } = await db
    .from("bike_usage_totals")
    .select("bike_id, total_hours, total_km, ride_count")
    .eq("user_id", viewingRiderId);

  const usageByBike = new Map(
    (usageTotals ?? []).map((t: any) => [t.bike_id, t])
  );

  if (bikes) {
    bikes.forEach(bike => {
      if (bike.components) {
        bike.components.sort((a: any, b: any) => a.type.localeCompare(b.type));
      }
    });
  }

  // ── Pending ownership transfers ──
  // ── SWITCHER: only meaningful on YOUR own view — these are bikes being
  //    transferred to you. Skipped entirely when viewing a child. ──
  let pendingTransfers: any[] | null = null;
  if (!isChildView) {
    const { data: pt } = await supabase
      .from("bike_ownership")
      .select("id, bike_id, sale_id, transfer_fee_paid, created_at")
      .eq("owner_email", user.email)
      .eq("transfer_fee_paid", false)
      .eq("declined", false);
    pendingTransfers = pt;

    // Auto-link owner_id if not yet set
    if (pendingTransfers && pendingTransfers.length > 0) {
      for (const transfer of pendingTransfers) {
        await supabase
          .from("bike_ownership")
          .update({ owner_id: user.id })
          .eq("id", transfer.id)
          .is("owner_id", null);
      }
    }
  }

  const { count: pendingCount } = await db
    .from('activities')
    .select('*', { count: 'exact', head: true })
    // ── SWITCHER: scope to the rider being viewed ──
    .eq('user_id', viewingRiderId)
    .is('bike_id', null)
    .eq('archived', false);

  const { data: stravaIntegration } = await db
    .from("user_integrations")
    .select("id, athlete_id")
    // ── SWITCHER: scope to the rider being viewed ──
    .eq("user_id", viewingRiderId)
    .eq("provider", "strava")
    .maybeSingle();

  const firstName = user.user_metadata?.first_name;

  // ── SWITCHER: whose name to show in the header ──
  const viewingChild = isChildView ? children.find((c) => c.id === viewingRiderId) : null;
  const displayName = isChildView ? (viewingChild?.firstName || "Rider") : firstName;

  const stravaClientId = process.env.STRAVA_CLIENT_ID;
  // approval_prompt=force is deliberate and load-bearing.
  //
  // Without it, Strava defaults to approval_prompt=auto: if the browser's Strava
  // session has ALREADY authorised this app, Strava skips the consent screen
  // entirely and redirects straight back. The rider is never shown which athlete
  // they're connecting as — so a stale/wrong Strava session silently produces a
  // "successful" connection to the wrong account, with no bikes and no rides.
  // (Confirmed live on 7 Jul 2026.)
  //
  // Forcing the prompt makes Strava always display the authorisation screen,
  // which shows the athlete's name and avatar before they approve. It cannot log
  // them out of the wrong account — only Strava controls that session — but it
  // does put the identity in front of them at the moment of decision.
  const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${stravaClientId}&redirect_uri=https://bikeservicebook.com/api/strava/callback&response_type=code&approval_prompt=force&scope=activity:read_all,profile:read_all`;

  // ── SWITCHER: child connect carries the child's id in Strava's `state` field.
  //    Strava returns `state` untouched to the callback, which uses it (after a
  //    guardian check) to attach the token to the CHILD, not the parent. The
  //    parent logs in with the CHILD's Strava at the consent screen. ──
  const stravaAuthUrlChild = `${stravaAuthUrl}&state=${viewingRiderId}`;

  const subStatus = await getSubscriptionStatus();
  const premium = isPremium(subStatus);

  // FREE_BIKE_LIMIT and FREE_COMPONENT_LIMIT now come from lib/pricing.ts — the
  // single source of truth for every tier rule. They were hardcoded here, which
  // meant the add-component page had no idea they existed and enforced nothing.
  // The component limit is now 5 (was 3): the size of a full-suspension core
  // template, so a free rider can finish setting up any bike before meeting a paywall.
  const bikeCount = bikes?.length || 0;
  const atBikeLimit = !premium && bikeCount >= FREE_BIKE_LIMIT;

  // How many bikes are not yet linked to a Strava gear_id — drives the
  // "Link your bikes" prompt prominence on the Strava card.
  const unlinkedBikeCount = (bikes || []).filter((b: any) => !b.strava_gear_id).length;

  return (
    // ── SWITCHER: a soft orange wash signals the child's space; your own view
    //    keeps the neutral background. ──
    <div className={`min-h-screen bg-gradient-to-b ${isChildView ? "from-orange-50" : "from-neutral-light"} to-white`}>
      {/* Header */}
      <div className="bg-white border-b border-neutral-mid shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src="/Bike_Service_Book_Logo_Square.png" alt="Bike Service Book" className="h-14 w-auto drop-shadow-md" />
              <div>
                <h1 className="text-3xl font-medium text-brand-charcoal">
                  {/* ── SWITCHER: header title reflects whose bikes you're viewing ── */}
                  {isChildView
                    ? `${displayName}'s bikes`
                    : firstName ? `Welcome back, ${firstName}!` : 'Your Service Book'}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  {/* ── SWITCHER: child view shows a "managed by you" chip instead
                       of the placeholder email + plan badge ── */}
                  {isChildView ? (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs font-medium rounded-full border border-orange-300">
                      Child rider · managed by you
                    </span>
                  ) : (
                    <>
                      <p className="text-neutral-mid">{user.email}</p>
                      {premium ? (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full border border-amber-300">⭐ PREMIUM</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-neutral-100 text-neutral-500 text-xs font-medium rounded-full border border-neutral-300">FREE</span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              {(pendingCount ?? 0) > 0 && (
                <Link href="/strava/sync"
                  className="relative px-6 py-3 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg font-medium transition-all transform hover:scale-105 shadow-md">
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    Kudos! {pendingCount} Pending {pendingCount === 1 ? 'Activity' : 'Activities'}
                  </span>
                </Link>
              )}
              {!premium && !isChildView && (
                <Link href="/subscribe"
                  className="px-4 py-2 text-sm text-white bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg hover:shadow-md transition-all font-medium flex items-center gap-1.5">
                  ⭐ Upgrade to Premium
                </Link>
              )}
              <Link href="/rides" className="px-4 py-2 text-sm text-neutral-dark bg-white border-2 border-neutral-mid rounded-lg hover:border-brand-charcoal hover:shadow-md transition-all font-medium">Rides</Link>
              <Link href="/tips" className="px-4 py-2 text-sm text-neutral-dark bg-white border-2 border-neutral-mid rounded-lg hover:border-brand-charcoal hover:shadow-md transition-all font-medium">Tips</Link>
              <Link href="/settings" className="px-4 py-2 text-sm text-neutral-dark bg-white border-2 border-neutral-mid rounded-lg hover:border-brand-charcoal hover:shadow-md transition-all font-medium">Settings</Link>
              <Link href="/support" className="px-4 py-2 text-sm text-neutral-dark bg-white border-2 border-neutral-mid rounded-lg hover:border-brand-charcoal hover:shadow-md transition-all font-medium">Support</Link>
              <SignOutButton />
            </div>
          </div>

          {/* ── SWITCHER: rider row. Only renders if you manage at least one
               child, so ordinary riders never see it. "Me" and each child link
               back to this same dashboard with a ?rider= param. ── */}
          {children.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-neutral-mid uppercase tracking-wide mr-1">Viewing</span>
              <Link
                href="/dashboard"
                className={`px-4 py-2 text-sm rounded-full border-2 font-medium transition-all ${
                  !isChildView
                    ? "border-brand-charcoal bg-brand-charcoal text-white"
                    : "border-neutral-mid bg-white text-neutral-dark hover:border-brand-charcoal"
                }`}
              >
                Me
              </Link>
              {children.map((c) => (
                <Link
                  key={c.id}
                  href={`/dashboard?rider=${c.id}`}
                  className={`px-4 py-2 text-sm rounded-full border-2 font-medium transition-all ${
                    viewingRiderId === c.id
                      ? "border-orange-500 bg-orange-100 text-orange-800"
                      : "border-neutral-mid bg-white text-neutral-dark hover:border-orange-400"
                  }`}
                >
                  {c.firstName || "Rider"}
                </Link>
              ))}
              <Link
                href="/children/add"
                className="px-4 py-2 text-sm rounded-full border-2 border-dashed border-neutral-mid text-neutral-mid hover:border-brand-charcoal hover:text-brand-charcoal transition-all font-medium"
              >
                + Add child
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">

        {/* ── PENDING TRANSFERS BANNER ── */}
        {pendingTransfers && pendingTransfers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-medium text-brand-charcoal mb-4">
              🔔 Pending Bike Transfers
            </h2>
            <div className="space-y-4">
              {pendingTransfers.map((transfer: any) => {
                const payUrl = `${MBS_URL}/pay/transfer?email=${encodeURIComponent(user.email!)}&sale=${transfer.id}&redirect=bsb`;

                return (
                  <div
                    key={transfer.id}
                    className="bg-white rounded-xl shadow-lg border-2 border-amber-300 overflow-hidden"
                  >
                    <div className="bg-gradient-to-r from-amber-50 to-amber-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1">
                        <span className="text-amber-600 font-bold text-xs uppercase tracking-wide">Pending Transfer</span>
                        <p className="text-sm text-neutral-mid mt-1">
                          A bike has been transferred to you. Pay the once-off R99 transfer fee to add it to your garage, or decline if this was not intended for you.
                        </p>
                      </div>
                      <div className="flex gap-3 flex-shrink-0">
                        <a
                          href={payUrl}
                          className="px-6 py-3 bg-gradient-to-br from-brand-charcoal to-brand-steel text-white rounded-lg hover:shadow-lg transition-all font-semibold text-sm whitespace-nowrap"
                        >
                          Pay R99 Transfer Fee
                        </a>
                        <form method="POST" action="/api/transfers/decline">
                          <input type="hidden" name="transferId" value={transfer.id} />
                          <button
                            type="submit"
                            className="px-6 py-3 bg-white text-red-500 border-2 border-red-300 rounded-lg hover:bg-red-50 transition-all font-semibold text-sm whitespace-nowrap"
                          >
                            Decline
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {bikes && bikes.length > 0 ? (
          <div className="space-y-8">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <h2 className="text-2xl font-medium text-brand-charcoal">{bikes && bikes.length === 1 ? "Your Bike" : "Your Bikes"}</h2>
                {/* ── SWITCHER: child Strava-connected badge, surfaced up here so
                    the connection status is visible at a glance. ── */}
                {isChildView && stravaIntegration && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 rounded-full text-xs font-medium text-green-700">
                    <span className="text-green-600">✓</span>
                    {displayName}&rsquo;s Strava connected
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {bikes.map((bike) => {
                  const componentCount = bike.components?.length || 0;
                  const atComponentLimit = !premium && componentCount >= FREE_COMPONENT_LIMIT;
                  // ── SIMPLE KIDS VIEW: a no-Strava child's bike shows just hours
                  //    + the estimate editor, no component clocks. Strava kids and
                  //    your own bikes keep the full component view. ──
                  const simpleKidsView = isChildView && !stravaIntegration;
                  const lifetimeHrs = Number((usageByBike.get(bike.id) as any)?.total_hours || 0);

                  return (
                    <div key={bike.id} className="bg-white rounded-xl shadow-lg border border-neutral-mid overflow-hidden hover:shadow-xl transition-shadow">
                      {/* Bike Header */}
                      <div className="bg-gradient-to-br from-brand-charcoal to-brand-steel p-6 text-white">
                        {/* Top row: photo + name + menu */}
                        <div className="flex items-center gap-4">
                          {bike.profile_photo_url && (
                            <img src={bike.profile_photo_url} alt={bike.name} className="w-24 h-24 rounded-xl object-cover border-2 border-white shadow-lg flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-2xl font-medium truncate">{bike.name}</h3>
                              {bike.is_ebike && <span className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-lg shadow-sm flex-shrink-0">E-Bike</span>}
                            </div>
                            {bike.brand && bike.model && <p className="text-neutral-light">{bike.brand} {bike.model}</p>}

                            {/* Lifetime totals — the bike's own figure, distinct
                                from any component's. Components reset to zero on
                                service; this only grows, which is what makes it
                                the number that matters at resale. */}
                            {(() => {
                              const usage: any = usageByBike.get(bike.id);
                              if (!usage || (Number(usage.total_km) === 0 && Number(usage.total_hours) === 0)) return null;
                              return (
                                <p className="text-sm text-neutral-light/80 mt-1.5 flex items-center gap-1.5 flex-wrap">
                                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                  </svg>
                                  <span className="font-medium">{Number(usage.total_km).toLocaleString("en-GB", { maximumFractionDigits: 0 })} km</span>
                                  <span className="opacity-60">·</span>
                                  <span className="font-medium">{Number(usage.total_hours).toFixed(1)} hrs</span>
                                  <span className="opacity-60 text-xs">lifetime</span>
                                </p>
                              );
                            })()}
                          </div>
                          <BikeMenu
                            bikeId={bike.id}
                            bikeName={bike.name}
                            riderId={isChildView ? viewingRiderId : null}
                            sellHref={`/api/sell-handoff?next=${encodeURIComponent(`/sell?bikeId=${bike.id}`)}`}
                          />
                        </div>

                        {/* Log Ride button — full width below the photo/name row.
                            Shown for adults and for STRAVA kids (full component
                            view, adult behaviour: hours + km advance components).
                            Non-Strava kids use the hours-only control in the
                            simple card instead, so this is hidden for them. */}
                        {(!isChildView || stravaIntegration) && (
                          <div className="mt-4">
                            <LogRideButton
                              bikeId={bike.id}
                              bikeName={bike.name}
                              riderId={isChildView ? viewingRiderId : null}
                            />
                          </div>
                        )}
                      </div>

                      {/* Components */}
                      <div className="p-6">
                        {simpleKidsView ? (
                          // ── SIMPLE KIDS VIEW (no Strava) ──────────────────────
                          <div className="space-y-4">
                            <div className="p-5 bg-gradient-to-br from-orange-50 to-white border-2 border-orange-200 rounded-xl text-center">
                              <p className="text-sm text-neutral-mid mb-1">Estimated riding so far</p>
                              <p className="text-4xl font-semibold text-brand-charcoal">
                                {lifetimeHrs.toFixed(0)}<span className="text-lg text-neutral-mid font-medium"> hours</span>
                              </p>
                            </div>

                            <KidsEstimateEditor
                              bikeId={bike.id}
                              childName={displayName || "your child"}
                              initialHoursPerRide={Number((bike as any).estimated_hours_per_ride) || 2}
                              initialRidesPerWeek={Number((bike as any).estimated_rides_per_week) || 4}
                            />

                            <KidsLogRide
                              bikeId={bike.id}
                              childName={displayName || "your child"}
                              riderId={viewingRiderId}
                            />

                            <div className="p-4 bg-neutral-light border border-neutral-mid rounded-lg">
                              <p className="text-sm text-neutral-dark">
                                Kids&rsquo; bikes take a beating. It&rsquo;s worth a quick once-over now and then —
                                chain, brakes, tyres and bolts. We&rsquo;ll email you a monthly reminder based on
                                {" "}{displayName}&rsquo;s riding.
                              </p>
                              <Link href="/tips" className="inline-block mt-2 text-sm font-medium text-orange-700 underline underline-offset-2 hover:text-orange-800">
                                See the inspection & tips guide →
                              </Link>
                            </div>

                            <Link
                              href={`/book-service?bikeId=${bike.id}&rider=${viewingRiderId}`}
                              className="flex items-center justify-center gap-2 w-full px-4 py-3 text-center text-white bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg hover:shadow-lg transition-all font-medium"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Book a Service for {displayName}
                            </Link>

                            <KidsLogService
                              bikeId={bike.id}
                              childName={displayName || "your child"}
                            />

                            <KidsComponentManager
                              bikeId={bike.id}
                              childName={displayName || "your child"}
                              initialComponents={(bike.components || []).map((c: any) => ({
                                id: c.id, type: c.type, brand: c.brand ?? null, model: c.model ?? null,
                              }))}
                            />

                            {/* Graduation: connect Strava straight from the simple view. */}
                            <div className="pt-1">
                              <a
                                href={stravaAuthUrlChild}
                                className="flex items-center justify-center gap-2 w-full px-6 py-3 text-center bg-white border-2 border-orange-300 text-orange-700 rounded-lg hover:border-orange-500 hover:shadow-md transition-all font-medium"
                              >
                                <img src="/api_logo_pwrdBy_strava_horiz_orange.svg" alt="Strava" className="h-4 object-contain" />
                                Connect {displayName}&rsquo;s Strava
                              </a>
                              <p className="text-xs text-neutral-mid text-center mt-2">
                                Got a Strava account now? Connect it and {displayName}&rsquo;s real rides track automatically.
                              </p>
                            </div>
                          </div>
                        ) : (
                        <>
                        {bike.components && bike.components.length > 0 ? (
                          <div className="space-y-4 mb-6">
                            {bike.components.map((component: any) => {
                              const unit = component.tracking_unit || "hours";
                              const currentFull = unit === "km"
                                ? (component.current_km || 0)
                                : (component.current_hours || 0);
                              const currentLower = unit === "km"
                                ? (component.current_km || 0)
                                : (component.current_lower_hours || 0);
                              const secondaryValue = unit === "km"
                                ? (component.current_hours || 0)
                                : (component.current_km || 0);
                              const secondaryUnit = unit === "km" ? "hrs" : "km";

                              const getStatusEmoji = (status: string) => {
                                if (status === "red") return "🔴";
                                if (status === "amber") return "🟡";
                                return "🟢";
                              };

                              const getStatusLabel = (status: string) => {
                                if (status === "red") return "OVERDUE";
                                if (status === "amber") return "DUE SOON";
                                return "OK";
                              };

                              const calculatePct = (current: number, target: number) => {
                                if (!target || target === 0) return 0;
                                return Math.round((current / target) * 100);
                              };

                              return (
                                <div key={component.id} className="p-5 border-2 border-neutral-mid rounded-xl bg-gradient-to-br from-white to-neutral-light">
                                  <div className="mb-4">
                                    <div className="flex items-center justify-between mb-1">
                                      <h4 className="font-semibold text-brand-charcoal text-xl capitalize">
                                        {component.type.replace(/_/g, ' ')}
                                      </h4>
                                      {/* ── SWITCHER: Edit now works in child view via
                                          the rider-aware component edit page (?rider=). ── */}
                                      <Link href={isChildView ? `/components/${component.id}/edit?rider=${viewingRiderId}` : `/components/${component.id}/edit`}
                                        className="px-3 py-1.5 text-xs font-medium text-brand-charcoal bg-white border-2 border-brand-charcoal rounded-lg hover:bg-brand-charcoal hover:text-white transition-colors flex items-center gap-1">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit
                                      </Link>
                                    </div>
                                    {(component.brand || component.model) && (
                                      <p className="text-sm text-neutral-mid mt-1">{component.brand}{component.brand && component.model && ' '}{component.model}</p>
                                    )}
                                  </div>

                                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm font-medium text-blue-900">
                                      📊 Current Usage:{" "}
                                      <span className="text-lg font-bold">{currentFull.toFixed(2)} {unit}</span>
                                      {secondaryValue > 0 && (
                                        <span className="text-xs text-blue-600 ml-2 font-normal">
                                          · {secondaryValue.toFixed(1)} {secondaryUnit}
                                        </span>
                                      )}
                                    </p>
                                  </div>

                                  <div className="mb-3 p-4 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg">
                                    <h5 className="text-xs font-bold text-green-900 uppercase mb-3 tracking-wide">My Intervals</h5>
                                    <div className="space-y-2">
                                      {component.my_service_interval_lower && component.my_service_interval_lower > 0 && (
                                        <div className="flex items-center justify-between text-sm">
                                          <span className="font-medium text-green-900">Lower: {component.my_service_interval_lower} {unit}</span>
                                          <span className="flex items-center gap-2 font-bold text-green-900">
                                            {getStatusEmoji(component.my_lower_status || "green")}
                                            {getStatusLabel(component.my_lower_status || "green")}
                                            <span className="text-xs">({calculatePct(currentLower, component.my_service_interval_lower)}%)</span>
                                          </span>
                                        </div>
                                      )}
                                      {component.my_service_interval && (
                                        <div className="flex items-center justify-between text-sm">
                                          <span className="font-medium text-green-900">Full: {component.my_service_interval} {unit}</span>
                                          <span className="flex items-center gap-2 font-bold text-green-900">
                                            {getStatusEmoji(component.status || "green")}
                                            {getStatusLabel(component.status || "green")}
                                            <span className="text-xs">({calculatePct(currentFull, component.my_service_interval)}%)</span>
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {(component.oem_interval_lower || component.oem_interval_full) && (
                                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg">
                                      <h5 className="text-xs font-bold text-blue-900 uppercase mb-3 tracking-wide">OEM Recommended</h5>
                                      <div className="space-y-2">
                                        {component.oem_interval_lower && component.oem_interval_lower > 0 && (
                                          <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium text-blue-900">Lower: {component.oem_interval_lower} {unit}</span>
                                            <span className="flex items-center gap-2 font-bold text-blue-900">
                                              {getStatusEmoji(component.oem_lower_status || "green")}
                                              {getStatusLabel(component.oem_lower_status || "green")}
                                              <span className="text-xs">({calculatePct(currentLower, component.oem_interval_lower)}%)</span>
                                            </span>
                                          </div>
                                        )}
                                        {component.oem_interval_full && (
                                          <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium text-blue-900">Full: {component.oem_interval_full} {unit}</span>
                                            <span className="flex items-center gap-2 font-bold text-blue-900">
                                              {getStatusEmoji(component.oem_status || "green")}
                                              {getStatusLabel(component.oem_status || "green")}
                                              <span className="text-xs">({calculatePct(currentFull, component.oem_interval_full)}%)</span>
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <Link
                            href={`/bikes/${bike.id}/add-component`}
                            className="block text-center py-8 px-5 bg-gradient-to-br from-neutral-light to-white rounded-xl border-2 border-dashed border-neutral-mid mb-6 cursor-pointer hover:border-brand-charcoal hover:shadow-md transition-all"
                          >
                            <svg className="w-12 h-12 text-neutral-mid mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <p className="text-brand-charcoal font-semibold mb-1">Add your first component to start tracking wear</p>
                            <p className="text-sm text-neutral-mid max-w-md mx-auto">
                              Components are the parts that wear out — chain, brake pads, suspension, cassette. Add them with their service intervals, and BSB tracks usage and warns you before each is due. Connect Strava and your rides update them automatically.
                            </p>
                          </Link>
                        )}

                        {/* ── SWITCHER: action buttons act as the logged-in user,
                            so on a child's bike they'd target you, not the child.
                            Hidden in child view until the rider-aware routes land
                            (next step). A short note explains the state. ── */}
                        {isChildView ? (
                          <div className="space-y-3">
                            {/* Estimated-riding editor — only for a bike whose
                                rider has NO Strava (Strava kids get real rides,
                                so estimates don't apply). */}
                            {!stravaIntegration && (
                              <KidsEstimateEditor
                                bikeId={bike.id}
                                childName={displayName || "your child"}
                                initialHoursPerRide={Number((bike as any).estimated_hours_per_ride) || 2}
                                initialRidesPerWeek={Number((bike as any).estimated_rides_per_week) || 4}
                              />
                            )}
                            {/* Strava kid: real actions (Log Service + Book a
                                Service), rider-aware. Non-Strava kids never reach
                                this branch (they render the simple card). */}
                            <div className="flex flex-col sm:flex-row gap-3">
                              <Link
                                href={`/bikes/${bike.id}/log-service?rider=${viewingRiderId}`}
                                className="flex-1 px-4 py-3 text-center text-white bg-gradient-to-br from-brand-charcoal to-brand-steel rounded-lg hover:shadow-lg transition-all font-medium"
                              >
                                Log Service
                              </Link>
                              <Link
                                href={`/book-service?bikeId=${bike.id}&rider=${viewingRiderId}`}
                                className="flex-1 px-4 py-3 text-center text-white bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg hover:shadow-lg transition-all font-medium"
                              >
                                Book a Service
                              </Link>
                            </div>

                            {/* Add/remove parts on a Strava kid's bike — the
                                lightweight, rider-aware manager (silent template
                                intervals), not the adult power-user add page. */}
                            <KidsComponentManager
                              bikeId={bike.id}
                              childName={displayName || "your child"}
                              initialComponents={(bike.components || []).map((c: any) => ({
                                id: c.id, type: c.type, brand: c.brand ?? null, model: c.model ?? null,
                              }))}
                            />
                          </div>
                        ) : (
                          <>
                            {/* Action Buttons Row 1 */}
                            <div className="flex gap-3 mb-3">
                              {atComponentLimit ? (
                                <Link href="/subscribe"
                                  className="flex-1 px-4 py-3 text-center text-amber-700 bg-amber-50 border-2 border-amber-300 rounded-lg hover:bg-amber-100 transition-all font-medium flex items-center justify-center gap-1.5">
                                  🔒 Add Component
                                </Link>
                              ) : (
                                <Link href={`/bikes/${bike.id}/add-component`}
                                  className="flex-1 px-4 py-3 text-center text-neutral-dark bg-white border-2 border-neutral-mid rounded-lg hover:border-brand-charcoal hover:shadow-md transition-all font-medium">
                                  Add Component
                                </Link>
                              )}
                              <Link href={`/bikes/${bike.id}/log-service`}
                                className="flex-1 px-4 py-3 text-center text-white bg-gradient-to-br from-brand-charcoal to-brand-steel rounded-lg hover:shadow-lg transition-all font-medium">
                                Log Service
                              </Link>
                            </div>

                            {/* Book a Service — same button for everyone. Free users
                                tap through to /book-service, which shows its own
                                upgrade screen. The paywall appears on intent, not as
                                an ambient lock on the dashboard. */}
                            <Link href={`/book-service?bikeId=${bike.id}`}
                              className="flex items-center justify-center gap-2 w-full px-4 py-3 text-center text-white bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg hover:shadow-lg transition-all font-medium">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Book a Service
                            </Link>
                          </>
                        )}
                        </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add Another Bike — same button for everyone. Free users tap
                through to /bikes/new, which enforces the 1-bike limit and shows
                the upgrade prompt. Enforcement lives on that page (and server-
                side), NOT as a visible lock here.
                ── SWITCHER: hidden on a child view — adding a child's bike needs
                the rider-aware routes (next phase). ── */}
            {!isChildView ? (
              <div className="text-center">
                <Link href="/bikes/new"
                  className="inline-flex items-center gap-2 px-8 py-3 text-neutral-dark bg-white border-2 border-neutral-mid rounded-lg hover:border-brand-charcoal hover:shadow-md transition-all font-medium">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Another Bike
                </Link>
              </div>
            ) : (
              // ── SWITCHER: child view gets its own add-bike, routed through the
              //    rider-aware form so the new bike belongs to the child. ──
              <div className="text-center">
                <Link href={`/bikes/new?rider=${viewingRiderId}&name=${encodeURIComponent(displayName || "")}`}
                  className="inline-flex items-center gap-2 px-8 py-3 text-orange-700 bg-white border-2 border-orange-300 rounded-lg hover:border-orange-500 hover:shadow-md transition-all font-medium">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Another Bike for {displayName}
                </Link>
              </div>
            )}

            {/* Strava Integration
                ── SWITCHER: hidden on a child view. Connecting Strava here would
                attach it to the logged-in PARENT's session, not the child — that
                belongs in the child's own connect flow (next phase). ── */}
            {!isChildView && (
            <div className="bg-white rounded-xl shadow-lg border border-neutral-mid p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h3 className="text-2xl font-medium text-brand-charcoal">Strava Integration</h3>
                <img src="/api_logo_pwrdBy_strava_horiz_orange.svg" alt="Powered by Strava" className="h-6 sm:h-7 max-w-[180px] object-contain" />
              </div>
              {/* ── CONNECTED-STATE BLOCK MOVED TO /rides (21 Jul 2026) ──────
                  Sync, gear links and connection status are ride-data machinery
                  and now live beside the rides, at the foot of /rides. What is
                  left here is ONLY the not-yet-connected pitch.

                  That half stays deliberately. It is the top of the Strava
                  funnel — the benefits, StravaConnectButton, and the
                  StravaPromptTracker that records the rider actually saw it. A
                  rider who has not connected Strava has no rides, so would never
                  open /rides to find it. Moving this half too would quietly kill
                  the conversion path, and the funnel data would read as
                  disinterest rather than a missing prompt.

                  Connected riders see this card disappear entirely and find
                  everything under Rides. */}
              {!stravaIntegration && (
                <div>
                  {/* Logs that this not-yet-connected rider actually SAW the
                      prompt — the top of the funnel. Renders nothing. */}
                  <StravaPromptTracker source="dashboard" />
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-lg p-6 mb-6">
                    <h4 className="font-medium text-brand-charcoal mb-2">Auto-sync Your Rides</h4>
                    <p className="text-neutral-mid text-sm mb-4">Connect your Strava account to automatically track riding hours and update component service intervals.</p>
                    <ul className="space-y-2 text-sm text-neutral-dark">
                      {["Automatic activity import", "Real-time component hour tracking", "No manual logging required"].map((item, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-orange-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <StravaConnectButton
                    stravaAuthUrl={stravaAuthUrl}
                    source="dashboard"
                    className="block w-full px-6 py-4 text-center bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold text-lg"
                  >
                    Connect Strava
                  </StravaConnectButton>
                </div>
              )}
            </div>
            )}
          </div>
        ) : (
          // ── SWITCHER: two different empty states ──
          isChildView ? (
            // Child has no bikes yet — this is now the entry point to add one,
            // routed through the rider-aware form (?rider=&name=).
            <div className="max-w-2xl mx-auto">
              <div className="bg-orange-50/60 rounded-xl shadow-xl border border-orange-200 p-12 text-center">
                <div className="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h2 className="text-3xl font-medium text-brand-charcoal mb-3">Add {displayName}&rsquo;s bike</h2>
                <p className="text-neutral-mid text-lg mb-8">
                  Set up {displayName}&rsquo;s bike to start tracking its components and service intervals.
                </p>
                <Link
                  href={`/bikes/new?rider=${viewingRiderId}&name=${encodeURIComponent(displayName || "")}`}
                  className="inline-block px-10 py-4 text-white bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg hover:shadow-xl transition-all font-medium text-lg"
                >
                  Add {displayName}&rsquo;s Bike
                </Link>

                {/* ── SWITCHER: Strava is reachable here too, before a bike — a
                    parent often wants to connect the kid's Strava while setting
                    them up. Same guarded child connect link. ── */}
                {!stravaIntegration && (
                  <div className="mt-6 pt-6 border-t border-orange-200">
                    <p className="text-sm text-neutral-mid mb-3">
                      Or, if {displayName} has their own Strava account:
                    </p>
                    <a
                      href={stravaAuthUrlChild}
                      className="inline-block px-8 py-3 text-orange-700 bg-white border-2 border-orange-300 rounded-lg hover:border-orange-500 hover:shadow-md transition-all font-medium"
                    >
                      Connect {displayName}&rsquo;s Strava
                    </a>
                  </div>
                )}

                <div className="mt-4">
                  <Link href="/dashboard" className="text-sm text-neutral-mid hover:text-brand-charcoal transition-colors">
                    ← Back to my bikes
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-xl shadow-xl border border-neutral-mid p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-brand-charcoal to-brand-steel rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h2 className="text-3xl font-medium text-brand-charcoal mb-3">Start Your Service Book</h2>
                <p className="text-neutral-mid text-lg mb-8">Add your first bike to begin tracking maintenance and service intervals</p>
                <Link href="/bikes/new" className="inline-block px-10 py-4 text-white bg-gradient-to-br from-brand-charcoal to-brand-steel rounded-lg hover:shadow-xl transition-all font-medium text-lg">
                  Add Your First Bike
                </Link>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
