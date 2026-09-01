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

const FLIGHT_MS = 720;

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

  // Gerçek bir yay (quadratic bézier): görsel önce hafifçe yükselip yana
  // açılır, sonra sepete süzülerek iner — düz çizgide "füze gibi" gitmesin.
  // Kontrol noktası: yatayda yolun ~%40'ı, dikeyde belirgin bir tepe.
  const lift = Math.min(150, Math.max(70, Math.abs(dy) * 0.35));
  const cpX = dx * 0.4;
  const cpY = Math.min(dy * 0.25, 0) - lift;
  // Kavis yönüne doğru minik bir eğilme — kartondan fırlamış gibi değil,
  // sepete bırakılıyormuş gibi dursun.
  const tilt = Math.max(-10, Math.min(10, dx * 0.02));

  const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const STEPS = 16;
  const frames: Keyframe[] = [];

  for (let i = 0; i <= STEPS; i += 1) {
    const t = easeInOut(i / STEPS);
    const x = 2 * (1 - t) * t * cpX + t * t * dx;
    const y = 2 * (1 - t) * t * cpY + t * t * dy;
    // Başta minik bir "kalkış büyümesi", sonra sepete doğru küçülme.
    const pop = t < 0.18 ? 1 + 0.06 * (t / 0.18) : 1.06 - (1.06 - scale) * ((t - 0.18) / 0.82);
    // Yol boyunca tam görünür kalsın, sadece son ~%20'de eriyerek insin.
    const fade = t < 0.8 ? 1 : 1 - ((t - 0.8) / 0.2) * 0.85;
    frames.push({
      transform: `translate(${x}px, ${y}px) scale(${pop}) rotate(${tilt * Math.sin(Math.PI * t)}deg)`,
      opacity: fade,
      offset: i / STEPS,
    });
  }

  const flight = ghost.animate(frames, {
    duration: FLIGHT_MS,
    easing: "linear", // hız profili keyframe offset'lerinde (easeInOut) taşınıyor
    fill: "forwards",
  });

  return flight.finished
    .catch(() => undefined)
    .then(() => {
      ghost.remove();
      // sepet butonu görseli "yakalar" gibi bir tık zıplasın
      target.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.12)" },
          { transform: "scale(0.98)" },
          { transform: "scale(1)" },
        ],
        { duration: 340, easing: "cubic-bezier(0.34, 1.4, 0.64, 1)" },
      );
    });
}
