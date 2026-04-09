import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const verified = searchParams.get("verified");
  const search = searchParams.get("search");

  const supabase = await createClient();

  let query = supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (verified === "true") {
    query = query.eq("has_bsb_history", true);
  }

  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ listings: data });
}
