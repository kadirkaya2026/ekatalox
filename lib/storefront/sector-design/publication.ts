import { readDesignDocument, type DesignDocument } from "./config";
export function publicationRevision(raw: unknown): string {
  const meta = raw && typeof raw === "object" ? (raw as Record<string, unknown>)._publication : null;
  if (meta && typeof meta === "object" && typeof (meta as Record<string, unknown>).id === "string") return (meta as {id:string}).id;
  return `legacy:${JSON.stringify(raw ?? null)}`;
}
export function previousPublication(raw: unknown, sector: string | null | undefined): DesignDocument | null {
  if (!raw || typeof raw !== "object") return null;
  const meta = (raw as { _publication?: { previous?: unknown } })._publication;
  return readDesignDocument(meta?.previous, sector);
}
