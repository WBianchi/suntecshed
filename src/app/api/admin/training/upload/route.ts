import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

// Client upload handler — browser sends file directly to Blob (no body size limit)
export async function POST(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const body = (await req.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: [
            "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo",
            "video/x-matroska", "video/mpeg", "video/ogg",
          ],
          maximumSizeInBytes: 2 * 1024 * 1024 * 1024, // 2GB
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("Video upload completed:", blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error: any) {
    console.error("Video upload error:", error);
    return NextResponse.json({ error: error.message || "Erro no upload" }, { status: 400 });
  }
}
