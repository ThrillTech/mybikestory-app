import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { saleId } = await req.json();

    if (!saleId) {
      return NextResponse.json({ error: "Missing saleId" }, { status: 400 });
    }

    const supabase = await createClient();

    // Load the sale record
    const { data: sale, error } = await supabase
      .from("mbs_sales")
      .select("*")
      .eq("id", saleId)
      .single();

    if (error || !sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    if (sale.commission_paid) {
      return NextResponse.json({ error: "Commission already paid" }, { status: 400 });
    }

    // Get seller email
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Initialize Paystack transaction
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: sale.commission_amount, // already in cents
        currency: "ZAR",
        reference: `commission_${saleId}_${Date.now()}`,
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/paystack/commission/verify`,
        metadata: {
          sale_id: saleId,
          type: "commission",
          cancel_action: `${process.env.NEXT_PUBLIC_SITE_URL}/pay/commission?sale=${saleId}`,
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
    console.error("Commission payment init error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
