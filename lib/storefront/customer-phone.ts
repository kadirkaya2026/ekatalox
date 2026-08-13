// Sipariş kaydı ve telefonla otomatik doldurma arama sorgusu aynı
// normalizasyonu kullanmalı — aksi halde "0532 111 22 33" ile "5321112233"
// farklı müşteri sayılır. Sadece rakamları tutuyoruz, ülke kodu/başındaki
// sıfır varsayımı yapmıyoruz (DE/EN/RU vitrinlerde de kullanılabilir).
export function normalizeCustomerPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function isLikelyCompletePhone(phone: string): boolean {
  return normalizeCustomerPhone(phone).length >= 10;
}
