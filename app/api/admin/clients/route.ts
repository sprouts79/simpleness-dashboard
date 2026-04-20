import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { name, slug, metaAccountId } = await req.json();

  if (!name || !slug || !metaAccountId) {
    return NextResponse.json({ error: "name, slug og meta_account_id er påkrevd" }, { status: 400 });
  }

  const accountId = metaAccountId.startsWith("act_")
    ? metaAccountId.trim()
    : `act_${metaAccountId.trim()}`;

  const { error } = await supabase.from("clients").insert({
    id: slug,
    name: name.trim(),
    slug,
    meta_account_id: accountId,
    status: "green",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, slug });
}
