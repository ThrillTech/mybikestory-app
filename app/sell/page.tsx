"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import MbsHeader from "@/components/mbs-header";
import { calculateCommission, TRANSFER_FEE_RANDS } from "@/lib/mbs-pricing";
import Link from "next/link";

const MAX_PHOTOS = 10;

export default function SellPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedCommission, setAcceptedCommission] = useState(false);
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
  const netReceived = commission ? priceRands - commission.commissionRands : 0;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === "price") setAcceptedCommission(false);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_PHOTOS - photos.length;
    if (files.length > remaining) {
      setError(`You can only add ${remaining} more photo${remaining === 1 ? "" : "s"} (max ${MAX_PHOTOS}).`);
      return;
    }
    setError(null);
    setPhotos((prev) => [...prev, ...files]);
    const previews = files.map((f) => URL.createObjectURL(f));
    setPhotoPreviews((prev) => [...prev, ...previews]);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptedCommission) {
      setError("Please accept the commission breakdown before publishing.");
      return;
    }
    if (!acceptedTerms) {
      setError("Please accept the Terms & Conditions before publishing.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const imageUrls: string[] = [];
    for (const photo of photos) {
      const ext = photo.name.split(".").pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("listing-images")
        .upload(path, photo);
      if (uploadError) {
        setError(`Photo upload failed: ${uploadError.message}`);
        setIsLoading(false);
        return;
      }
      const { data: urlData } = supabase.storage
        .from("listing-images")
        .getPublicUrl(path);
      imageUrls.push(urlData.publicUrl);
    }

    const { error: insertError } = await supabase.from("listings").insert({
      user_id: user.id,
      title: form.title,
      price: priceRands * 100,
      description: form.description,
      location: form.location,
      contact_email: form.contact_email || user.email,
      contact_phone: form.contact_phone,
      images: imageUrls,
      status: "active",
      has_bsb_history: false,
    });

    if (insertError) {
      setError(insertError.message);
      setIsLoading(false);
      return;
    }

    router.push("/dashboard?listed=true");
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <MbsHeader />

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">List Your Bike for Sale</h1>
          <p className="text-gray-500 text-sm">Free to list. Pay commission only when it sells.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Photos */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">
                Photos <span className="text-gray-400 font-normal">({photos.length}/{MAX_PHOTOS})</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">First photo is the cover image.</p>
            </div>

            {photoPreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {photoPreviews.map((src, i) => (
                  <div key={i} className="relative aspect-square">
                    <img src={src} alt={`Photo ${i + 1}`} className="w-full h-full object-cover rounded-lg border border-gray-200" />
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 text-white text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "#2376BE" }}>Cover</span>
                    )}
                    <button type="button" onClick={() => removePhoto(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow">×</button>
                  </div>
                ))}
              </div>
            )}

            {photos.length < MAX_PHOTOS && (
              <div className="flex gap-2">
                <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg py-4 cursor-pointer hover:border-[#2376BE] transition-colors">
                  <span className="text-xl mb-1">📷</span>
                  <span className="text-xs font-medium text-gray-600">Camera</span>
                  <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} className="hidden" />
                </label>
                <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg py-4 cursor-pointer hover:border-[#2376BE] transition-colors">
                  <span className="text-xl mb-1">🖼️</span>
                  <span className="text-xs font-medium text-gray-600">Gallery</span>
                  <input type="file" accept="image/*" multiple onChange={handlePhotoChange} className="hidden" />
                </label>
              </div>
            )}
          </div>

          {/* Bike Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <h2 className="font-semibold text-gray-900 text-sm">Bike Details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
              <input type="text" name="title" value={form.title} onChange={handleChange} required placeholder="e.g. 2022 Trek Marlin 7 MTB — Large" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2376BE]" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asking Price (R) <span className="text-red-500">*</span></label>
              <input type="number" name="price" value={form.price} onChange={handleChange} required min="1" inputMode="numeric" placeholder="e.g. 8500" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2376BE]" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
              <textarea name="description" value={form.description} onChange={handleChange} required rows={4} placeholder="Condition, components, size, any damage, reason for selling..." className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2376BE]" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location <span className="text-red-500">*</span></label>
              <input type="text" name="location" value={form.location} onChange={handleChange} required placeholder="e.g. Sandton, Johannesburg" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2376BE]" />
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">Contact Details</h2>
              <p className="text-xs text-gray-400 mt-0.5">Shown to buyers to contact you directly.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="contact_email" value={form.contact_email} onChange={handleChange} placeholder="Defaults to your account email" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2376BE]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" name="contact_phone" value={form.contact_phone} onChange={handleChange} inputMode="tel" placeholder="e.g. 082 123 4567" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2376BE]" />
            </div>
          </div>

          {/* Commission breakdown */}
          {commission && (
            <div className="bg-white rounded-xl border-2 p-4 space-y-3" style={{ borderColor: "#2376BE" }}>
              <h2 className="font-bold text-sm" style={{ color: "#2376BE" }}>Commission Breakdown</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Asking price</span>
                  <span className="font-semibold text-gray-900">
                    R{priceRands.toLocaleString("en-ZA")}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="text-gray-600">
                    Commission ({commission.ratePercent}) payable to MyBikeStory
                  </span>
                  <span className="font-semibold text-red-500">
                    R{commission.commissionRands.toLocaleString("en-ZA")}
                  </span>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 space-y-1.5">
                <p className="font-semibold">⚠️ Important — please read before listing:</p>
                <p>Commission is payable to MyBikeStory when you mark your bike as sold. Until commission is paid, the buyer cannot claim the Bike Service Book history into their account.</p>
                <p>Bikes are tracked by serial number. If commission is unpaid, the bike&apos;s serial number will be flagged and cannot be registered on any new account — protecting both you and the buyer.</p>
              </div>
          )}

          {/* T&C acceptance */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-0.5 w-4 h-4 rounded accent-[#2376BE]" />
              <span className="text-xs text-gray-700">
                I have read and agree to the{" "}
                <Link href="/terms" target="_blank" className="underline font-semibold" style={{ color: "#2376BE" }}>Terms &amp; Conditions</Link>
                , including the POPIA privacy clauses. I confirm this bike belongs to me and the listing is accurate.
              </span>
            </label>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || !acceptedTerms || !acceptedCommission || !priceRands}
            className="w-full text-white py-3.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-40"
            style={{ backgroundColor: "#2376BE" }}
          >
            {isLoading ? "Publishing..." : "Publish Listing — Free"}
          </button>

          <div className="h-4" />
        </form>
      </div>
    </main>
  );
}
