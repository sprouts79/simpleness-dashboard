/**
 * GET /api/preview?adId=123
 *
 * For video ads: returns { videoUrl } — a direct CDN source URL usable in <video>.
 * For image/other ads: returns { previewUrl } — Meta's shareable preview link (open in new tab).
 *
 * fb.me / preview_shareable_link URLs block iframe embedding (X-Frame-Options: DENY),
 * so video ads must use the direct source URL for inline playback.
 */

import { NextRequest, NextResponse } from "next/server";

const BASE = "https://graph.facebook.com/v21.0";

export async function GET(req: NextRequest) {
  const adId = req.nextUrl.searchParams.get("adId");
  if (!adId) {
    return NextResponse.json({ error: "adId required" }, { status: 400 });
  }

  const token = process.env.META_SYSTEM_USER_TOKEN!;

  // Step 1: Get the ad's creative to find a video_id (if it's a video ad)
  const adRes = await fetch(
    `${BASE}/${adId}?fields=creative%7Bvideo_id%7D&access_token=${token}`,
    { cache: "no-store" }
  );
  const adJson: any = await adRes.json();

  if (adJson.error) {
    return NextResponse.json({ error: adJson.error.message }, { status: 502 });
  }

  const videoId = adJson.creative?.video_id;

  if (videoId) {
    // Step 2: Fetch the direct video source URL — can be used in a <video> element
    const videoRes = await fetch(
      `${BASE}/${videoId}?fields=source&access_token=${token}`,
      { cache: "no-store" }
    );
    const videoJson: any = await videoRes.json();

    if (videoJson.source) {
      return NextResponse.json({ videoUrl: videoJson.source });
    }
  }

  // Fallback: return the shareable preview link (image ads or if source is unavailable)
  const previewRes = await fetch(
    `${BASE}/${adId}?fields=preview_shareable_link&access_token=${token}`,
    { cache: "no-store" }
  );
  const previewJson: any = await previewRes.json();

  return NextResponse.json({ previewUrl: previewJson.preview_shareable_link ?? null });
}
