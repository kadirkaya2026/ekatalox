const MAX_SEARCH_QUERY_LENGTH = 80;

export function normalizeSearchQuery(value: string) {
  return value.trim().toLocaleLowerCase("tr-TR").slice(0, MAX_SEARCH_QUERY_LENGTH);
}
