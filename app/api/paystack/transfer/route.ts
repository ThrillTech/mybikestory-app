import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TRANSFER_FEE_RANDS = 99;
const TRANSFER_FEE_CENTS = TRANSFER_FEE_RANDS * 100;

export async function POST(req: Request) {
  try {
    const { buyerEmail, saleId } = await req.json();

    if (!buyerEmail) {
      return NextResponse.json({ error: "Missing buyer email" }, { status: 400 });
    }

    const supabase = await createClient();

    // Find the bike_ownership record for this buyer
    const { data: ownership } = await supabase
      .from("bike_ownership")
      .select("*")
      .eq("owner_email", buyerEmail.toLowerCase())
      .eq("transfer_fee_paid", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!ownership) {
      return NextResponse.json({ error: "No pending ownership transfer found" }, { status: 404 });
    }

    // Initialize Paystack transaction
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: buyerEmail,
        amount: TRANSFER_FEE_CENTS,
        currency: "ZAR",
        reference: `transfer_${ownership.id}_${Date.now()}`,
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/paystack/transfer/verify`,
        metadata: {
          ownership_id: ownership.id,
          sale_id: saleId || ownership.sale_id,
          type: "transfer",
          buyer_email: buyerEmail,
        },
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      return NextResponse.json({ error: "Paystack initialization failed" }, { status: 500 });
    }

    return NextResponse.json({
      authorization_url: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
    });
  } catch (err) {
    console.error("Transfer payment init error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
