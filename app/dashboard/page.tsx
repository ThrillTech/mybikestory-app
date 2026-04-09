"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import MbsHeader from "@/components/mbs-header";
import { formatPrice } from "@/lib/mbs-pricing";
import Link from "next/link";

type Listing = {
  id: string;
  title: string;
  price: number;
  status: string;
  location: string;
  views: number;
  has_bsb_history: boolean;
  created_at: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [justListed, setJustListed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("listed") === "true") setJustListed(true);

    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      setUserEmail(user.email || "");

      const { data } = await supabase
        .from("listings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setListings(data || []);
      setIsLoading(false);
    }

    load();
  }, [router]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleMarkSold = async (listingId: string) => {
    const supabase = createClient();
    await supabase
      .from("listings")
      .update({ status: "sold" })
      .eq("id", listingId);
    setListings((prev) =>
      prev.map((l) => (l.id === listingId ? { ...l, status: "sold" } : l))
    );
  };

  const handleDelete = async (listingId: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    const supabase = createClient();
    await supabase.from("listings").delete().eq("id", listingId);
    setListings((prev) => prev.filter((l) => l.id !== listingId));
  };

  const activeListings = listings.filter((l) => l.status === "active");
  const soldListings = listings.filter((l) => l.status === "sold");

  return (
    <main className="min-h-screen bg-gray-50">
      <MbsHeader />

      <div className="max-w-4xl mx-auto px-5 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
            <p className="text-sm text-gray-500">{userEmail}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/sell"
              className="text-sm text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              style={{ backgroundColor: "#2376BE" }}
            >
              + New Listing
            </Link>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg border border-gray-300"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Success banner */}
        {justListed && (
          <div
            className="rounded-xl p-4 mb-6 text-sm font-medium"
            style={{ backgroundColor: "#EBF5FF", color: "#2376BE" }}
          >
            ✓ Your listing is live! Buyers can now find your bike on MyBikeStory.
          </div>
        )}

        {isLoading && (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        )}

        {!isLoading && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-2xl font-bold" style={{ color: "#2376BE" }}>
                  {activeListings.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Active Listings</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {soldListings.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Bikes Sold</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {listings.reduce((sum, l) => sum + (l.views || 0), 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total Views</p>
              </div>
            </div>

            {/* Active listings */}
            <h2 className="font-bold text-gray-900 mb-4">Active Listings</h2>

            {activeListings.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center mb-6">
                <div className="text-4xl mb-3">🚲</div>
                <p className="text-gray-500 text-sm mb-4">
                  You have no active listings yet.
                </p>
                <Link
                  href="/sell"
                  className="text-sm text-white px-6 py-2 rounded-lg font-semibold"
                  style={{ backgroundColor: "#2376BE" }}
                >
                  List Your First Bike
                </Link>
              </div>
            )}

            {activeListings.map((listing) => (
              <div
                key={listing.id}
                className="bg-white rounded-xl border border-gray-200 p-4 mb-3 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {listing.title}
                    </h3>
                    {listing.has_bsb_history && (
                      <span
                        className="text-white text-xs px-2 py-0.5 rounded-full shrink-0"
                        style={{ backgroundColor: "#AA9F47" }}
                      >
                        ✓ BSB
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold" style={{ color: "#2376BE" }}>
                    {formatPrice(listing.price)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {listing.views || 0} views · {listing.location}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/listings/${listing.id}`}
                    className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-300 rounded-lg"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleMarkSold(listing.id)}
                    className="text-xs text-white px-3 py-1.5 rounded-lg"
                    style={{ backgroundColor: "#AA9F47" }}
                  >
                    Mark Sold
                  </button>
                  <button
                    onClick={() => handleDelete(listing.id)}
                    className="text-xs text-red-500 hover:text-red-700 px-3 py-1.5 border border-red-200 rounded-lg"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {/* Sold listings */}
            {soldListings.length > 0 && (
              <>
                <h2 className="font-bold text-gray-900 mb-4 mt-8">
                  Sold Bikes
                </h2>
                {soldListings.map((listing) => (
                  <div
                    key={listing.id}
                    className="bg-white rounded-xl border border-gray-200 p-4 mb-3 flex items-center justify-between gap-4 opacity-60"
                  >
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {listing.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatPrice(listing.price)} · Sold
                      </p>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
                      Sold
                    </span>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
