import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  try {
    let config = await prisma.whatsAppConfig.findFirst();
    if (!config) {
      config = await prisma.whatsAppConfig.create({
        data: {
          wahaUrl: process.env.WAHA_API_URL || "http://localhost:9000",
          wahaApiKey: process.env.WAHA_API_KEY || "",
        },
      });
    }

    const wahaUrl = config.wahaUrl || process.env.WAHA_API_URL || "http://localhost:9000";
    const wahaApiKey = config.wahaApiKey || process.env.WAHA_API_KEY || "";
    const sessionName = config.sessionName || "default";

    // Start session in WAHA
    const startRes = await fetch(`${wahaUrl}/api/sessions/${sessionName}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Api-Key": wahaApiKey },
      body: JSON.stringify({ name: sessionName }),
    });

    if (!startRes.ok && startRes.status !== 409) {
      // 409 = already started, which is fine
      const errText = await startRes.text();
      console.error("WAHA start session error:", errText);
    }

    // Update status
    await prisma.whatsAppConfig.update({
      where: { id: config.id },
      data: { status: "connecting" },
    });

    // Get QR code
    const qrRes = await fetch(`${wahaUrl}/api/sessions/${sessionName}/auth/qr`, {
      headers: { "X-Api-Key": wahaApiKey },
    });

    if (!qrRes.ok) {
      // Maybe already authenticated, check status
      const statusRes = await fetch(`${wahaUrl}/api/sessions/${sessionName}`, {
        headers: { "X-Api-Key": wahaApiKey },
      });

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        if (statusData.status === "WORKING") {
          await prisma.whatsAppConfig.update({
            where: { id: config.id },
            data: { status: "connected", phone: statusData.me?.id || null, qrCode: null },
          });
          return NextResponse.json({ status: "connected", phone: statusData.me?.id });
        }
      }

      return NextResponse.json({ status: "connecting", qrCode: null });
    }

    const qrData = await qrRes.json();
    const qrCode = qrData.value || qrData.qr || null;

    await prisma.whatsAppConfig.update({
      where: { id: config.id },
      data: { qrCode, status: "connecting" },
    });

    return NextResponse.json({ status: "connecting", qrCode });
  } catch (error: any) {
    console.error("QR code error:", error);
    return NextResponse.json({ error: "Erro ao gerar QR code" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  try {
    let config = await prisma.whatsAppConfig.findFirst();
    if (!config) return NextResponse.json({ status: "disconnected" });

    const wahaUrl = config.wahaUrl || process.env.WAHA_API_URL || "http://localhost:9000";
    const wahaApiKey = config.wahaApiKey || process.env.WAHA_API_KEY || "";
    const sessionName = config.sessionName || "default";

    // Check session status in WAHA
    try {
      const statusRes = await fetch(`${wahaUrl}/api/sessions/${sessionName}`, {
        headers: { "X-Api-Key": wahaApiKey },
      });

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        if (statusData.status === "WORKING") {
          if (config.status !== "connected") {
            await prisma.whatsAppConfig.update({
              where: { id: config.id },
              data: { status: "connected", phone: statusData.me?.id || null, qrCode: null },
            });
          }
          return NextResponse.json({ status: "connected", phone: statusData.me?.id || config.phone });
        }
      }
    } catch {
      // WAHA not reachable
    }

    return NextResponse.json({ status: config.status, qrCode: config.qrCode, phone: config.phone });
  } catch (error: any) {
    return NextResponse.json({ status: "disconnected" });
  }
}
