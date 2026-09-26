import { ImageResponse } from "next/og";

export const alt = "eKatalox — Toptancılar için online katalog ve WhatsApp sipariş";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "#101626", color: "white", padding: "64px 72px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 40, fontWeight: 700 }}>eKatalox</span>
        <span style={{ fontSize: 23, color: "#88d6ac" }}>Toptancılar ve üreticiler için</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 66, fontSize: 65, fontWeight: 700, lineHeight: 1.15 }}>
        <span>Bayiniz ürününü seçsin.</span>
        <span style={{ color: "#88d6ac" }}>Siparişi WhatsApp’a gelsin.</span>
      </div>
      <div style={{ display: "flex", marginTop: 30, fontSize: 27, color: "#c2c9d5" }}>Güncel fiyatlar. Şifreli katalog. Düzenli sipariş.</div>
      <div style={{ display: "flex", marginTop: "auto", justifyContent: "space-between", alignItems: "center", fontSize: 23 }}>
        <span style={{ background: "#88d6ac", color: "#101626", padding: "14px 24px", borderRadius: 12 }}>250 ürünle ücretsiz başlayın</span>
        <span style={{ color: "#c2c9d5" }}>ekatalox.com</span>
      </div>
    </div>, size,
  );
}
