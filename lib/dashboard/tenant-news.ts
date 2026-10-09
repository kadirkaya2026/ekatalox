import { Layers, Pencil, Trash2, UserRound, Warehouse, XCircle } from "lucide-react";

// Mağazaya özel "Yenilikler" penceresi (10 Eki 2026, Lucatech). Panele giren her
// cihazda bir kez açılır; kapatılınca o cihazda (localStorage) bir daha çıkmaz.
// Yalnız NEWS'te kimliği olan mağazada ve başlangıç tarihinden itibaren görünür.
export type NewsItem = { icon: typeof Pencil; title: string; body: string };
export type TenantNews = { id: string; from: string; until: string; title: string; items: NewsItem[] };

export const TENANT_NEWS: Record<string, TenantNews> = {
  // Lucatech (toptan.lucatech.com.tr)
  "ebeeec82-7cd9-4ab8-bea9-f3dc2a5bfe0c": {
    id: "lucatech-siparis-bizimhesap-2026-10-10",
    from: "2026-10-10",
    until: "2026-10-31",
    title: "Sipariş ve BizimHesap yenilikleri",
    items: [
      { icon: Pencil, title: "Düzelt", body: "Gelen siparişte adetleri değiştirebilir, ürün ekleyip çıkarabilirsiniz. Bayinin yeniden sipariş vermesine gerek yok." },
      { icon: XCircle, title: "İptal", body: "Siparişler onay sorusuyla iptal edilir ve İptal sekmesine taşınır. Oradan iptali geri alabilir ya da siparişi kalıcı olarak silebilirsiniz." },
      { icon: Layers, title: "Toplu işlem", body: "Tümünü seçerek ya da tek tek işaretleyerek siparişleri topluca iptal edebilir veya silebilirsiniz." },
      { icon: Warehouse, title: "Depo seçimi", body: "Camlar varsayılan olarak Kırılmaz Cam Bahçelievler deposundan fişlenir. Onay ekranında her ürünün deposunu o sipariş için değiştirebilirsiniz. Ürünlerin varsayılan deposu Ürünler > BizimHesap Eşleştirme ekranından ayarlanır." },
      { icon: UserRound, title: "Cari", body: "BizimHesap'ta seçilen cari, siparişler listesinde müşteri adı olarak görünür." },
      { icon: Trash2, title: "Fiş numarası", body: "BizimHesap fişlerinde artık EKX- ile başlayan sipariş numarası yazmaz." },
    ],
  },
};

/** Bu mağazanın şu an gösterilecek duyurusu var mı (Türkiye tarihine göre). */
export function hasTenantNews(tenantId: string) {
  const news = TENANT_NEWS[tenantId];
  if (!news) return false;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());
  return today >= news.from && today <= news.until;
}

