import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, page, productId, sessionId, userId, referrer, duration } = body;

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "";

    if (type === "pageview" && page) {
      await prisma.pageView.create({
        data: {
          page,
          sessionId: sessionId || null,
          userId: userId || null,
          ip,
          userAgent,
          referrer: referrer || null,
          duration: duration ? parseInt(duration) : null,
        },
      });
    } else if (type === "product_click" && productId) {
      await prisma.productClick.create({
        data: {
          productId,
          sessionId: sessionId || null,
          userId: userId || null,
        },
      });
    } else {
      return NextResponse.json({ error: "Tipo de evento inválido" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Tracking error:", error);
    return NextResponse.json({ ok: true });
  }
}
