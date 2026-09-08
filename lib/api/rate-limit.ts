// Basit, instance içi IP frenleme (customer-lookup ve site-analytics ile aynı yaklaşım).
const buckets = new Map<string, { count: number; resetAt: number }>();
const MAX_ENTRIES = 5000;

export function isRateLimited(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) {
    if (buckets.size >= MAX_ENTRIES) buckets.clear();
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > max;
}
