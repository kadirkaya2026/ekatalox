import { revalidatePath, revalidateTag } from "next/cache";

export function revalidateStorefrontCache(params: {
  tenantId: string;
  subdomain: string;
}) {
  revalidatePath(`/store/${params.subdomain}`);
  revalidateTag(`storefront_${params.tenantId}`, "max");
}