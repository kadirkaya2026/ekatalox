import fs from "fs";
import path from "path";
import { ImageResponse } from "next/og";
import { resolveShortLinkRecord } from "@/lib/storage/short-links";
import { loadShareCardTenant } from "@/lib/storefront/share-card";

// Sipariş fişi kısa linkinin önizleme görseli (1200×630): mağaza logosu/adı +
// "Sipariş Fişi". Tutar ve ürün bilgisi YOK (kart sohbette herkese görünür).
export const runtime = "nodejs";

const FONTS_DIR = path.join(process.cwd(), "lib/storefront/assets/fonts");
let fonts: { regular: Buffer; bold: Buffer } | null = null;
function loadFonts() {
  fonts ??= {
    regular: fs.readFileSync(path.join(FONTS_DIR, "Roboto-Regular-latin-ext.ttf")),
    bold: fs.readFileSync(path.join(FONTS_DIR, "Roboto-Bold-latin-ext.ttf")),
  };
  return fonts;
}

export async function GET(_request: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const record = await resolveShortLinkRecord(code);
  const tenant = record ? await loadShareCardTenant(record.tenantId) : null;
  if (!record || !tenant) return new Response("Not Found", { status: 404 });

  const { regular, bold } = loadFonts();
  const logo = tenant.logoUrl;
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#ffffff", fontFamily: "Roboto" }}>
      <div style={{ height: 18, width: "100%", background: tenant.accent, display: "flex" }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 80px" }}>
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
          <img src={logo} style={{ maxWidth: 760, maxHeight: 250, objectFit: "contain" }} />
        ) : (
          <div style={{ fontSize: 96, fontWeight: 700, color: "#0f172a", textAlign: "center" }}>{tenant.name}</div>
        )}
        <div
          style={{
            marginTop: 48,
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "18px 44px",
            borderRadius: 999,
            background: tenant.accent,
            color: "#ffffff",
            fontSize: 48,
            fontWeight: 700,
          }}
        >
          Sipariş Fişi
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", paddingBottom: 34, fontSize: 28, color: "#64748b" }}>
        {logo ? tenant.name : "Siparişinizin fişini görüntülemek için dokunun"}
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Roboto", data: regular, weight: 400, style: "normal" },
        { name: "Roboto", data: bold, weight: 700, style: "normal" },
      ],
      headers: { "Cache-Control": "public, max-age=86400", "X-Robots-Tag": "noindex" },
    },
  );
}
