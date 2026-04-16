/**
 * GET /api/preview?adId=123
 * Returns Meta's preview_shareable_link for the given ad ID.
 * Opens in a new tab — works for both image and video ads.
 */

import { NextRequest, NextResponse } from "next/server";

const BASE = "https://graph.facebook.com/v21.0";

export async function GET(req: NextRequest) {
  const adId = req.nextUrl.searchParams.get("adId");
  if (!adId) {
    return NextResponse.json({ error: "adId required" }, { status: 400 });
  }

  const token = process.env.META_SYSTEM_USER_TOKEN!;
  const url = `${BASE}/${adId}?fields=preview_shareable_link&access_token=${token}`;

  const res = await fetch(url, { cache: "no-store" });
  const json: any = await res.json();

  if (json.error) {
    return NextResponse.json(
      { error: json.error.message },
      { status: 502 }
    );
  }

  return NextResponse.json({ url: json.preview_shareable_link ?? null });
}
