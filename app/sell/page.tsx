"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import MbsHeader from "@/components/mbs-header";
import { calculateCommission } from "@/lib/mbs-pricing";
import Link from "next/link";

const MAX_PHOTOS = 10;

interface BsbBike {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number | null;
  condition: string | null;
  photo_urls: string[] | null;
  current_hours: number | null;
  is_ebike: boolean | null;
  serial_number: string | null;
}

export default function SellPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedCommission, setAcceptedCommission] = useState(false);

  // BSB linking state
  const [bsbBikes, setBsbBikes] = useState<BsbBike[]>([]);
  const [selectedBsbBike, setSelectedBsbBike] = useState<BsbBike | null>(null);
  const [bsbLoading, setBsbLoading] = useState(true);
  const [linkedBikeId, setLinkedBikeId] = useState<string | null>(null);

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

  // Load BSB bikes on mount
  useEffect(() => {
    const loadBsbBikes = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setBsbLoading(false);
        return;
      }
      const { data } = await supabase
        .from("bikes")
        .select("id, name, brand, model, year, condition, photo_urls, current_hours, is_ebike, serial_number")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setBsbBikes(data || []);
      setBsbLoading(false);
    };
    loadBsbBikes();
  }, []);

  // Auto-fill form when a BSB bike is selected
  const handleBsbBikeSelect = (bikeId: string) => {
    if (!bikeId) {
      setSelectedBsbBike(null);
      setLinkedBikeId(null);
      setForm((f) => ({ ...f, title: "", description: "" }));
      setPhotos([]);
      setPhotoPreviews([]);
      return;
    }
    const bike = bsbBikes.find((b) => b.id === bikeId);
    if (!bike) return;
    setSelectedBsbBike(bike);
    setLinkedBikeId(bike.id);

    // Auto-fill title
    const title = [bike.year, bike.brand, bike.model]
      .filter(Boolean)
      .join(" ");

    // Auto-fill description
    const descParts = [];
    if (bike.brand && bike.model) descParts.push(`${bike.brand} ${bike.model}`);
    if (bike.year) descParts.push(`Year: ${bike.year}`);
    if (bike.condition) descParts.push(`Condition: ${bike.condition}`);
    if (bike.current_hours) descParts.push(`Hours ridden: ${Math.round(bike.current_hours * 10) / 10}h`);
    if (bike.is_ebike) descParts.push("E-bike: Yes");
    if (bike.serial_number) descParts.push(`Serial number: ${bike.serial_number}`);
    descParts.push("\nFull verified service history included via Bike Service Book.");
    const description = descParts.join("\n");

    setForm((f) => ({ ...f, title, description }));

    // Load BSB photos as previews
    if (bike.photo_urls && bike.photo_urls.length > 0) {
      setPhotos([]);
      setPhotoPreviews(bike.photo_urls.slice(0, MAX_PHOTOS));
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === "price") setAcceptedCommission(false);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const currentCount = photos.length + photoPreviews.filter(p => p.startsWith("blob:") || p.startsWith("http")).length;
    const remaining = MAX_PHOTOS - photos.length - (selectedBsbBike ? (selectedBsbBike.photo_urls?.length || 0) : 0);
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
    // If it's a BSB photo (no File object), remove from previews only
    if (index < (selectedBsbBike?.photo_urls?.length || 0) && photos.length === 0) {
      setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
    } else {
      const uploadedIndex = index - (selectedBsbBike ? (selectedBsbBike.photo_urls?.length || 0) : 0);
      setPhotos((prev) => prev.filter((_, i) => i !== uploadedIndex));
      setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
    }
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

    // Upload any new photos
    const imageUrls: string[] = [];

    // First include BSB photos that weren't removed
    if (selectedBsbBike?.photo_urls) {
      const bsbPhotoCount = selectedBsbBike.photo_urls.length;
      for (let i = 0; i < bsbPhotoCount; i++) {
        if (photoPreviews[i] === selectedBsbBike.photo_urls[i]) {
          imageUrls.push(selectedBsbBike.photo_urls[i]);
        }
      }
    }

    // Then upload new photos
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
      bike_id: linkedBikeId || null,
      title: form.title,
      price: priceRands * 100,
      description: form.description,
      location: form.location,
      contact_email: form.contact_email || user.email,
      contact_phone: form.contact_phone,
      images: imageUrls,
      status: "active",
      has_bsb_history: !!linkedBikeId,
    });

    if (insertError) {
      setError(insertError.message);
      setIsLoading(false);
      return;
    }

    // Mark bike as listed for sale in BSB
    if (linkedBikeId) {
      await supabase
        .from("bikes")
        .update({ listed_for_sale: true })
        .eq("id", linkedBikeId);
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

          {/* BSB Link Section */}
          <div className="bg-white rounded-xl border-2 border-[#2376BE] p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔗</span>
              <div>
                <h2 className="font-semibold text-gray-900 text-sm">Link your Bike Service Book</h2>
                <p className="text-xs text-gray-400 mt-0.5">Auto-fill your listing and show verified service history to buyers.</p>
              </div>
            </div>

            {bsbLoading ? (
              <p className="text-xs text-gray-400">Loading your bikes...</p>
            ) : bsbBikes.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
                No bikes found in your Bike Service Book account.{" "}
                <a href="https://www.bikeservicebook.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold" style={{ color: "#2376BE" }}>
                  Add your bike to BSB
                </a>{" "}
                to unlock verified listings.
              </div>
            ) : (
              <div>
                <select
                  onChange={(e) => handleBsbBikeSelect(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2376BE] bg-white"
                >
                  <option value="">— Select a bike to auto-fill —</option>
                  {bsbBikes.map((bike) => (
                    <option key={bike.id} value={bike.id}>
                      {[bike.year, bike.brand, bike.model].filter(Boolean).join(" ") || bike.name}
                    </option>
                  ))}
                </select>
                {selectedBsbBike && (
                  <div className="mt-2 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <span className="text-green-600 text-sm">✓</span>
                    <span className="text-xs text-green-700 font-medium">
                      BSB Verified — listing auto-filled with service history
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Photos */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">
                Photos <span className="text-gray-400 font-normal">({photoPreviews.length}/{MAX_PHOTOS})</span>
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
                    {selectedBsbBike && selectedBsbBike.photo_urls?.includes(src) && (
                      <span className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded">BSB</span>
                    )}
                    <button type="button" onClick={() => removePhoto(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow">x</button>
                  </div>
                ))}
              </div>
            )}
            {photoPreviews.length < MAX_PHOTOS && (
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
                  <span className="font-semibold text-gray-900">R{priceRands.toLocaleString("en-ZA")}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="text-gray-600">Commission ({commission.ratePercent}) payable to MyBikeStory</span>
                  <span className="font-semibold text-red-500">R{commission.commissionRands.toLocaleString("en-ZA")}</span>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 space-y-1.5">
                <p className="font-semibold">Important — please read before listing:</p>
                <p>Commission is payable to MyBikeStory when you mark your bike as sold. Until commission is paid, the buyer cannot claim the Bike Service Book history into their account.</p>
                <p>Bikes are tracked by serial number. If commission is unpaid, the serial number will be flagged and cannot be registered on any new account.</p>
              </div>
              <label className="flex items-start gap-3 cursor-pointer pt-1">
                <input type="checkbox" checked={acceptedCommission} onChange={(e) => setAcceptedCommission(e.target.checked)} className="mt-0.5 w-4 h-4 rounded accent-[#2376BE]" />
                <span className="text-xs text-gray-700">I understand and accept the commission structure above.</span>
              </label>
            </div>
          )}

          {/* T&C acceptance */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-0.5 w-4 h-4 rounded accent-[#2376BE]" />
              <span className="text-xs text-gray-700">
                {"I have read and agree to the "}
                <Link href="/terms" target="_blank" className="underline font-semibold" style={{ color: "#2376BE" }}>
                  Terms and Conditions
                </Link>
                {", including the POPIA privacy clauses. I confirm this bike belongs to me and the listing is accurate."}
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
