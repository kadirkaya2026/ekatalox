import { revalidatePath, revalidateTag } from "next/cache";

export function revalidateStorefrontCache(params: {
  tenantId: string;
  subdomain: string;
}) {
  revalidatePath(`/store/${params.subdomain}`);
  revalidatePath(`/store/${params.subdomain}/gate`);
  revalidatePath(`/store/${params.subdomain}/kurumsal`);
  revalidateTag(`storefront_${params.tenantId}`, "max");
  revalidateTag(`tenant_subdomain_${params.subdomain}`, "max");
}