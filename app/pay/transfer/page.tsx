"use client";
import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import MbsHeader from "@/components/mbs-header";
import MbsFooter from "@/components/mbs-footer";

const BSB_SIGNUP_URL = "https://www.bikeservicebook.com/auth/sign-up";

function TransferPayContent() {
  const searchParams = useSearchParams();
  const buyerEmail = searchParams.get("email") || "";
  const saleId = searchParams.get("sale") || "";

  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!buyerEmail) {
      setError("Invalid payment link. Please use the link from your email.");
    }
  }, [buyerEmail]);

  const handlePay = async () => {
    if (!buyerEmail) return;
    setIsPaying(true);
    setError("");

    try {
      const res = await fetch("/api/paystack/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerEmail, saleId }),
      });

      const data = await res.json();

      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        setError(data.error || "Failed to initialize payment. Please try again.");
        setIsPaying(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setIsPaying(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-5 py-12">
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

        {/* Header */}
        <div style={{ background: "#2376BE" }} className="p-6 text-center">
          <h1 className="text-xl font-bold text-white mb-1">
            Bike Service Book Transfer
          </h1>
          <p className="text-blue-100 text-sm">
            Claim your verified service history
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-red-600 font-semibold text-sm">{error}</p>
            </div>
          ) : (
            <>
              {/* What you get */}
              <h2 className="font-bold text-gray-900 mb-4">What you get with your transfer</h2>
              <div className="space-y-3 mb-6">
                {[
                  { icon: "📋", title: "Full Service History", desc: "Every service, repair and upgrade logged by the previous owner" },
                  { icon: "🔧", title: "Component Records", desc: "See the condition of brakes, chain, tyres and all key components" },
                  { icon: "🛡️", title: "Ownership Certificate", desc: "Official record that this bike now belongs to you" },
                  { icon: "💰", title: "Higher Resale Value", desc: "Verified history means more when you sell in future" },
                ].map((item) => (
                  <div key={item.title} className="flex gap-3 p-3 rounded-lg bg-gray-50">
                    <span className="text-xl shrink-0">{item.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price box */}
              <div
                className="rounded-xl p-5 mb-6 text-center"
                style={{ backgroundColor: "#EBF5FF" }}
              >
                <p className="text-sm text-gray-500 mb-1">Once-off transfer fee</p>
                <p className="text-4xl font-bold" style={{ color: "#2376BE" }}>R99</p>
                <p className="text-xs text-gray-400 mt-1">Secured by Paystack · ZAR</p>
              </div>

              {/* Steps */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-800 mb-6">
                <p className="font-semibold mb-2">Two quick steps to claim your history:</p>
                <p className="mb-1">1. Pay the R99 transfer fee below</p>
                <p>2. Create your free Bike Service Book account — your history will be waiting</p>
              </div>

              <button
                onClick={handlePay}
                disabled={isPaying}
                className="w-full text-white py-3.5 rounded-xl font-bold text-base mb-3 transition-opacity disabled:opacity-60"
                style={{ backgroundColor: "#2376BE" }}
              >
                {isPaying ? "Redirecting to Paystack..." : "Pay R99 & Claim My History"}
              </button>

              <a
                href={BSB_SIGNUP_URL}
                className="block w-full text-center py-3 rounded-xl font-semibold text-sm border-2 transition-colors"
                style={{ borderColor: "#AA9F47", color: "#AA9F47" }}
              >
                Create Bike Service Book Account First
              </a>

              <p className="text-xs text-gray-400 text-center mt-4">
                You can create your Bike Service Book account before or after paying — your history will be linked automatically via your email address.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TransferPayPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <MbsHeader />
      <Suspense fallback={<div className="text-center py-20 text-gray-400">Loading...</div>}>
        <TransferPayContent />
      </Suspense>
      <MbsFooter />
    </main>
  );
}
