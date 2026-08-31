// Sipariş kaydı ve telefonla otomatik doldurma arama sorgusu aynı
// normalizasyonu kullanmalı — aksi halde "0532 111 22 33" ile "5321112233"
// farklı müşteri sayılır.
//
// TR numaraları TEK BİÇİME iner (kullanıcı kararı, 31 Ağu 2026): mobil
// numara hangi biçimde yazılırsa yazılsın (+90 532…, 90532…, 532…, 0532…)
// kanonik hali "05321112233" olur — müşteri defteri/otomatik doldurma/
// engelleme hepsi aynı kaydı görür. Yabancı numaralara (ör. 49171…)
// dokunulmaz; ülke kodu varsayımı yapılmaz (DE/EN/RU vitrinler).
export function normalizeCustomerPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (/^00905\d{9}$/.test(digits)) return `0${digits.slice(4)}`;
  if (/^905\d{9}$/.test(digits)) return `0${digits.slice(2)}`;
  if (/^5\d{9}$/.test(digits)) return `0${digits}`;

  return digits;
}

export function isLikelyCompletePhone(phone: string): boolean {
  return normalizeCustomerPhone(phone).length >= 10;
}

// Checkout'ta telefon biçim kontrolü (kullanıcı kararı: TR numarası mutlaka
// 05xx… biçimine oturmalı; yabancı müşteri + ve ülke koduyla girer).
// Dönen değer: kanonik biçim, ya da null (geçersiz).
export function validateCustomerPhoneInput(phone: string): string | null {
  const trimmed = phone.trim();
  const normalized = normalizeCustomerPhone(trimmed);

  // TR mobil — tüm yazımlar normalize ile bu biçime iner.
  if (/^05\d{9}$/.test(normalized)) return normalized;

  // Yabancı numara: açıkça + ile ülke kodu yazılmış olmalı (+90 hariç —
  // o zaten yukarıda TR biçimine indi). En az 10 rakam.
  if (trimmed.startsWith("+") && normalized.length >= 10) return normalized;

  return null;
}
