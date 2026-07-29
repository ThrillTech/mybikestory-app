"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import MbsHeader from "@/components/mbs-header";
import { formatPrice, calculateCommission } from "@/lib/mbs-pricing";
import Link from "next/link";

type Listing = {
  id: string;
  title: string;
  price: number;
  status: string;
  location: string;
  views: number;
  has_bsb_history: boolean;
  bike_id: string | null;
  created_at: string;
};

type SoldModalState = {
  listing: Listing;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  isSubmitting: boolean;
  error: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [justListed, setJustListed] = useState(false);
  const [paymentBanner, setPaymentBanner] = useState<"success" | "failed" | "">("");
  const [soldModal, setSoldModal] = useState<SoldModalState | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("listed") === "true") setJustListed(true);
    const payment = params.get("payment");
    if (payment === "success") setPaymentBanner("success");
    if (payment === "failed") setPaymentBanner("failed");

    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      setUserEmail(user.email || "");
      setUserId(user.id);

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

  const openSoldModal = (listing: Listing) => {
    setSoldModal({
      listing,
      buyerName: "",
      buyerEmail: "",
      buyerPhone: "",
      isSubmitting: false,
      error: "",
    });
  };

  const handleSoldSubmit = async () => {
    if (!soldModal) return;
    const { listing, buyerName, buyerEmail, buyerPhone } = soldModal;

    if (!buyerName.trim() || !buyerEmail.trim()) {
      setSoldModal({ ...soldModal, error: "Buyer name and email are required." });
      return;
    }

    setSoldModal({ ...soldModal, isSubmitting: true, error: "" });

    const supabase = createClient();
    const commission = calculateCommission(listing.price / 100);

    // 1. Mark listing as sold
    await supabase
      .from("listings")
      .update({ status: "sold" })
      .eq("id", listing.id);

    // 2. Create sale record
    const { data: sale, error: saleError } = await supabase
      .from("mbs_sales")
      .insert({
        listing_id: listing.id,
        seller_id: userId,
        buyer_name: buyerName.trim(),
        buyer_email: buyerEmail.trim().toLowerCase(),
        buyer_phone: buyerPhone.trim(),
        sale_price: listing.price,
        commission_rate: commission.ratePercent,
        commission_amount: Math.round(commission.commissionRands * 100),
        status: "pending",
      })
      .select()
      .single();

    if (saleError || !sale) {
      setSoldModal({ ...soldModal, isSubmitting: false, error: "Failed to record sale. Please try again." });
      return;
    }

    // 3. Create bike ownership record (if Bike Service Book linked)
    if (listing.bike_id) {
      await supabase
        .from("bike_ownership")
        .insert({
          bike_id: listing.bike_id,
          owner_email: buyerEmail.trim().toLowerCase(),
          sale_id: sale.id,
          transfer_fee_paid: false,
        });
    }

    // 4. Send emails via API route
    await fetch("/api/sold-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        saleId: sale.id,
        listingTitle: listing.title,
        salePrice: listing.price,
        commissionRate: commission.ratePercent,
        commissionAmount: commission.commissionRands,
        sellerEmail: userEmail,
        buyerName,
        buyerEmail: buyerEmail.trim().toLowerCase(),
        buyerPhone,
        hasBsbHistory: listing.has_bsb_history,
      }),
    });

    // 5. Update local state
    setListings((prev) =>
      prev.map((l) => (l.id === listing.id ? { ...l, status: "sold" } : l))
    );
    setSoldModal(null);
  };

  const handleRevertToAvailable = async (listingId: string) => {
    if (!confirm("Revert this listing back to available? This will cancel the recorded sale.")) return;
    const supabase = createClient();

    await supabase
      .from("listings")
      .update({ status: "active" })
      .eq("id", listingId);

    await supabase
      .from("mbs_sales")
      .update({ status: "cancelled" })
      .eq("listing_id", listingId)
      .eq("status", "pending");

    setListings((prev) =>
      prev.map((l) => (l.id === listingId ? { ...l, status: "active" } : l))
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

        {/* Listing success banner */}
        {justListed && (
          <div
            className="rounded-xl p-4 mb-6 text-sm font-medium"
            style={{ backgroundColor: "#EBF5FF", color: "#2376BE" }}
          >
            ✓ Your listing is live! Buyers can now find your bike on MyBikeStory.
          </div>
        )}

        {/* Payment banners */}
        {paymentBanner === "success" && (
          <div className="rounded-xl p-4 mb-6 text-sm font-medium bg-green-50 text-green-700 border border-green-200">
            ✅ Commission payment received! The buyer can now claim their Bike Service Book history.
          </div>
        )}
        {paymentBanner === "failed" && (
          <div className="rounded-xl p-4 mb-6 text-sm font-medium bg-red-50 text-red-600 border border-red-200">
            ❌ Payment was not completed. Please try again from your sold listings.
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
                        ✓ Bike Service Book
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
                    href={"/listings/" + listing.id}
                    className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-300 rounded-lg"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => openSoldModal(listing)}
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRevertToAvailable(listing.id)}
                        className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-300 rounded-lg"
                      >
                        Revert to Available
                      </button>
                      <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
                        Sold
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* ===================== MARK AS SOLD MODAL ===================== */}
      {soldModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">

            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Mark as Sold
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              {soldModal.listing.title}
            </p>

            {/* Commission summary */}
            <div
              className="rounded-xl p-4 mb-5 text-sm"
              style={{ backgroundColor: "#EBF5FF" }}
            >
              {(() => {
                const c = calculateCommission(soldModal.listing.price / 100);
                return (
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sale price (paid directly by buyer to you)</span>
                      <span className="font-semibold">{formatPrice(soldModal.listing.price)}</span>
                    </div>
                    <div className="flex justify-between border-t border-blue-200 pt-2 mt-1">
                      <span className="font-semibold text-gray-700">Commission owed to MyBikeStory ({c.ratePercent})</span>
                      <span className="font-bold text-red-500">
                        R{c.commissionRands.toLocaleString("en-ZA")}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Buyer details form */}
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Buyer Full Name *
                </label>
                <input
                  type="text"
                  value={soldModal.buyerName}
                  onChange={(e) => setSoldModal({ ...soldModal, buyerName: e.target.value })}
                  placeholder="John Smith"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Buyer Email Address *
                </label>
                <input
                  type="email"
                  value={soldModal.buyerEmail}
                  onChange={(e) => setSoldModal({ ...soldModal, buyerEmail: e.target.value })}
                  placeholder="buyer@email.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Buyer Phone Number
                </label>
                <input
                  type="tel"
                  value={soldModal.buyerPhone}
                  onChange={(e) => setSoldModal({ ...soldModal, buyerPhone: e.target.value })}
                  placeholder="082 123 4567"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Info box */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 mb-5">
              <p className="font-semibold mb-1">What happens next:</p>
              <p>• You will receive a commission invoice from MyBikeStory via email with a Paystack payment link.</p>
              <p>• The buyer pays you directly. They will receive an email with instructions to claim the Bike Service Book history.</p>
              <p>• Bike Service Book history transfers once the commission invoice is paid to MyBikeStory and the buyer pays the R99 transfer fee.</p>
            </div>

            {/* Error */}
            {soldModal.error && (
              <p className="text-red-500 text-xs mb-4">{soldModal.error}</p>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setSoldModal(null)}
                disabled={soldModal.isSubmitting}
                className="flex-1 text-sm text-gray-600 px-4 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSoldSubmit}
                disabled={soldModal.isSubmitting}
                className="flex-1 text-sm text-white px-4 py-2.5 rounded-lg font-semibold"
                style={{ backgroundColor: "#AA9F47" }}
              >
                {soldModal.isSubmitting ? "Processing..." : "Confirm Sale"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
