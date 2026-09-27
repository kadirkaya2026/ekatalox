import { WHOLESALE_SECTORS } from "@/lib/marketing/sectors";
import { getBlogPosts } from "@/lib/marketing/blog";
import { MARKETING_FEATURES } from "@/lib/marketing/features";
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
    const price = plan.yearlyPrice ? `${formatTry(plan.yearlyPrice)} / yıl (KDV hariç)` : "0 ₺, süresiz";
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

> Toptancılar, üreticiler ve distribütörler için şifreli online bayi kataloğu ve WhatsApp sipariş sistemi. Ürünler bir kez yüklenir; her bayi kendi fiyat listesiyle şifreli girer, sepetini doldurur, oluşan PDF sipariş fişi bağlantısını WhatsApp üzerinden paylaşır. Türkiye'de geliştirilen bir SaaS; ücretsiz planla başlanır, kredi kartı istenmez.

## Kimler için

- Toptancılar ve distribütörler; sektörler: ${TOPTAN_SECTOR_OPTIONS.filter((option) => option.value !== "diger").map((option) => option.label.toLocaleLowerCase("tr-TR")).join(", ")}
- Bayilerine/müşterilerine WhatsApp üzerinden fiyat listesi ve sipariş alan üreticiler
- Excel/PDF fiyat listesi gönderip siparişi telefonla toplayan işletmeler

## Temel özellikler

- Şifreli bayi girişi: her bayi grubuna ayrı fiyat listesi (bayi, perakende, özel)
- Mobil uyumlu katalog: kategori, arama, ürün sayfası, paket/koli ile sipariş
- Bayi PDF sipariş fişi bağlantısını WhatsApp üzerinden gönderir; kayıtlar panelde Siparişlerim sayfasından takip edilir. Bildirimleri açan yöneticilere yeni sipariş bildirimi gelir.
- WhatsApp alıcısı: işletmenin kayıtlı numarası veya müşterinin seçtiği kişi
- Sipariş kuralları: minimum sepet tutarı (tek para birimli sepet), müşteri alanlarının görünürlük ve zorunluluk seçimi
- Mağaza iletişimi: açılış duyurusu, çalışma saatleri ve mağaza kapalı mesajı
- Kurumsal pakete dahil kurumsal site ve Bayimiz ol formu; başvuruları panelden inceleme
- İyzico/Paytr entegrasyonuyla kataloğunuzdan ödeme alın. Sağlayıcı sözleşmesi ve işlem ücretleri ayrıca değerlendirilir.
- Ürün yükleme: Excel/CSV içe aktarma, toplu görsel, stok ve fiyat güncelleme
- Kampanya, indirim, banner, anlık bildirim (yeni ürün, kampanya, stok)
- Raporlar: ürün aramaları, görüntülenmeler, sepete eklemeler ve il–fiyat listesi girişleri
- Kendi alan adı (katalog.firmaniz.com) ve kurumsal tanıtım sitesi (üst pakette)
- Kurumsal sitenin herkese açık tanıtım sayfaları arama motorlarının taramasına uygundur; yapılandırılmış veri ve llms.txt içerir. Aramalarda yer alma ve sıralama garantisi verilmez. Fiyat erişimi katalog şifreleriyle yönetilir.

## Paketler

${plans}
## Nasıl başlanır

1. ${site}/basvuru adresinden ücretsiz hesap açılır (kart istenmez).
2. Ürünler Excel ile ya da tek tek yüklenir, fiyat listeleri tanımlanır.
3. Bayilere firma.ekatalox.com linki ve şifreleri gönderilir; bayiler PDF sipariş fişi bağlantısını WhatsApp üzerinden paylaşır.

## Sayfalar

- [Ana sayfa](${site}/)
- [Nasıl çalışır](${site}/nasil-calisir)
- [Özellikler](${site}/ozellikler)
- [Fiyatlandırma](${site}/fiyatlandirma)
- [Sık sorulan sorular](${site}/sss)
- [Ücretsiz başvuru](${site}/basvuru)
- [Hakkımızda](${site}/hakkimizda)
- [İletişim](${site}/iletisim)

## Ayrıntılı özellikler

${MARKETING_FEATURES.map((feature) => `- [${feature.title}](${site}/ozellikler/${feature.slug})`).join("\n")}

## Sektöre özel kullanım

Tüm sektörlerde yabancı müşteriler için İngilizce, Almanca ve Rusça katalog dil seçenekleri mevcuttur. Müşteri dil menüsünden tercih ettiği dili seçebilir.

- [Sektörler](${site}/sektorler)
${WHOLESALE_SECTORS.map((sector) => `- [${sector.name}](${site}/sektorler/${sector.slug}): ${sector.description}`).join("\n")}
- [Market ve bakkallar için WhatsApp sipariş sistemi](${site}/sektorler/market-bakkal)
- Market müşterisi isteğe bağlı konum paylaşabilir; konum bağlantısı WhatsApp sipariş mesajına eklenir. Mobilde sabit alt sepet bulunur.
- Kampanya bildirimleri izin veren müşterilere, paket kapsamına göre gönderilir.
- Market işletmelerine Kurumsal (Full) pakette 200 adet QR kodlu magnet hediye edilir.
- Market ve toptancı paket fiyatları ortaktır; kullanım sunumu sektöre göre değişir.
- [MarketGo demo mağazası](https://marketgo.ekatalox.com)
- [VELIRA tekstil ve giyim demosu](https://demo-giyim.ekatalox.com/): Giyim kategorileri ve görselli ürün kataloğu.

## Rehberler

- [Blog](${site}/blog)
${getBlogPosts().map((post) => `- [${post.title}](${site}/blog/${post.slug})`).join("\n")}

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
