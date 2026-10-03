"use client";

import { useRef, useState, type CSSProperties } from "react";

// Sepetteki adet elle yazılabilir (3 Eki 2026, İsego: "1 Koli"ye yanlışlıkla
// basan 100 kez − basmak zorunda kalmasın). Kutu yazarken serbest kalır:
// geçerli bir sayı (>0) anında uygulanır, boş/0 ise çıkışta (blur/Enter)
// karar verilir — boş bırakılırsa eski adet geri gelir, 0 yazılırsa satır
// sepetten çıkar. Odaktayken dışarıdan gelen değer taslağın üstüne yazılmaz.
export function CartQuantityInput({
  value,
  onCommit,
  className,
  style,
  ariaLabel,
}: {
  value: number;
  onCommit: (quantity: number) => void;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
}) {
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);
  const [lastValue, setLastValue] = useState(value);
  const cancelRef = useRef(false);

  if (!focused && value !== lastValue) {
    setLastValue(value);
    setDraft(String(value));
  }

  function finish() {
    setFocused(false);
    if (cancelRef.current) {
      cancelRef.current = false;
      setDraft(String(value));
      return;
    }
    const quantity = Number.parseInt(draft, 10);
    if (!Number.isFinite(quantity)) {
      setDraft(String(value));
      return;
    }
    if (quantity !== value) onCommit(quantity);
    setDraft(String(quantity > 0 ? quantity : value));
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      enterKeyHint="done"
      value={draft}
      aria-label={ariaLabel}
      onFocus={(event) => {
        setFocused(true);
        event.currentTarget.select();
      }}
      onChange={(event) => {
        const next = event.target.value.replace(/\D/g, "").slice(0, 6);
        setDraft(next);
        const quantity = Number.parseInt(next, 10);
        if (Number.isFinite(quantity) && quantity > 0 && quantity !== value) onCommit(quantity);
      }}
      onBlur={finish}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") {
          cancelRef.current = true;
          event.currentTarget.blur();
        }
      }}
      className={className}
      style={{ fontSize: "16px", ...style }}
    />
  );
}
