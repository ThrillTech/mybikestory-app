"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import MbsHeader from "@/components/mbs-header";
import { calculateCommission } from "@/lib/mbs-pricing";
import Link from "next/link";

const MAX_PHOTOS = 10;

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Existing images from DB (URLs)
  const [existingImages, setExistingImages] = useState<string[]>([]);
  // New photos added by user
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);

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

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: listing } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (!listing) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      setForm({
        title: listing.title || "",
        price: listing.price ? String(Math.round(listing.price / 100)) : "",
        description: listing.description || "",
        location: listing.location || "",
        contact_email: listing.contact_email || "",
        contact_phone: listing.contact_phone || "",
      });
      setExistingImages(listing.images || []);
      setIsLoading(false);
    };
    load();
  }, [id, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalCount = existingImages.length + newPhotos.length;
    const remaining = MAX_PHOTOS - totalCount;
    if (files.length > remaining) {
      setError("Maximum " + MAX_PHOTOS + " photos allowed.");
      return;
    }
    setError(null);
    setNewPhotos((prev) => [...prev, ...files]);
    const previews = files.map((f) => URL.createObjectURL(f));
    setNewPhotoPreviews((prev) => [...prev, ...previews]);
  };

  const removeNewPhoto = (index: number) => {
    setNewPhotos((prev) => prev.filter((_, i) => i !== index));
    setNewPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login");
      return;
    }

    // Upload new photos
    const uploadedUrls: string[] = [];
    for (const photo of newPhotos) {
      const ext = photo.name.split(".").pop();
      const path = user.id + "/" + Date.now() + "-" + Math.random().toString(36).slice(2) + "." + ext;
      const { error: uploadError } = await supabase.storage
        .from("listing-images")
        .upload(path, photo);
      if (uploadError) {
        setError("Photo upload failed: " + uploadError.message);
        setIsSaving(false);
        return;
      }
      const { data: urlData } = supabase.storage
        .from("listing-images")
        .getPublicUrl(path);
      uploadedUrls.push(urlData.publicUrl);
    }

    const allImages = [...existingImages, ...uploadedUrls];

    const { error: updateError } = await supabase
      .from("listings")
      .update({
        title: form.title,
        price: priceRands * 100,
        description: form.description,
        location: form.location,
        contact_email: form.contact_email,
        contact_phone: form.contact_phone,
        images: allImages,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateError) {
      setError(updateError.message);
      setIsSaving(false);
      return;
    }

    router.push("/listings/" + id + "?updated=true");
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <MbsHeader />
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-400">Loading...</p>
        </div>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="min-h-screen bg-gray-50">
        <MbsHeader />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <p className="text-gray-500 mb-4">Listing not found or you do not have permission to edit it.</p>
          <Link href="/dashboard" style={{ color: "#2376BE" }} className="text-sm font-semibold underline">
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const totalPhotos = existingImages.length + newPhotos.length;

  return (
    <main className="min-h-screen bg-gray-50">
      <MbsHeader />
      <div className="max-w-lg mx-auto px-4 py-6">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Edit Listing</h1>
            <p className="text-gray-500 text-sm">Update your bike listing details.</p>
          </div>
          <Link
            href={"/listings/" + id}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Photos */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">
                Photos <span className="text-gray-400 font-normal">({totalPhotos}/{MAX_PHOTOS})</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">First photo is the cover image. Remove photos by clicking ✕.</p>
            </div>

            {/* Existing images */}
            {existingImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {existingImages.map((src, i) => (
                  <div key={i} className="relative aspect-square">
                    <img
                      src={src}
                      alt={"Photo " + (i + 1)}
                      className="w-full h-full object-cover rounded-lg border border-gray-200"
                    />
                    {i === 0 && (
                      <span
                        className="absolute bottom-1 left-1 text-white text-xs px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: "#2376BE" }}
                      >
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeExistingImage(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New photo previews */}
            {newPhotoPreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {newPhotoPreviews.map((src, i) => (
                  <div key={i} className="relative aspect-square">
                    <img
                      src={src}
                      alt={"New photo " + (i + 1)}
                      className="w-full h-full object-cover rounded-lg border border-blue-300"
                    />
                    <span className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">
                      New
                    </span>
                    <button
                      type="button"
                      onClick={() => removeNewPhoto(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}

            {totalPhotos < MAX_PHOTOS && (
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2376BE]"
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
                inputMode="numeric"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2376BE]"
              />
              {commission && (
                <p className="text-xs text-gray-400 mt-1">
                  {"Commission: " + commission.ratePercent + " = R" + commission.commissionRands.toLocaleString("en-ZA") + " payable when sold"}
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
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2376BE]"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2376BE]"
              />
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
              <input
                type="email"
                name="contact_email"
                value={form.contact_email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2376BE]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                name="contact_phone"
                value={form.contact_phone}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2376BE]"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3">
            <Link
              href={"/listings/" + id}
              className="flex-1 py-3.5 rounded-lg font-semibold text-sm text-center border border-gray-300 text-gray-600"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 text-white py-3.5 rounded-lg font-semibold text-sm disabled:opacity-40"
              style={{ backgroundColor: "#2376BE" }}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          <div className="h-4" />
        </form>
      </div>
    </main>
  );
}
