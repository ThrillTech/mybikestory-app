import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/mbs-pricing";
import MbsHeader from "@/components/mbs-header";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: listing, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .eq("status", "active")
    .single();

  if (error || !listing) {
    notFound();
  }

  // Increment view count
  await supabase
    .from("listings")
    .update({ views: (listing.views || 0) + 1 })
    .eq("id", id);

  return (
    <main className="min-h-screen bg-gray-50">
      <MbsHeader />

      <div className="max-w-4xl mx-auto px-5 py-8">
        {/* Back link */}
        <Link
          href="/listings"
          className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-flex items-center gap-1"
        >
          ← Back to listings
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          {/* Left — main content */}
          <div className="md:col-span-2 space-y-4">
            {/* Image placeholder */}
            <div className="bg-white rounded-xl border border-gray-200 h-72 flex items-center justify-center">
              <span className="text-8xl">🚲</span>
            </div>

            {/* Title + price */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h1 className="text-xl font-bold text-gray-900">
                  {listing.title}
                </h1>
                {listing.has_bsb_history && (
                  <span
                    className="inline-flex items-center gap-1 text-white text-xs font-semibold px-3 py-1 rounded-full shrink-0"
                    style={{ backgroundColor: "#AA9F47" }}
                  >
                    ✓ BSB Verified
                  </span>
                )}
              </div>

              <p
                className="text-3xl font-bold mb-4"
                style={{ color: "#2376BE" }}
              >
                {formatPrice(listing.price)}
              </p>

              {listing.location && (
                <p className="text-sm text-gray-500 mb-4">
                  📍 {listing.location}
                </p>
              )}

              <div className="border-t border-gray-100 pt-4">
                <h2 className="font-semibold text-gray-900 mb-2">
                  Description
                </h2>
                <p className="text-gray-600 text-sm whitespace-pre-line">
                  {listing.description}
                </p>
              </div>
            </div>

            {/* BSB Verified info */}
            {listing.has_bsb_history && (
              <div
                className="rounded-xl p-4"
                style={{ backgroundColor: "#EBF5FF" }}
              >
                <p
                  className="font-semibold text-sm mb-1"
                  style={{ color: "#2376BE" }}
                >
                  ✓ This bike has a verified BSB service history
                </p>
                <p className="text-xs text-gray-600">
                  When you buy this bike, pay R99 to claim the full service
                  history into your Bike Service Book account.
                </p>
              </div>
            )}
          </div>

          {/* Right — contact card */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-4">
              <h2 className="font-semibold text-gray-900 mb-4">
                Contact Seller
              </h2>

              <p className="text-xs text-gray-500 mb-4">
                Arrange viewing and payment directly with the seller. MyBikeStory
                does not handle payments.
              </p>

              {listing.contact_email && (
                <a
                  href={`mailto:${listing.contact_email}?subject=Enquiry: ${listing.title}`}
                  className="w-full text-white py-3 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 mb-3"
                  style={{ backgroundColor: "#2376BE" }}
                >
                  ✉️ Email Seller
                </a>
              )}

              {listing.contact_phone && (
                <a
                  href={`tel:${listing.contact_phone}`}
                  className="w-full py-3 rounded-lg font-semibold text-sm border-2 transition-colors flex items-center justify-center gap-2"
                  style={{ borderColor: "#2376BE", color: "#2376BE" }}
                >
                  📞 {listing.contact_phone}
                </a>
              )}

              <div className="border-t border-gray-100 mt-4 pt-4">
                <p className="text-xs text-gray-400 text-center">
                  {listing.views || 0} views
                </p>
              </div>
            </div>

            {/* Transfer fee info */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p
                className="text-xs font-semibold mb-1"
                style={{ color: "#AA9F47" }}
              >
                Ownership Transfer — R99
              </p>
              <p className="text-xs text-gray-500">
                Once you&apos;ve bought this bike, pay R99 to officially transfer
                the service history into your BSB account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
