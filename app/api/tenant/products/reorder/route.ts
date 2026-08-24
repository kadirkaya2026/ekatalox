import { NextResponse } from "next/server";
import { revalidateStorefrontCache } from "@/lib/storefront/cache";
import { getTenantProducts } from "@/lib/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { productReorderRequestSchema } from "@/lib/validators/product";

function isMoveOrderRequest(
  data: { productId?: string; targetOrder?: number; productIds?: string[] },
): data is { productId: string; targetOrder: number } {
  return typeof data.productId === "string" && typeof data.targetOrder === "number";
}

function reorderDemoProducts(
  currentProducts: Awaited<ReturnType<typeof getTenantProducts>>,
  productIds: string[],
) {
  const productMap = new Map(currentProducts.map((product) => [product.id, product]));

  return productIds
    .map((id, index) => {
      const product = productMap.get(id);

      if (!product) {
        return null;
      }

      return {
        ...product,
        display_order: index + 1,
      };
    })
    .filter(Boolean);
}

async function moveProductOrder(
  tenantId: string,
  productId: string,
  targetOrder: number,
) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    const currentProducts = await getTenantProducts(tenantId);
    const sorted = [...currentProducts].sort(
      (left, right) => left.display_order - right.display_order,
    );
    const sourceIndex = sorted.findIndex((product) => product.id === productId);

    if (sourceIndex < 0) {
      return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
    }

    const targetIndex =
      Math.min(Math.max(1, Math.floor(targetOrder)), sorted.length) - 1;

    if (targetIndex !== sourceIndex) {
      const nextProducts = [...sorted];
      const [movedProduct] = nextProducts.splice(sourceIndex, 1);
      nextProducts.splice(targetIndex, 0, movedProduct);
    }

    return NextResponse.json({ success: true });
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, display_order")
    .eq("id", productId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 400 });
  }

  if (!product) {
    return NextResponse.json(
      { error: "Ürün bulunamadı veya bu tenant'a ait değil." },
      { status: 404 },
    );
  }

  const { count, error: countError } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 400 });
  }

  const totalProducts = count ?? 0;

  if (totalProducts === 0) {
    return NextResponse.json({ error: "Sıralanacak ürün bulunamadı." }, { status: 400 });
  }

  const fromOrder = product.display_order as number;
  const clampedTarget = Math.min(Math.max(1, Math.floor(targetOrder)), totalProducts);

  if (clampedTarget === fromOrder) {
    return NextResponse.json({ success: true });
  }

  if (fromOrder > clampedTarget) {
    const { data: affected, error: affectedError } = await supabase
      .from("products")
      .select("id, display_order")
      .eq("tenant_id", tenantId)
      .gte("display_order", clampedTarget)
      .lt("display_order", fromOrder)
      .neq("id", productId);

    if (affectedError) {
      return NextResponse.json({ error: affectedError.message }, { status: 400 });
    }

    const shiftResults = await Promise.all(
      (affected ?? []).map((row) =>
        supabase
          .from("products")
          .update({ display_order: (row.display_order as number) + 1 })
          .eq("id", row.id)
          .eq("tenant_id", tenantId),
      ),
    );

    const shiftError = shiftResults.find((result) => result.error)?.error;

    if (shiftError) {
      return NextResponse.json({ error: shiftError.message }, { status: 400 });
    }
  } else {
    const { data: affected, error: affectedError } = await supabase
      .from("products")
      .select("id, display_order")
      .eq("tenant_id", tenantId)
      .gt("display_order", fromOrder)
      .lte("display_order", clampedTarget)
      .neq("id", productId);

    if (affectedError) {
      return NextResponse.json({ error: affectedError.message }, { status: 400 });
    }

    const shiftResults = await Promise.all(
      (affected ?? []).map((row) =>
        supabase
          .from("products")
          .update({ display_order: (row.display_order as number) - 1 })
          .eq("id", row.id)
          .eq("tenant_id", tenantId),
      ),
    );

    const shiftError = shiftResults.find((result) => result.error)?.error;

    if (shiftError) {
      return NextResponse.json({ error: shiftError.message }, { status: 400 });
    }
  }

  const { error: moveError } = await supabase
    .from("products")
    .update({ display_order: clampedTarget })
    .eq("id", productId)
    .eq("tenant_id", tenantId);

  if (moveError) {
    return NextResponse.json({ error: moveError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

async function reorderAllProducts(tenantId: string, productIds: string[]) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    const currentProducts = await getTenantProducts(tenantId);
    reorderDemoProducts(currentProducts, productIds);
    return NextResponse.json({ success: true });
  }

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id")
    .eq("tenant_id", tenantId)
    .in("id", productIds);

  if (productsError) {
    return NextResponse.json({ error: productsError.message }, { status: 400 });
  }

  if ((products ?? []).length !== productIds.length) {
    return NextResponse.json(
      { error: "Bazı ürünler bulunamadı veya bu tenant'a ait değil." },
      { status: 400 },
    );
  }

  const updateResults = await Promise.all(
    productIds.map((id, index) =>
      supabase
        .from("products")
        .update({ display_order: index + 1 })
        .eq("id", id)
        .eq("tenant_id", tenantId),
    ),
  );

  const updateError = updateResults.find((result) => result.error)?.error;

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;
  const body = await request.json();
  const parsed = productReorderRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Sıralama verisi geçersiz." },
      { status: 400 },
    );
  }

  const response = isMoveOrderRequest(parsed.data)
    ? await moveProductOrder(tenant.id, parsed.data.productId, parsed.data.targetOrder)
    : await reorderAllProducts(tenant.id, parsed.data.productIds);

  // Siralama vitrinde urun dizilisini degistiriyor; onbellek tazelenmezse
  // musteri eski sirayi gormeye devam ediyordu.
  if (response.ok) {
    revalidateStorefrontCache({ tenantId: tenant.id, subdomain: tenant.subdomain });
  }

  return response;
}
