import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/mbs-pricing";
import Link from "next/link";

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string; search?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (params.verified === "true") {
    query = query.eq("has_bsb_history", true);
  }

  if (params.search) {
    query = query.ilike("title", `%${params.search}%`);
  }

  const { data: listings, error } = await query;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="w-full border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">🚲</span>
              <span className="font-bold text-xl text-gray-900">MyBikeStory</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/sell"
              className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Sell Your Bike
            </Link>
            <Link
              href="/auth/sign-in"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 py-8">
        {/* Page title + filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Browse Bikes</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/listings"
              className={`text-sm px-4 py-2 rounded-full border ${
                !params.verified
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-300 hover:border-gray-900"
              }`}
            >
              All Bikes
            </Link>
            <Link
              href="/listings?verified=true"
              className={`text-sm px-4 py-2 rounded-full border flex items-center gap-1 ${
                params.verified === "true"
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-gray-600 border-gray-300 hover:border-green-600"
              }`}
            >
              ✓ BSB Verified
            </Link>
          </div>
        </div>

        {/* Search */}
        <form method="GET" action="/listings" className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              name="search"
              defaultValue={params.search}
              placeholder="Search by brand, model..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {params.verified && (
              <input type="hidden" name="verified" value="true" />
            )}
            <button
              type="submit"
              className="bg-gray-900 text-white px-6 py-2 rounded-lg text-sm hover:bg-gray-700"
            >
              Search
            </button>
          </div>
        </form>

        {/* Listings grid */}
        {error && (
          <p className="text-red-500 text-sm">
            Failed to load listings. Please try again.
          </p>
        )}

        {!error && listings && listings.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🚲</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              No bikes listed yet
            </h2>
            <p className="text-gray-500 mb-6">
              Be the first to list your bike for sale.
            </p>
            <Link
              href="/sell"
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700"
            >
              List Your Bike
            </Link>
          </div>
        )}

        {!error && listings && listings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Placeholder image */}
                <div className="h-48 bg-gray-100 flex items-center justify-center">
                  <span className="text-5xl">🚲</span>
                </div>

                <div className="p-4">
                  {listing.has_bsb_history && (
                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full mb-2">
                      ✓ BSB Verified
                    </span>
                  )}
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {listing.title}
                  </h3>
                  <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                    {listing.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-gray-900">
                      {formatPrice(listing.price)}
                    </span>
                    {listing.location && (
                      <span className="text-xs text-gray-400">
                        📍 {listing.location}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
