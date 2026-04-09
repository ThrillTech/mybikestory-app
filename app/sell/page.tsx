"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import MbsHeader from "@/components/mbs-header";
import { calculateCommission, TRANSFER_FEE_RANDS } from "@/lib/mbs-pricing";

export default function SellPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    price: "",
    description: "",
    location: "",
    contact_email: "",
    contact_phone: "",
  });

  const priceRands = parseInt(form.price) || 0;
  const commission = priceRands > 0 ? calculateCommission(priceRands) : null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const { error } = await supabase.from("listings").insert({
      user_id: user.id,
      title: form.title,
      price: priceRands * 100, // store in cents
      description: form.description,
      location: form.location,
      contact_email: form.contact_email || user.email,
      contact_phone: form.contact_phone,
      status: "active",
      has_bsb_history: false,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    router.push("/dashboard?listed=true");
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <MbsHeader />

      <div className="max-w-2xl mx-auto px-5 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            List Your Bike for Sale
          </h1>
          <p className="text-gray-500 text-sm">
            Free to list. You only pay a commission when your bike sells.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Bike Details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Listing Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                placeholder="e.g. 2022 Trek Marlin 7 MTB — 29er Large"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2376BE]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asking Price (R) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                required
                min="1"
                placeholder="e.g. 8500"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2376BE]"
              />
              {commission && (
                <p className="text-xs text-gray-400 mt-1">
                  Commission on sale: R{commission.commissionRands} ({commission.ratePercent})
                  {" · "}Buyer transfer fee: R{TRANSFER_FEE_RANDS}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                rows={5}
                placeholder="Describe your bike — condition, components, size, any damage, reason for selling..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2376BE]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                required
                placeholder="e.g. Sandton, Johannesburg"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2376BE]"
              />
            </div>
          </div>

          {/* Contact details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Contact Details</h2>
            <p className="text-xs text-gray-400">
              Shown to buyers so they can contact you directly.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                name="contact_email"
                value={form.contact_email}
                onChange={handleChange}
                placeholder="Defaults to your account email"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2376BE]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                name="contact_phone"
                value={form.contact_phone}
                onChange={handleChange}
                placeholder="e.g. 082 123 4567"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2376BE]"
              />
            </div>
          </div>

          {/* Commission summary */}
          <div
            className="rounded-xl p-4 text-sm"
            style={{ backgroundColor: "#EBF5FF" }}
          >
            <p className="font-semibold mb-1" style={{ color: "#2376BE" }}>
              How selling works
            </p>
            <ul className="text-gray-600 space-y-1 text-xs">
              <li>✓ List for free — no upfront cost</li>
              <li>✓ Buyers contact you directly to arrange viewing and payment</li>
              <li>✓ Once sold, mark as sold and pay the commission via Paystack</li>
              <li>✓ Buyer pays R99 to claim the service history into their account</li>
            </ul>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full text-white py-3 rounded-lg font-semibold text-sm transition-colors disabled:opacity-60"
            style={{ backgroundColor: "#2376BE" }}
          >
            {isLoading ? "Publishing..." : "Publish Listing — Free"}
          </button>
        </form>
      </div>
    </main>
  );
}
