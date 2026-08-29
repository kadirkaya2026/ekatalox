"use client";

import { useEffect } from "react";

// Sayfa açılır açılmaz yazdırma penceresi; üstte kağıt genişliği seçimi
// (58 / 80 mm) ve tekrar yazdır. Yazdırırken bu şerit gizlenir.
export function ReceiptPrintControls({ width }: { width: 58 | 80 }) {
  useEffect(() => {
    const t = window.setTimeout(() => window.print(), 300);
    return () => window.clearTimeout(t);
  }, []);
  const other = width === 80 ? 58 : 80;
  return (
    <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, display: "flex", gap: 8, alignItems: "center", justifyContent: "center", padding: 8, background: "#0f172a", color: "#fff", fontFamily: "system-ui, sans-serif", fontSize: 13 }}>
      <button type="button" onClick={() => window.print()} style={{ background: "#10b981", color: "#fff", border: 0, borderRadius: 999, padding: "6px 14px", fontWeight: 600 }}>
        Yazdır
      </button>
      <a href={`?w=${other}`} style={{ color: "#cbd5e1", textDecoration: "underline" }}>
        {other} mm kağıt
      </a>
      <button type="button" onClick={() => window.close()} style={{ background: "transparent", color: "#cbd5e1", border: "1px solid #475569", borderRadius: 999, padding: "5px 12px" }}>
        Kapat
      </button>
    </div>
  );
}
