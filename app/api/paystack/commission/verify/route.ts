import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get("reference");
    const trxref = searchParams.get("trxref");
    const ref = reference || trxref;

    if (!ref) {
      return NextResponse.redirect(new URL("/dashboard?payment=failed", process.env.NEXT_PUBLIC_SITE_URL!));
    }

    // Verify with Paystack
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${ref}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const paystackData = await paystackRes.json();

    if (!paystackData.status || paystackData.data.status !== "success") {
      return NextResponse.redirect(new URL("/dashboard?payment=failed", process.env.NEXT_PUBLIC_SITE_URL!));
    }

    const saleId = paystackData.data.metadata?.sale_id;

    if (!saleId) {
      return NextResponse.redirect(new URL("/dashboard?payment=failed", process.env.NEXT_PUBLIC_SITE_URL!));
    }

    const supabase = await createClient();

    // Mark commission as paid
    await supabase
      .from("mbs_sales")
      .update({
        commission_paid: true,
        commission_paid_at: new Date().toISOString(),
        commission_paystack_ref: ref,
        status: "commission_paid",
      })
      .eq("id", saleId);

    return NextResponse.redirect(new URL("/dashboard?payment=success", process.env.NEXT_PUBLIC_SITE_URL!));
  } catch (err) {
    console.error("Commission verify error:", err);
    return NextResponse.redirect(new URL("/dashboard?payment=failed", process.env.NEXT_PUBLIC_SITE_URL!));
  }
}
