// Kullanım Şartları metninin yürürlük sürümü.
//
// terms_acceptances tablosuna bu değer yazılıyor: bir uyuşmazlıkta bayinin
// HANGİ metni kabul ettiğini gösterebilmek için sürüm şart. Metin esaslı
// biçimde değiştiğinde (sorumluluk, ücret, fesih maddeleri) bu sabit de
// güncellenmeli — aksi halde eski ve yeni kabuller ayırt edilemez.
//
// app/kullanim-sartlari/page.tsx içindeki "Son güncelleme" ifadesi bu
// sabitten üretiliyor ki ikisi birbirinden kopmasın.
export const TERMS_VERSION = "2026-08-22";

export const TERMS_VERSION_LABEL = "22 Ağustos 2026";
