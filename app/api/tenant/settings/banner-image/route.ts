import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { shouldAllowDemoFallback } from "@/lib/env";
import { revalidateStorefrontCache } from "@/lib/storefront/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  buildTenantBannerPath,
  getBannerObjectPath,
  STOREFRONT_BANNERS_BUCKET,
} from "@/lib/storage/banners";
import { ensureTenantPlanFeatureResponse } from "@/lib/tenancy/guards";
import {
  allowedBannerMimeTypes,
  maxBannerFileSizeBytes,
  requiredBannerHeight,
  requiredBannerWidth,
} from "@/lib/validators/storefront-settings";

function getPngDimensions(fileBuffer: Buffer) {
  if (fileBuffer.length < 24) {
    return null;
  }

  const pngSignature = "89504e470d0a1a0a";

  if (fileBuffer.subarray(0, 8).toString("hex") !== pngSignature) {
    return null;
  }

  return {
    width: fileBuffer.readUInt32BE(16),
    height: fileBuffer.readUInt32BE(20),
  };
}

function getJpegDimensions(fileBuffer: Buffer) {
  if (fileBuffer.length < 4 || fileBuffer[0] !== 0xff || fileBuffer[1] !== 0xd8) {
    return null;
  }

  let offset = 2;

  while (offset < fileBuffer.length) {
    while (fileBuffer[offset] === 0xff) {
      offset += 1;
    }

    const marker = fileBuffer[offset];
    offset += 1;

    if (!marker) {
      return null;
    }

    if (marker === 0xd9 || marker === 0xda) {
      return null;
    }

    const segmentLength = fileBuffer.readUInt16BE(offset);

    if (segmentLength < 2 || offset + segmentLength > fileBuffer.length) {
      return null;
    }

    const isStartOfFrame =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);

    if (isStartOfFrame) {
      return {
        height: fileBuffer.readUInt16BE(offset + 3),
        width: fileBuffer.readUInt16BE(offset + 5),
      };
    }

    offset += segmentLength;
  }

  return null;
}

function getWebpDimensions(fileBuffer: Buffer) {
  if (
    fileBuffer.length < 30 ||
    fileBuffer.subarray(0, 4).toString("ascii") !== "RIFF" ||
    fileBuffer.subarray(8, 12).toString("ascii") !== "WEBP"
  ) {
    return null;
  }

  const chunkType = fileBuffer.subarray(12, 16).toString("ascii");

  if (chunkType === "VP8X") {
    return {
      width:
        1 +
        fileBuffer.readUIntLE(24, 3),
      height:
        1 +
        fileBuffer.readUIntLE(27, 3),
    };
  }

  if (chunkType === "VP8 " && fileBuffer.length >= 30) {
    return {
      width: fileBuffer.readUInt16LE(26) & 0x3fff,
      height: fileBuffer.readUInt16LE(28) & 0x3fff,
    };
  }

  if (chunkType === "VP8L" && fileBuffer.length >= 25) {
    const bits = fileBuffer.readUInt32LE(21);

    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }

  return null;
}

function getImageDimensions(fileBuffer: Buffer, mimeType: string) {
  if (mimeType === "image/png") {
    return getPngDimensions(fileBuffer);
  }

  if (mimeType === "image/jpeg") {
    return getJpegDimensions(fileBuffer);
  }

  if (mimeType === "image/webp") {
    return getWebpDimensions(fileBuffer);
  }

  return null;
}

function isManagedBannerUrl(url: string | null, tenantId: string) {
  const objectPath = getBannerObjectPath(url);

  if (!objectPath) {
    return false;
  }

  return objectPath.startsWith(`${tenantId}/`);
}

export async function POST(request: Request) {
  const guard = await ensureTenantPlanFeatureResponse("banner_settings");
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const formData = await request.formData();
  const image = formData.get("image");
  const previousImageUrl = String(formData.get("previous_image_url") ?? "") || null;

  if (!(image instanceof File)) {
    return NextResponse.json({ error: "Banner görseli zorunludur." }, { status: 400 });
  }

  if (
    !allowedBannerMimeTypes.includes(
      image.type as (typeof allowedBannerMimeTypes)[number],
    )
  ) {
    return NextResponse.json(
      { error: "Banner yalnız PNG, JPEG veya WEBP olabilir." },
      { status: 400 },
    );
  }

  if (image.size > maxBannerFileSizeBytes) {
    return NextResponse.json(
      { error: "Banner görseli en fazla 2MB olabilir." },
      { status: 400 },
    );
  }

  const imageBuffer = Buffer.from(await image.arrayBuffer());
  const dimensions = getImageDimensions(imageBuffer, image.type);

  if (!dimensions) {
    return NextResponse.json(
      { error: "Banner görselinin çözünürlüğü okunamadı." },
      { status: 400 },
    );
  }

  if (
    dimensions.width !== requiredBannerWidth ||
    dimensions.height !== requiredBannerHeight
  ) {
    return NextResponse.json(
      {
        error: `Banner görseli tam olarak ${requiredBannerWidth}x${requiredBannerHeight}px olmalıdır.`,
      },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return NextResponse.json(
        { error: "Supabase production yapılandırması eksik." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      image_url: `https://example.com/${session.tenant!.id}/banner_${Date.now()}.jpg`,
    });
  }

  const filePath = buildTenantBannerPath({
    tenantId: session.tenant!.id,
    fileName: image.name,
    contentType: image.type,
  });

  const { error: uploadError } = await supabase.storage
    .from(STOREFRONT_BANNERS_BUCKET)
    .upload(filePath, imageBuffer, {
      upsert: false,
      contentType: image.type,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 });
  }

  const { data: publicUrlData } = supabase.storage
    .from(STOREFRONT_BANNERS_BUCKET)
    .getPublicUrl(filePath);

  if (isManagedBannerUrl(previousImageUrl, session.tenant!.id)) {
    const previousPath = getBannerObjectPath(previousImageUrl);

    if (previousPath && previousPath !== filePath) {
      await supabase.storage.from(STOREFRONT_BANNERS_BUCKET).remove([previousPath]);
    }
  }

  revalidateStorefrontCache({
    tenantId: session.tenant!.id,
    subdomain: session.tenant!.subdomain,
  });

  return NextResponse.json({ image_url: publicUrlData.publicUrl });
}

export async function DELETE(request: Request) {
  const guard = await ensureTenantPlanFeatureResponse("banner_settings");
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const { image_url } = (await request.json()) as { image_url?: string };

  if (!image_url) {
    return NextResponse.json({ error: "Silinecek banner görseli bulunamadı." }, { status: 400 });
  }

  const objectPath = getBannerObjectPath(image_url);

  if (!objectPath || !objectPath.startsWith(`${session.tenant!.id}/`)) {
    return NextResponse.json(
      { error: "Bu banner görseli silinemez." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return NextResponse.json(
        { error: "Supabase production yapılandırması eksik." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  }

  const { error } = await supabase.storage
    .from(STOREFRONT_BANNERS_BUCKET)
    .remove([objectPath]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidateStorefrontCache({
    tenantId: session.tenant!.id,
    subdomain: session.tenant!.subdomain,
  });

  return NextResponse.json({ success: true });
}
