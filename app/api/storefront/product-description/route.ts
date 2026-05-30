import { NextResponse } from "next/server";
import { getStorefrontProductDescription, getStorefrontTenant } from "@/lib/data";
import {
  isStorefrontTierStateValid,
  readStorefrontTier,
} from "@/lib/storefront/session";
import { storefrontProductDescriptionSchema } from "@/lib/validators/product";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = storefrontProductDescriptionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "İstek verisi hatalı." },
      { status: 400 },
    );
  }

  const tenant = await getStorefrontTenant(parsed.data.subdomain);

  if (!tenant || tenant.status !== "active") {
    return NextResponse.json({ error: "Mağaza bulunamadı." }, { status: 404 });
  }

  const tierState = await readStorefrontTier(parsed.data.subdomain);

  if (!tierState || !isStorefrontTierStateValid({ cookieState: tierState, tenant })) {
    return NextResponse.json(
      { error: "Bu içeriği görüntülemek için giriş yapmalısınız." },
      { status: 401 },
    );
  }

  const result = await getStorefrontProductDescription(
    tenant.id,
    parsed.data.productId,
  );

  if (!result.found) {
    return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({ description: result.description });
}
