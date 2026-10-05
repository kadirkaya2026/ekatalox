import { ImageResponse } from "next/og";
import { getBlogPost, getBlogPosts } from "@/lib/marketing/blog";

// İleri tarihli yazıların paylaşım görseli de o gün gelince üretilsin (yazı sayfasıyla aynı saatlik yenileme).
export const revalidate = 3600;
export const dynamicParams = true;
export function generateStaticParams() { return getBlogPosts().map(({ slug }) => ({ slug })); }
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return new Response("Not Found", { status: 404 });
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#101626", color: "white", padding: "64px 72px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, color: "#88d6ac" }}><span>eKatalox / Blog</span><span>{post.category}</span></div>
      <div style={{ display: "flex", flex: 1, alignItems: "center", fontSize: 58, fontWeight: 700, lineHeight: 1.15 }}>{post.title}</div>
      <div style={{ display: "flex", borderTop: "1px solid #364050", paddingTop: 24, fontSize: 24, color: "#c2c9d5" }}>Dijital katalog ve toptan sipariş rehberleri · ekatalox.com</div>
    </div>,
    { width: 1200, height: 630, headers: { "X-Robots-Tag": "noindex" } },
  );
}
