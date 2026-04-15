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
    .from("listings").select("*").eq("id", id).eq("status", "active").single();

  if (error || !listing) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user?.id === listing.user_id;

  await supabase.from("listings").update({ views: (listing.views || 0) + 1 }).eq("id", id);

  let bsbBike = null;
  let serviceEvents: any[] = [];
  let components: any[] = [];

  if (listing.bike_id) {
    const { data: bikeData } = await supabase
      .from("bikes").select("id, brand, model, year, condition, serial_number, is_ebike")
      .eq("id", listing.bike_id).single();
    bsbBike = bikeData;

    const { data: eventsData } = await supabase
      .from("service_events").select("id, service_date, service_type, description, cost")
      .eq("bike_id", listing.bike_id).not("service_type", "ilike", "edit")
      .order("service_date", { ascending: false }).limit(10);
    serviceEvents = eventsData || [];

    const { data: componentsData } = await supabase
      .from("components").select("id, type, brand, model, last_serviced_date, status, my_status")
      .eq("bike_id", listing.bike_id);
    components = componentsData || [];
  }

  const images: string[] = listing.images || [];
  const mailtoHref = listing.contact_email
    ? "mailto:" + listing.contact_email + "?subject=Enquiry%3A%20" + encodeURIComponent(listing.title) : null;
  const telHref = listing.contact_phone ? "tel:" + listing.contact_phone : null;
  const displayCondition = listing.condition || bsbBike?.condition;

  // Build spec rows — only show fields that have values
  const bikeSpecs = [
    { label: "Brand", value: bsbBike?.brand },
    { label: "Model", value: bsbBike?.model },
    { label: "Year", value: listing.model_year || bsbBike?.year },
    { label: "Condition", value: displayCondition },
    { label: "Category", value: listing.category },
    { label: "Sub-category", value: listing.sub_category },
    { label: "Frame Size", value: listing.frame_size },
    { label: "Wheel Size", value: listing.wheel_size },
    { label: "Frame Material", value: listing.frame_material },
    { label: "Type", value: bsbBike?.is_ebike ? "E-Bike" : null },
  ].filter((s) => s.value);

  const componentSpecs = [
    { label: "Groupset", value: [listing.groupset_brand, listing.groupset_level].filter(Boolean).join(" ") || null },
    { label: "Fork", value: listing.fork_brand },
    { label: "Rear Shock", value: listing.rear_shock_brand },
    { label: "Dropper Post", value: listing.has_dropper_post === true ? "Yes" : listing.has_dropper_post === false && listing.groupset_brand ? "No" : null },
  ].filter((s) => s.value);

  return (
    <main className="min-h-screen bg-gray-50">
      <MbsHeader />

      <div className="max-w-4xl mx-auto px-5 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/listings" className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1">
            ← Back to listings
          </Link>
          {isOwner && (
            <Link href={"/listings/" + id + "/edit"} className="text-sm font-semibold px-4 py-2 rounded-lg border-2 transition-colors" style={{ borderColor: "#2376BE", color: "#2376BE" }}>
              ✏️ Edit Listing
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Left */}
          <div className="md:col-span-2 space-y-4">

            {/* Photo gallery */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {images.length > 0 ? (
                <div>
                  <div className="h-72 w-full">
                    <a href={images[0]} target="_blank" rel="noopener noreferrer">
                      <img src={images[0]} alt={listing.title} className="w-full h-full object-cover cursor-zoom-in" />
                    </a>
                  </div>
                  {images.length > 1 && (
                    <div className="flex gap-2 p-2 overflow-x-auto">
                      {images.map((src: string, i: number) => (
                        <a key={i} href={src} target="_blank" rel="noopener noreferrer">
                          <img src={src} alt={"Photo " + (i + 1)} className="h-16 w-16 object-cover rounded-lg border border-gray-200 shrink-0 cursor-zoom-in" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center"><span className="text-8xl">🚲</span></div>
              )}
            </div>

            {/* Title + price + description */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h1 className="text-xl font-bold text-gray-900">{listing.title}</h1>
                {listing.has_bsb_history && (
                  <span className="inline-flex items-center gap-1 text-white text-xs font-semibold px-3 py-1 rounded-full shrink-0" style={{ backgroundColor: "#AA9F47" }}>
                    ✓ BSB Verified
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold mb-4" style={{ color: "#2376BE" }}>{formatPrice(listing.price)}</p>
              {listing.location && <p className="text-sm text-gray-500 mb-4">📍 {listing.location}</p>}
              <div className="border-t border-gray-100 pt-4">
                <h2 className="font-semibold text-gray-900 mb-2">Description</h2>
                <p className="text-gray-600 text-sm whitespace-pre-line">{listing.description}</p>
              </div>
            </div>

            {/* Bike Specifications */}
            {bikeSpecs.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">🚲 Bike Specifications</h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {bikeSpecs.map((spec) => (
                    <div key={spec.label}>
                      <p className="text-gray-400 text-xs">{spec.label}</p>
                      <p className="font-medium text-gray-900 capitalize">{String(spec.value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Component Specs */}
            {componentSpecs.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">⚙️ Components</h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {componentSpecs.map((spec) => (
                    <div key={spec.label}>
                      <p className="text-gray-400 text-xs">{spec.label}</p>
                      <p className="font-medium text-gray-900">{String(spec.value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BSB Service History */}
            {serviceEvents.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="font-semibold text-gray-900">📋 Service History</h2>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: "#AA9F47" }}>BSB Verified</span>
                </div>
                <div className="space-y-3">
                  {serviceEvents.map((event) => (
                    <div key={event.id} className="flex gap-4 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="text-xs text-gray-400 shrink-0 w-20 pt-0.5">
                        {event.service_date ? new Date(event.service_date).toLocaleDateString("en-ZA", { month: "short", year: "numeric" }) : "—"}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 capitalize">{event.service_type || "Service"}</p>
                        {event.description && <p className="text-xs text-gray-500 mt-0.5">{event.description}</p>}
                        {event.cost && <p className="text-xs text-gray-400 mt-0.5">{"Cost: R" + Number(event.cost).toLocaleString("en-ZA")}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BSB Component Status */}
            {components.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">🔧 BSB Component Status</h2>
                <div className="space-y-2">
                  {components.map((c) => (
                    <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900 capitalize">{c.type}</p>
                        {(c.brand || c.model) && <p className="text-xs text-gray-500">{[c.brand, c.model].filter(Boolean).join(" ")}</p>}
                      </div>
                      <div className="text-right">
                        {(c.my_status || c.status) && (
                          <span className={"text-xs font-semibold px-2 py-0.5 rounded-full " + ((c.my_status || c.status) === "ok" ? "bg-green-100 text-green-700" : (c.my_status || c.status) === "due" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>
                            {(c.my_status || c.status) === "ok" ? "✓ Good" : (c.my_status || c.status) === "due" ? "⚠ Service Due" : "✗ Overdue"}
                          </span>
                        )}
                        {c.last_serviced_date && (
                          <p className="text-xs text-gray-400 mt-0.5">{"Last: " + new Date(c.last_serviced_date).toLocaleDateString("en-ZA", { month: "short", year: "numeric" })}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BSB Verified banner */}
            {listing.has_bsb_history && (
              <div className="rounded-xl p-4" style={{ backgroundColor: "#EBF5FF" }}>
                <p className="font-semibold text-sm mb-1" style={{ color: "#2376BE" }}>✓ This bike has a verified BSB service history</p>
                <p className="text-xs text-gray-600">When you buy this bike, pay R99 to claim the full service history into your Bike Service Book account.</p>
              </div>
            )}
          </div>

          {/* Right — contact card */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-4">
              <h2 className="font-semibold text-gray-900 mb-4">Contact Seller</h2>
              <p className="text-xs text-gray-500 mb-4">Arrange viewing and payment directly with the seller. MyBikeStory does not handle payments.</p>
              {mailtoHref && (
                <Link href={mailtoHref} className="w-full text-white py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 mb-3" style={{ backgroundColor: "#2376BE" }}>
                  ✉️ Email Seller
                </Link>
              )}
              {telHref && (
                <Link href={telHref} className="w-full py-3 rounded-lg font-semibold text-sm border-2 flex items-center justify-center gap-2" style={{ borderColor: "#2376BE", color: "#2376BE" }}>
                  📞 {listing.contact_phone}
                </Link>
              )}
              <div className="border-t border-gray-100 mt-4 pt-4">
                <p className="text-xs text-gray-400 text-center">{listing.views || 0} views</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
