/**
 * Ürün görselini sepet butonuna doğru uçuran parabol animasyonu.
 *
 * Hareket matematiği https://github.com/amibug/fly (jquery.fly, "copy from
 * tmall.com") eklentisinden birebir alındı (kullanıcı isteği, 1 Eyl 2026),
 * jQuery'siz uyarlandı: yatayda sabit hız, dikeyde gerçek parabol
 * (y = curvature * (x - vertex_left)^2 + vertex_top), boyut küçülmesi yalnız
 * ikinci yarıda kosinüs eğrisiyle, solma yok. Adım sayısı da eklentinin
 * mesafeye göre log ölçekli formülüyle hesaplanır.
 *
 * React dışında, doğrudan DOM üzerinde çalışır: kartın görselinin bir
 * kopyasını `position: fixed` bir hayalet olarak sayfaya bırakır,
 * requestAnimationFrame ile taşır, sonra siler.
 *
 * Kaynak:  [data-fly-source="<product.id>"]  — ürün kartındaki görsel kutusu
 * Hedef:   [data-cart-target]                — o an ekranda görünen sepet butonu
 *          (masaüstünde header, mobilde alt bar; hangisi görünürse o)
 */

// jquery.fly varsayılanları
const SPEED = 1.2;
const VERTEX_RTOP = 20; // tepe noktasının ekran üstüne en fazla yaklaşacağı top değeri

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
    marginTop: "0px",
    marginLeft: "0px",
    borderRadius: "16px",
    overflow: "hidden",
    background: "#ffffff",
    boxShadow: "0 12px 34px rgba(15, 23, 42, 0.22)",
    pointerEvents: "none",
    zIndex: "70",
    willChange: "left, top, width, height",
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

  // ---- jquery.fly (amibug/fly) hesabı ----------------------------------
  // start/end: sol-üst köşeler; hedefte görsel, sepet butonunun ortasına
  // küçülerek iner (eklentideki end.width/height senaryosu).
  const endSize = Math.max(20, Math.min(48, Math.min(to.width, to.height) * 0.7));
  const start = { left: from.left, top: from.top, width: from.width, height: from.height };
  const end = {
    left: to.left + to.width / 2 - endSize / 2,
    top: to.top + to.height / 2 - endSize / 2,
    width: endSize,
    height: endSize,
  };

  // Tepe noktası: iki noktanın üstünde, yatay mesafenin 1/3'ü kadar yukarıda.
  let vertexTop = Math.min(start.top, end.top) - Math.abs(start.left - end.left) / 3;
  if (vertexTop < VERTEX_RTOP) {
    // Başlangıç ya da bitiş zaten eğrinin tepesi olabilir.
    vertexTop = Math.min(VERTEX_RTOP, Math.min(start.top, end.top));
  }

  const distance = Math.sqrt(
    Math.pow(start.top - end.top, 2) + Math.pow(start.left - end.left, 2),
  );
  // Eklentinin adım formülü: mesafeye göre log ölçekli, 30..100 kare / speed.
  const steps = Math.ceil(
    Math.min(Math.max(Math.log(distance) / 0.05 - 75, 30), 100) / SPEED,
  );
  const ratio =
    start.top === vertexTop
      ? 0
      : -Math.sqrt((end.top - vertexTop) / (start.top - vertexTop));
  const vertexLeft = (ratio * start.left - end.left) / (ratio - 1);
  // Tepe left'i bitiş left'ine eşitse eğrilik 0: düz çizgi.
  const curvature =
    end.left === vertexLeft
      ? 0
      : (end.top - vertexTop) / Math.pow(end.left - vertexLeft, 2);

  return new Promise<void>((resolve) => {
    let count = -1;

    const move = () => {
      const left = start.left + ((end.left - start.left) * count) / steps;
      const top =
        curvature === 0
          ? start.top + ((end.top - start.top) * count) / steps
          : curvature * Math.pow(left - vertexLeft, 2) + vertexTop;

      // Boyut ilk yarıda sabit, ikinci yarıda kosinüsle end boyutuna iner.
      const half = steps / 2;
      const width =
        end.width -
        (end.width - start.width) *
          Math.cos(count < half ? 0 : ((count - half) / (steps - half)) * (Math.PI / 2));
      const height =
        end.height -
        (end.height - start.height) *
          Math.cos(count < half ? 0 : ((count - half) / (steps - half)) * (Math.PI / 2));

      ghost.style.left = `${left}px`;
      ghost.style.top = `${top}px`;
      ghost.style.width = `${width}px`;
      ghost.style.height = `${height}px`;

      count += 1;

      if (count > steps) {
        ghost.remove();
        // sepet butonu görseli "yakalar" gibi bir tık zıplasın
        target.animate(
          [
            { transform: "scale(1)" },
            { transform: "scale(1.12)" },
            { transform: "scale(1)" },
          ],
          { duration: 260, easing: "cubic-bezier(0.34, 1.4, 0.64, 1)" },
        );
        resolve();
        return;
      }

      window.requestAnimationFrame(move);
    };

    move();
  });
}
