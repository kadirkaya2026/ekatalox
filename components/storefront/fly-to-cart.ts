/**
 * Ürün görselini sepet butonuna doğru uçuran kısa animasyon.
 *
 * React dışında, doğrudan DOM üzerinde çalışır: kartın görselinin bir
 * kopyasını `position: fixed` bir hayalet olarak sayfaya bırakır, sepete
 * kadar küçülterek taşır, sonra siler. Böylece uçuş sırasında hiçbir
 * yeniden render tetiklenmez ve uzun ürün listelerinde takılma olmaz.
 *
 * Kaynak:  [data-fly-source="<product.id>"]  — ürün kartındaki görsel kutusu
 * Hedef:   [data-cart-target]                — o an ekranda görünen sepet butonu
 *          (masaüstünde header, mobilde alt bar; hangisi görünürse o)
 */

const FLIGHT_MS = 520;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function visibleCartTarget(): HTMLElement | null {
  const nodes = Array.from(
    document.querySelectorAll<HTMLElement>("[data-cart-target]"),
  );

  for (const node of nodes) {
    // offsetParent null ise display:none; ölçüsü sıfırsa da uçacak yer yok
    if (node.offsetParent === null) continue;
    const rect = node.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return node;
  }

  return null;
}

function escapeId(value: string) {
  return typeof CSS !== "undefined" && typeof CSS.escape === "function"
    ? CSS.escape(value)
    : value.replace(/["\\]/g, "\\$&");
}

/**
 * Uçuşu başlatır. Animasyon bittiğinde (ya da hiç çalışamadıysa hemen)
 * çözülen bir promise döner — sepet rozetinin sayısı bu anda artırılır.
 */
export function flyToCart(productId: string): Promise<void> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.resolve();
  }
  if (prefersReducedMotion()) return Promise.resolve();

  const source = document.querySelector<HTMLElement>(
    `[data-fly-source="${escapeId(productId)}"]`,
  );
  const target = visibleCartTarget();
  if (!source || !target) return Promise.resolve();

  const image = source.querySelector("img");
  const from = (image ?? source).getBoundingClientRect();
  const to = target.getBoundingClientRect();
  if (!from.width || !from.height || !to.width) return Promise.resolve();

  const ghost = document.createElement("div");
  ghost.setAttribute("aria-hidden", "true");
  Object.assign(ghost.style, {
    position: "fixed",
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    borderRadius: "16px",
    overflow: "hidden",
    background: "#ffffff",
    boxShadow: "0 12px 34px rgba(15, 23, 42, 0.22)",
    pointerEvents: "none",
    zIndex: "70",
    willChange: "transform, opacity",
  } satisfies Partial<CSSStyleDeclaration>);

  if (image) {
    const clone = image.cloneNode(true) as HTMLImageElement;
    clone.removeAttribute("sizes");
    clone.removeAttribute("srcset");
    clone.removeAttribute("loading");
    Object.assign(clone.style, {
      width: "100%",
      height: "100%",
      objectFit: "contain",
      padding: "8px",
    } satisfies Partial<CSSStyleDeclaration>);
    ghost.appendChild(clone);
  }

  document.body.appendChild(ghost);

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  // sepette görselin sığacağı boy: butonun kısa kenarının %70'i
  const scale = Math.max(
    0.1,
    Math.min(1, (Math.min(to.width, to.height) * 0.7) / Math.max(from.width, from.height)),
  );
  // ortada hafif bir kavis: önce yukarı kalkıp sonra sepete düşsün
  const lift = Math.min(46, Math.max(18, Math.abs(dy) * 0.22));

  const flight = ghost.animate(
    [
      { transform: "translate(0px, 0px) scale(1)", opacity: 1, offset: 0 },
      {
        transform: `translate(${dx * 0.45}px, ${dy * 0.3 - lift}px) scale(${(1 + scale) / 2})`,
        opacity: 0.96,
        offset: 0.45,
      },
      {
        transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
        opacity: 0.2,
        offset: 1,
      },
    ],
    { duration: FLIGHT_MS, easing: "cubic-bezier(0.4, 0.06, 0.2, 1)", fill: "forwards" },
  );

  return flight.finished
    .catch(() => undefined)
    .then(() => {
      ghost.remove();
      // sepet butonu görseli "yakalar" gibi bir tık zıplasın
      target.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.16)" },
          { transform: "scale(1)" },
        ],
        { duration: 280, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
      );
    });
}
