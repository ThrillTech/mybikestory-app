import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BSB_DASHBOARD_URL = "https://www.bikeservicebook.com/dashboard";
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
    const buyerEmail = paystackData.data.metadata?.buyer_email;
    const redirectToBsb = paystackData.data.metadata?.redirect === "bsb";

    if (!ownershipId) {
      return NextResponse.redirect(new URL(BSB_SIGNUP_URL));
    }

    const supabase = await createClient();

    // 1. Mark transfer fee as paid
    await supabase
      .from("bike_ownership")
      .update({
        transfer_fee_paid: true,
        transfer_fee_paid_at: new Date().toISOString(),
        transfer_paystack_ref: ref,
      })
      .eq("id", ownershipId);

    // 2. Get the ownership record to find bike_id and owner_id
    const { data: ownership } = await supabase
      .from("bike_ownership")
      .select("bike_id, owner_id, owner_email")
      .eq("id", ownershipId)
      .single();

    if (ownership?.bike_id) {
      // 3. Find buyer's BSB user ID by email using admin client
      let buyerId = ownership.owner_id;

      if (!buyerId && (buyerEmail || ownership.owner_email)) {
        const email = buyerEmail || ownership.owner_email;
        const adminClient = createAdminClient();
        const { data: { users } } = await adminClient.auth.admin.listUsers();
        const matchedUser = users?.find(
          (u: any) => u.email?.toLowerCase() === email.toLowerCase()
        );
        if (matchedUser) buyerId = matchedUser.id;
      }

      if (buyerId) {
        // 4. Transfer bike — update bikes.user_id to buyer
        await supabase
          .from("bikes")
          .update({ user_id: buyerId })
          .eq("id", ownership.bike_id);

        // 5. Update ownership record with confirmed owner_id and owned_from date
        await supabase
          .from("bike_ownership")
          .update({
            owner_id: buyerId,
            owned_from: new Date().toISOString(),
          })
          .eq("id", ownershipId);
      }
    }

    // 6. If both commission and transfer paid, mark sale as completed
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

    // 7. Redirect — BSB dashboard for existing users, BSB sign up for new users
    const redirectUrl = redirectToBsb ? BSB_DASHBOARD_URL : BSB_SIGNUP_URL;
    return NextResponse.redirect(new URL(redirectUrl));

  } catch (err) {
    console.error("Transfer verify error:", err);
    return NextResponse.redirect(new URL(BSB_SIGNUP_URL));
  }
}
