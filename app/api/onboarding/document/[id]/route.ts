import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { signedDocumentUrl } from "@/lib/db-onboarding";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const docId = parseInt(id, 10);
  if (!Number.isFinite(docId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const { data: doc, error } = await supabase
    .from("onboarding_documents")
    .select("id, filename, storage_path, link_url")
    .eq("id", docId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (doc.link_url) {
    return NextResponse.redirect(doc.link_url);
  }
  if (!doc.storage_path) {
    return NextResponse.json({ error: "No file" }, { status: 404 });
  }

  const url = await signedDocumentUrl(doc.storage_path, 120);
  return NextResponse.redirect(url);
}
