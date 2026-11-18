import { NextRequest, NextResponse } from "next/server";

// Valid cache tags that can be revalidated on the website.
const VALID_TAGS = ["hero", "files", "settings"] as const;
type ValidTag = (typeof VALID_TAGS)[number];

export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  const websiteUrl = process.env.WEBSITE_URL;

  if (!secret || !websiteUrl) {
    console.error("[revalidate] Missing REVALIDATE_SECRET or WEBSITE_URL");
    return NextResponse.json(
      { success: false, message: "Server not configured" },
      { status: 500 },
    );
  }

  let body: { tag?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const tag = body.tag;
  if (!tag || !VALID_TAGS.includes(tag as ValidTag)) {
    return NextResponse.json(
      {
        success: false,
        message: `Invalid tag. Must be one of: ${VALID_TAGS.join(", ")}`,
      },
      { status: 400 },
    );
  }

  try {
    const targetUrl = `${websiteUrl}/api/revalidate?tag=${encodeURIComponent(
      tag,
    )}&secret=${encodeURIComponent(secret)}`;

    const res = await fetch(targetUrl, {
      method: "POST",
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error(`[revalidate] Website returned ${res.status}:`, data);
      return NextResponse.json(
        {
          success: false,
          message: data?.message || `Website returned ${res.status}`,
        },
        { status: res.status },
      );
    }

    return NextResponse.json({ success: true, tag });
  } catch (err) {
    console.error("[revalidate] Fetch error:", err);
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : "Network error",
      },
      { status: 502 },
    );
  }
}
