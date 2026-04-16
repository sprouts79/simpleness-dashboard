/**
 * GET /api/preview?adId=123
 *
 * Returns { videoUrl } for video ads — a direct CDN source URL usable in <video>.
 * Returns {} for non-video ads — the caller falls back to showing the thumbnail it already has.
 *
 * Meta's preview_shareable_link redirects to a login wall, so we never use it.
 * Nested field expansion (creative{video_id}) silently fails on some accounts,
 * so we always use separate API calls.
 */

import { NextRequest, NextResponse } from "next/server";

const BASE = "https://graph.facebook.com/v21.0";

export async function GET(req: NextRequest) {
  const adId = req.nextUrl.searchParams.get("adId");
  if (!adId) {
    return NextResponse.json({ error: "adId required" }, { status: 400 });
  }

  const token = process.env.META_SYSTEM_USER_TOKEN!;

  // Step 1: Get the ad's creative ID (plain field — nested expansion is unreliable)
  const adRes = await fetch(
    `${BASE}/${adId}?fields=creative&access_token=${token}`,
    { cache: "no-store" }
  );
  const adJson: any = await adRes.json();

  if (adJson.error) {
    return NextResponse.json({ error: adJson.error.message }, { status: 502 });
  }

  const creativeId = adJson.creative?.id;
  if (!creativeId) return NextResponse.json({});

  // Step 2: Get video_id from the creative.
  // It can live at the top level (video_id) or nested in object_story_spec.video_data.
  const creativeRes = await fetch(
    `${BASE}/${creativeId}?fields=video_id,object_story_spec&access_token=${token}`,
    { cache: "no-store" }
  );
  const creativeJson: any = await creativeRes.json();

  const videoId =
    creativeJson.video_id ??
    creativeJson.object_story_spec?.video_data?.video_id ??
    null;

  if (!videoId) return NextResponse.json({});

  // Step 3: Fetch the direct CDN source URL — embeds in a <video> element
  const videoRes = await fetch(
    `${BASE}/${videoId}?fields=source&access_token=${token}`,
    { cache: "no-store" }
  );
  const videoJson: any = await videoRes.json();

  if (videoJson.source) {
    return NextResponse.json({ videoUrl: videoJson.source });
  }

  return NextResponse.json({});
}
