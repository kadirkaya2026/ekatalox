const ERROR_MAP: Array<[string, string]> = [
  ["Invalid login credentials", "E-posta adresi veya şifre hatalı."],
  ["Email not confirmed", "E-posta adresiniz henüz doğrulanmamış."],
  ["Too many requests", "Çok fazla deneme yapıldı. Lütfen birkaç dakika bekleyin."],
  ["User not found", "Bu e-posta adresiyle kayıtlı hesap bulunamadı."],
  ["Invalid email", "Geçerli bir e-posta adresi girin."],
  ["Password should be at least 6 characters", "Şifre en az 6 karakter olmalıdır."],
  ["signup is disabled", "Yeni kayıt şu an kapalı."],
  ["Email rate limit exceeded", "E-posta limiti aşıldı. Lütfen daha sonra tekrar deneyin."],
];

export function translateAuthError(message: string): string {
  const lower = message.toLowerCase();
  for (const [key, tr] of ERROR_MAP) {
    if (lower.includes(key.toLowerCase())) return tr;
  }
  return "Bir hata oluştu. Lütfen tekrar deneyin.";
}
