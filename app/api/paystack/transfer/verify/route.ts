import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const BSB_SIGNUP_URL = "https://www.bikeservicebook.com/auth/sign-up";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get("reference");
    const trxref = searchParams.get("trxref");
    const ref = reference || trxref;

    if (!ref) {
      return NextResponse.redirect(new URL(BSB_SIGNUP_URL));
    }

    // Verify with Paystack
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${ref}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const paystackData = await paystackRes.json();

    if (!paystackData.status || paystackData.data.status !== "success") {
      return NextResponse.redirect(new URL(BSB_SIGNUP_URL));
    }

    const ownershipId = paystackData.data.metadata?.ownership_id;
    const saleId = paystackData.data.metadata?.sale_id;

    if (!ownershipId) {
      return NextResponse.redirect(new URL(BSB_SIGNUP_URL));
    }

    const supabase = await createClient();

    // Mark transfer fee as paid
    await supabase
      .from("bike_ownership")
      .update({
        transfer_fee_paid: true,
        transfer_fee_paid_at: new Date().toISOString(),
        transfer_paystack_ref: ref,
      })
      .eq("id", ownershipId);

    // If both commission and transfer paid, mark sale as completed
    if (saleId) {
      const { data: sale } = await supabase
        .from("mbs_sales")
        .select("commission_paid")
        .eq("id", saleId)
        .single();

      if (sale?.commission_paid) {
        await supabase
          .from("mbs_sales")
          .update({ status: "completed" })
          .eq("id", saleId);
      }
    }

    // Redirect buyer to BSB sign up
    return NextResponse.redirect(new URL(BSB_SIGNUP_URL));
  } catch (err) {
    console.error("Transfer verify error:", err);
    return NextResponse.redirect(new URL(BSB_SIGNUP_URL));
  }
}
