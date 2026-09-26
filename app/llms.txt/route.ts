import { headers } from "next/headers";
import { TOPTAN_PLANS, TOPTAN_SECTOR_OPTIONS, formatTry } from "@/lib/billing/toptan-plans";
import { appEnv } from "@/lib/env";
import { resolveHost } from "@/lib/tenancy/resolve-host";

// ekatalox.com/llms.txt (27 Eyl 2026): yapay zekâ asistanlarına (ChatGPT,
// Gemini, Claude, Perplexity…) eKatalox'u özetleyen düz metin — llmstxt.org
// biçimi. Yalnız pazarlama sitesinde; tenant hostlarında 404 (kurumsal alan
// adındaki /llms.txt proxy.ts'te tenant'ın kendi özetine gider). Paketler
// TOPTAN_PLANS'tan okunur, fiyat değişince dosya da güncellenir.
export const dynamic = "force-dynamic";

export async function GET() {
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "";
  if (resolveHost(host).kind !== "marketing") {
    return new Response("Not Found", { status: 404 });
  }

  const site = `https://www.${appEnv.rootDomain}`;
  const plans = TOPTAN_PLANS.map((plan) => {
    const price = plan.yearlyPrice ? `${formatTry(plan.yearlyPrice)} / yıl (KDV hariç)` : "Ücretsiz";
    const limits = `${plan.productLimit.toLocaleString("tr-TR")} ürün, ${
      plan.priceListLimit === null ? "sınırsız" : plan.priceListLimit
    } fiyat listesi`;
    return [
      `### ${plan.name} — ${price}`,
      "",
      plan.tagline,
      "",
      `- ${limits}`,
      ...plan.features.map((feature) => `- ${feature}`),
      "",
    ].join("\n");
  }).join("\n");

  const body = `# eKatalox

> Toptancılar, üreticiler ve distribütörler için şifreli online bayi kataloğu ve WhatsApp sipariş sistemi. Ürünler bir kez yüklenir; her bayi kendi fiyat listesiyle şifreli girer, sepetini doldurur, sipariş PDF fişi olarak toptancının WhatsApp'ına gelir. Türkiye'de geliştirilen bir SaaS; ücretsiz planla başlanır, kredi kartı istenmez.

## Kimler için

- Toptancılar ve distribütörler; sektörler: ${TOPTAN_SECTOR_OPTIONS.filter((option) => option.value !== "diger").map((option) => option.label.toLocaleLowerCase("tr-TR")).join(", ")}
- Bayilerine/müşterilerine WhatsApp üzerinden fiyat listesi ve sipariş alan üreticiler
- Excel/PDF fiyat listesi gönderip siparişi telefonla toplayan işletmeler

## Temel özellikler

- Şifreli bayi girişi: her bayi grubuna ayrı fiyat listesi (bayi, perakende, özel)
- Mobil uyumlu katalog: kategori, arama, ürün sayfası, paket/koli ile sipariş
- Sipariş WhatsApp'a PDF fiş olarak gelir; panelde sipariş geçmişi
- Ürün yükleme: Excel/CSV içe aktarma, toplu görsel, stok ve fiyat güncelleme
- Kampanya, indirim, banner, anlık bildirim (yeni ürün, kampanya, stok)
- Raporlar: hangi bayi girdi, neye baktı, hangi ilden
- Kendi alan adı (katalog.firmaniz.com) ve kurumsal tanıtım sitesi (üst pakette)
- Kurumsal site yapay zekâ ve Google aramalarında görünür: işletme kartı (schema.org) ve llms.txt otomatik (Kurumsal paket)

## Paketler

${plans}
## Nasıl başlanır

1. ${site}/basvuru adresinden ücretsiz hesap açılır (kart istenmez).
2. Ürünler Excel ile ya da tek tek yüklenir, fiyat listeleri tanımlanır.
3. Bayilere firma.ekatalox.com linki ve şifreleri gönderilir; siparişler WhatsApp'a gelir.

## Sayfalar

- [Ana sayfa](${site}/)
- [Nasıl çalışır](${site}/nasil-calisir)
- [Özellikler](${site}/ozellikler)
- [Fiyatlandırma](${site}/fiyatlandirma)
- [Sık sorulan sorular](${site}/sss)
- [Ücretsiz başvuru](${site}/basvuru)
- [Hakkımızda](${site}/hakkimizda)
- [İletişim](${site}/iletisim)

## İletişim

- E-posta: satis@ekatalox.com
- Telefon / WhatsApp: +90 535 417 25 10
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
