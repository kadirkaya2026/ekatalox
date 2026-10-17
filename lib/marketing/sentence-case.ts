// Görünen başlıkları cümle düzenine çevirir (14 Eki 2026 taslak): "Excel ile
// Toplu Ürün Yükleme" → "Excel ile toplu ürün yükleme". Marka/kısaltma
// sözcükleri korunur; iki nokta sonrası sözcük küçülür. Türkçe İ/I kuralı.
const KEEP = new Set(["WhatsApp", "Excel", "PDF", "eKatalox", "QR", "ZIP", "Google", "Bing", "URL", "SKU", "iOS", "Android", "Instagram", "BizimHesap", "MarketGo", "İyzico", "iyzico", "PayTR", "Paytr", "Paynet", "CSV", "KVKK", "SEO", "ChatGPT", "IP", "VELIRA"]);

function lowerTr(word: string) {
  return word.replace(/İ/g, "i").replace(/I/g, "ı").toLocaleLowerCase("tr-TR");
}

export function sentenceCaseTr(text: string): string {
  const words = text.split(" ");
  let first = true;
  return words
    .map((raw) => {
      const core = raw.replace(/^[("“]+|[)",:;.!?”]+$/g, "");
      if (!core) return raw;
      if (first) {
        first = false;
        return raw;
      }
      if (KEEP.has(core) || /^[A-ZÇĞİÖŞÜ0-9]{2,}$/.test(core) || /\d/.test(core)) return raw;
      return raw.replace(core, lowerTr(core));
    })
    .join(" ");
}
