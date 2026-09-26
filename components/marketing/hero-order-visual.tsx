import Image from "next/image";
import { ArrowDown, FileText } from "lucide-react";
import { WhatsAppGlyph } from "@/components/marketing/contact-dock";

const WHATSAPP_IMAGE = "/site/order-flow/whatsapp-anonymized.png";
const RECEIPT_IMAGE = "/site/order-flow/receipt-anonymized.png";

export function HeroOrderVisual() {
  return (
    <figure className="mx-auto w-full max-w-[430px] lg:max-w-[450px]">
      <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#F6F2EB] shadow-[0_24px_80px_-30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between gap-3 bg-[#163A2A] px-3 py-2.5 text-white sm:px-4"><span className="flex items-center gap-2 text-xs font-semibold sm:text-sm"><WhatsAppGlyph className="size-5" /> WhatsApp&apos;taki siparişiniz</span><span className="rounded-full bg-white/10 px-2 py-1 text-[9px] font-medium">ÖRNEK AKIŞ</span></div>
        <Image src={WHATSAPP_IMAGE} alt="Bayinin WhatsApp mesajı ve PDF sipariş fişi bağlantısı" width={1536} height={1024} sizes="(max-width: 1023px) calc(100vw - 40px), 560px" priority className="h-auto max-h-[285px] w-full object-cover object-top sm:max-h-[310px]" />
        <a href="#siparis-akisi" className="flex items-center gap-2.5 border-t border-black/10 bg-white px-3 py-3 text-brand-navy transition-colors hover:bg-brand-green-soft sm:px-4"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-green-soft text-brand-green"><FileText className="size-5" aria-hidden /></span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold sm:text-sm">Bağlantının ardında düzenli bir sipariş fişi.</span><span className="mt-0.5 block text-[11px] text-brand-muted">4 kalem · 4 adet · 2.096 ₺</span></span><ArrowDown className="size-4 shrink-0" aria-hidden /></a>
      </div>
      <figcaption className="mt-2 text-center text-[10px] leading-relaxed text-white/55">Gerçek akıştan hazırlanmıştır. Kişisel bilgiler örneklenmiştir.</figcaption>
    </figure>
  );
}

export function OrderFlowProof() {
  const items = [
    { step: "01", title: "Sipariş WhatsApp'ta", body: "Bayiniz, hazırladığı siparişin bağlantısını sizinle paylaşır.", src: WHATSAPP_IMAGE, alt: "Kişisel bilgileri örneklenmiş gerçek WhatsApp sipariş mesajı" },
    { step: "02", title: "Tüm detaylar PDF fişinde", body: "Ürün, adet, birim fiyat ve toplam aynı belgede görünür.", src: RECEIPT_IMAGE, alt: "Kişisel bilgileri örneklenmiş PDF sipariş fişi" },
  ];
  return <div id="siparis-akisi" className="scroll-mt-24"><div className="grid items-start gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-8">{items.map((item) => <figure key={item.step} className="min-w-0"><div className="mb-5 flex items-start gap-3"><span className="pt-1 font-mono text-sm text-brand-green">{item.step}</span><div><h3 className="text-xl font-semibold tracking-tight text-brand-navy">{item.title}</h3><p className="mt-1 text-sm leading-relaxed text-brand-muted">{item.body}</p></div></div><div className="overflow-hidden rounded-2xl border border-brand-line bg-white shadow-sm"><Image src={item.src} alt={item.alt} width={1536} height={1024} sizes="(max-width: 1023px) calc(100vw - 40px), 550px" className="aspect-[3/2] h-auto w-full object-cover object-top" /></div></figure>)}</div><p className="mt-5 text-xs leading-relaxed text-brand-muted">Görseller gerçek sipariş akışından hazırlanmıştır; kişisel bilgiler ve özel sipariş bağlantısı örneklenmiştir.</p></div>;
}
