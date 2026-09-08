import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSector } from "@/lib/marketing/sectors";
import { buildSectorMetadata, SectorPage } from "@/components/marketing/sector-page";

// Sektör tanımı lib/marketing/sectors.ts içinde; burada yalnız slug sabit.
const sector = getSector("market");

export const metadata: Metadata = sector ? buildSectorMetadata(sector) : {};

export default function Page() {
  if (!sector) notFound();
  return <SectorPage sector={sector} />;
}
