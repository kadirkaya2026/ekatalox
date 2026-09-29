import { redirect } from "next/navigation";

// Ziyaretçi Hikâyeleri artık Ziyaretçi Analitiği içinde sekme (29 Eyl 2026).
export default async function VisitorStoriesRedirect({ searchParams }: { searchParams: Promise<{ gun?: string }> }) {
  const { gun } = await searchParams;
  redirect(`/ziyaretciler?sekme=hikayeler${gun ? `&gun=${gun}` : ""}`);
}
