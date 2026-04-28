import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/mbs-pricing";
import Link from "next/link";
import { Suspense } from "react";
import MbsHeader from "@/components/mbs-header";
import MbsFooter from "@/components/mbs-footer";
import { CATEGORIES, FRAME_SIZES, WHEEL_SIZES, FRAME_MATERIALS } from "@/lib/bike-specs";

async function ListingsGrid({
  verified, search, category, frame_size, wheel_size, frame_material, condition,
}: {
  verified?: string; search?: string; category?: string;
  frame_size?: string; wheel_size?: string; frame_material?: string; condition?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (verified === "true") query = query.eq("has_bsb_history", true);
  if (search) query = query.ilike("title", "%" + search + "%");
  if (category) query = query.eq("category", category);
  if (frame_size) query = query.eq("frame_size", frame_size);
  if (wheel_size) query = query.eq("wheel_size", wheel_size);
  if (frame_material) query = query.eq("frame_material", frame_material);
  if (condition) query = query.eq("condition", condition);

  const { data: listings, error } = await query;

  if (error) return <p className="text-red-500 text-sm">Failed to load listings. Please try again.</p>;

  if (!listings || listings.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">🚲</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No bikes found</h2>
        <p className="text-gray-500 mb-6">Try adjusting your filters or be the first to list.</p>
        <Link href="/sell" className="text-white px-6 py-3 rounded-lg font-semibold transition-colors" style={{ backgroundColor: "#2376BE" }}>
          List Your Bike
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map((listing) => (
        <Link key={listing.id} href={"/listings/" + listing.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
          <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
            {listing.images && listing.images.length > 0 ? (
              <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
            ) : (
              <span className="text-5xl">🚲</span>
            )}
          </div>
          <div className="p-4">
            {listing.has_bsb_history && (
              <span className="inline-flex items-center gap-1 text-white text-xs font-semibold px-2 py-1 rounded-full mb-2" style={{ backgroundColor: "#AA9F47" }}>
                ✓ Bike Service Book Verified
              </span>
            )}
            <h3 className="font-semibold text-gray-900 mb-1">{listing.title}</h3>
            <div className="flex flex-wrap gap-1 mb-2">
              {listing.category && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{listing.category}</span>}
              {listing.frame_size && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Size {listing.frame_size}</span>}
              {listing.condition && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{listing.condition}</span>}
            </div>
            <p className="text-gray-500 text-sm mb-3 line-clamp-2">{listing.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold" style={{ color: "#2376BE" }}>{formatPrice(listing.price)}</span>
              {listing.location && <span className="text-xs text-gray-400">📍 {listing.location}</span>}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// Each filter is its own mini-form so selecting triggers a GET navigation with no JS handlers
function FilterSelect({
  label, name, value, options, placeholder, preservedParams,
}: {
  label: string; name: string; value: string;
  options: string[]; placeholder: string;
  preservedParams: Record<string, string | undefined>;
}) {
  return (
    <form method="GET" action="/listings">
      {/* Preserve all other active params */}
      {Object.entries(preservedParams).map(([k, v]) =>
        v ? <input key={k} type="hidden" name={k} value={v} /> : null
      )}
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <select
        name={name}
        defaultValue={value}
        onChange={undefined}
        className="w-full border border-gray-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#2376BE] bg-white"
        // Use native form submit on change via autosubmit button trick below
      >
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {/* Hidden submit — user must click Apply. Keeps it server-safe */}
      <button type="submit" className="mt-1 w-full text-xs text-white py-1 rounded" style={{ backgroundColor: "#2376BE" }}>Apply</button>
    </form>
  );
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    verified?: string; search?: string; category?: string;
    frame_size?: string; wheel_size?: string; frame_material?: string; condition?: string;
  }>;
}) {
  const params = await searchParams;
  const hasFilters = !!(params.category || params.frame_size || params.wheel_size || params.frame_material || params.condition);

  // Helper: build a URL removing one filter
  const without = (key: string) => {
    const entries = Object.entries(params).filter(([k, v]) => k !== key && v);
    const qs = entries.map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join("&");
    return qs ? "/listings?" + qs : "/listings";
  };

  // Params to preserve in each filter form (everything except the filter being set)
  const baseParams = (exclude: string) =>
    Object.fromEntries(Object.entries(params).filter(([k]) => k !== exclude)) as Record<string, string | undefined>;

  return (
    <main className="min-h-screen bg-gray-50">
      <MbsHeader />

      <div className="max-w-6xl mx-auto px-5 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Browse Bikes</h1>
          <div className="flex items-center gap-3">
            <Link
              href={without("verified")}
              className={"text-sm px-4 py-2 rounded-full border font-medium transition-colors " + (!params.verified ? "text-white border-[#2376BE]" : "bg-white text-gray-600 border-gray-300 hover:border-[#2376BE]")}
              style={!params.verified ? { backgroundColor: "#2376BE" } : {}}
            >
              All Bikes
            </Link>
            <Link
              href={params.verified === "true" ? without("verified") : "/listings?" + new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter(([,v]) => v)) as Record<string,string>, verified: "true" }).toString()}
              className={"text-sm px-4 py-2 rounded-full border font-medium flex items-center gap-1 transition-colors " + (params.verified === "true" ? "text-white border-[#AA9F47]" : "bg-white text-gray-600 border-gray-300 hover:border-[#AA9F47]")}
              style={params.verified === "true" ? { backgroundColor: "#AA9F47" } : {}}
            >
              ✓ BSB Verified
            </Link>
          </div>
        </div>

        {/* Search */}
        <form method="GET" action="/listings" className="mb-6">
          {params.verified && <input type="hidden" name="verified" value="true" />}
          {params.category && <input type="hidden" name="category" value={params.category} />}
          {params.frame_size && <input type="hidden" name="frame_size" value={params.frame_size} />}
          {params.wheel_size && <input type="hidden" name="wheel_size" value={params.wheel_size} />}
          {params.frame_material && <input type="hidden" name="frame_material" value={params.frame_material} />}
          {params.condition && <input type="hidden" name="condition" value={params.condition} />}
          <div className="flex gap-2">
            <input
              type="text" name="search" defaultValue={params.search}
              placeholder="Search by brand, model..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2376BE]"
            />
            <button type="submit" className="text-white px-6 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: "#2376BE" }}>
              Search
            </button>
          </div>
        </form>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Filter</h2>
            {hasFilters && (
              <Link href={params.verified ? "/listings?verified=true" : "/listings"} className="text-xs font-medium" style={{ color: "#2376BE" }}>
                Clear filters
              </Link>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <FilterSelect
              label="Category" name="category" value={params.category || ""}
              options={Object.keys(CATEGORIES)} placeholder="All categories"
              preservedParams={baseParams("category")}
            />
            <FilterSelect
              label="Condition" name="condition" value={params.condition || ""}
              options={["New", "Excellent", "Good", "Fair"]} placeholder="Any condition"
              preservedParams={baseParams("condition")}
            />
            <FilterSelect
              label="Frame Size" name="frame_size" value={params.frame_size || ""}
              options={FRAME_SIZES.filter(s => s !== "Not sure")} placeholder="Any size"
              preservedParams={baseParams("frame_size")}
            />
            <FilterSelect
              label="Wheel Size" name="wheel_size" value={params.wheel_size || ""}
              options={WHEEL_SIZES.filter(s => s !== "Not sure")} placeholder="Any wheel"
              preservedParams={baseParams("wheel_size")}
            />
            <FilterSelect
              label="Frame Material" name="frame_material" value={params.frame_material || ""}
              options={FRAME_MATERIALS.filter(s => s !== "Not sure")} placeholder="Any material"
              preservedParams={baseParams("frame_material")}
            />
          </div>

          {/* Active filter chips */}
          {hasFilters && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
              {params.category && (
                <Link href={without("category")} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
                  {params.category} ✕
                </Link>
              )}
              {params.condition && (
                <Link href={without("condition")} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
                  {params.condition} ✕
                </Link>
              )}
              {params.frame_size && (
                <Link href={without("frame_size")} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
                  Size {params.frame_size} ✕
                </Link>
              )}
              {params.wheel_size && (
                <Link href={without("wheel_size")} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
                  {params.wheel_size} ✕
                </Link>
              )}
              {params.frame_material && (
                <Link href={without("frame_material")} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
                  {params.frame_material} ✕
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Listings grid */}
        <Suspense fallback={<div className="text-center py-20 text-gray-400">Loading bikes...</div>}>
          <ListingsGrid
            verified={params.verified} search={params.search}
            category={params.category} frame_size={params.frame_size}
            wheel_size={params.wheel_size} frame_material={params.frame_material}
            condition={params.condition}
          />
        </Suspense>
      </div>
      <MbsFooter />
    </main>
  );
}
