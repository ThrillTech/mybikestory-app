"use client";
import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/mbs-pricing";
import MbsHeader from "@/components/mbs-header";
import MbsFooter from "@/components/mbs-footer";

type Sale = {
  id: string;
  listing_id: string;
  buyer_name: string;
  buyer_email: string;
  sale_price: number;
  commission_rate: string;
  commission_amount: number;
  commission_paid: boolean;
  status: string;
};

type Listing = {
  title: string;
};

function CommissionPayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const saleId = searchParams.get("sale");

  const [sale, setSale] = useState<Sale | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"" | "success" | "failed">("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    if (payment === "success") setPaymentStatus("success");
    if (payment === "failed") setPaymentStatus("failed");

    if (!saleId) {
      setError("Invalid payment link.");
      setIsLoading(false);
      return;
    }

    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/sign-in");
        return;
      }

      const { data: saleData } = await supabase
        .from("mbs_sales")
        .select("*")
        .eq("id", saleId)
        .eq("seller_id", user.id)
        .single();

      if (!saleData) {
        setError("Sale not found or you don't have permission to view it.");
        setIsLoading(false);
        return;
      }

      setSale(saleData);

      const { data: listingData } = await supabase
        .from("listings")
        .select("title")
        .eq("id", saleData.listing_id)
        .single();

      setListing(listingData);
      setIsLoading(false);
    }

    load();
  }, [saleId, router]);

  const handlePay = async () => {
    if (!sale) return;
    setIsPaying(true);
    setError("");

    try {
      const res = await fetch("/api/paystack/commission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saleId: sale.id }),
      });

      const data = await res.json();

      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        setError("Failed to initialize payment. Please try again.");
        setIsPaying(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setIsPaying(false);
    }
  };

  const salePriceRands = sale ? sale.sale_price / 100 : 0;
  const commissionRands = sale ? sale.commission_amount / 100 : 0;
  
  return (
    <div className="max-w-lg mx-auto px-5 py-12">
      {isLoading && (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      )}

      {!isLoading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-semibold">{error}</p>
        </div>
      )}

      {!isLoading && !error && sale && (
        <>
          {sale.commission_paid && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
              <div className="text-4xl mb-3">✅</div>
              <h2 className="text-xl font-bold text-green-800 mb-2">Commission Already Paid</h2>
              <p className="text-green-700 text-sm mb-6">
                Commission for <strong>{listing?.title}</strong> has been paid. The buyer can now claim their Bike Service Book history.
              </p>
              <button
                onClick={() => router.push("/dashboard")}
                className="text-white px-6 py-2.5 rounded-lg font-semibold text-sm"
                style={{ backgroundColor: "#2376BE" }}
              >
                Back to Dashboard
              </button>
            </div>
          )}

          {paymentStatus === "success" && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-center">
              <p className="text-green-700 font-semibold text-sm">
                ✅ Payment successful! Commission has been received.
              </p>
            </div>
          )}

          {paymentStatus === "failed" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-center">
              <p className="text-red-600 font-semibold text-sm">
                ❌ Payment was not completed. Please try again.
              </p>
            </div>
          )}

          {!sale.commission_paid && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <h1 className="text-xl font-bold text-gray-900 mb-1">Commission Invoice</h1>
                <p className="text-sm text-gray-500">{listing?.title}</p>
              </div>

              <div className="p-6 border-b border-gray-100">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Sale price</span>
                    <span className="font-semibold text-gray-900">{formatPrice(sale.sale_price)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Commission rate</span>
                    <span className="font-semibold text-gray-900">{sale.commission_rate}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Commission amount</span>
                    <span className="font-semibold text-red-500">
                      − R{commissionRands.toLocaleString("en-ZA")}
                    </span>
                  </div>
                  </div>
              </div>

              <div className="p-6 border-b border-gray-100 bg-gray-50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Buyer Details</p>
                <p className="text-sm font-semibold text-gray-900">{sale.buyer_name}</p>
                <p className="text-sm text-gray-500">{sale.buyer_email}</p>
              </div>

              <div className="p-6 border-b border-gray-100">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-800">
                  <p className="font-semibold mb-1">Important</p>
                  <p>Commission must be paid to complete the sale. Payment is securely processed by Paystack.</p>
                </div>
              </div>

              <div className="p-6">
                {error && (
                  <p className="text-red-500 text-xs mb-4 text-center">{error}</p>
                )}
                <button
                  onClick={handlePay}
                  disabled={isPaying}
                  className="w-full text-white py-3.5 rounded-xl font-bold text-base transition-opacity disabled:opacity-60"
                  style={{ backgroundColor: "#2376BE" }}
                >
                  {isPaying ? "Redirecting to Paystack..." : `Pay R${commissionRands.toLocaleString("en-ZA")} Commission`}
                </button>
                <p className="text-xs text-gray-400 text-center mt-3">
                  Secured by Paystack · ZAR payment
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function CommissionPayPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <MbsHeader />
      <Suspense fallback={<div className="text-center py-20 text-gray-400">Loading...</div>}>
        <CommissionPayContent />
      </Suspense>
      <MbsFooter />
    </main>
  );
}
