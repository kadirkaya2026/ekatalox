export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { Metadata } from "next";
import {
  generateStorefrontMetadata,
  renderStorefrontHome,
} from "@/components/storefront/storefront-home-page";

export async function generateMetadata(props: PageProps<"/store/[subdomain]">): Promise<Metadata> {
  return generateStorefrontMetadata(props);
}

export default async function StorefrontPage(props: PageProps<"/store/[subdomain]">) {
  const { subdomain } = await props.params;
  const searchParams = ((await props.searchParams) ?? {}) as Record<string, string | string[] | undefined>;
  return renderStorefrontHome({ subdomain, searchParams });
}
