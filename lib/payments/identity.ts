// T.C. kimlik numarası denetimi (online ödeme, 0185): 11 hane, ilk hane 0
// olamaz, 10. ve 11. hane resmi algoritmayla doğrulanır.
export function normalizeTcKimlik(value: string) {
  return value.replace(/\D/g, "");
}

export function isValidTcKimlik(value: string) {
  const tc = normalizeTcKimlik(value);
  if (!/^[1-9]\d{10}$/.test(tc)) return false;
  const d = tc.split("").map(Number);
  const odd = d[0] + d[2] + d[4] + d[6] + d[8];
  const even = d[1] + d[3] + d[5] + d[7];
  const tenth = (((odd * 7 - even) % 10) + 10) % 10;
  if (tenth !== d[9]) return false;
  const eleventh = d.slice(0, 10).reduce((sum, digit) => sum + digit, 0) % 10;
  return eleventh === d[10];
}
