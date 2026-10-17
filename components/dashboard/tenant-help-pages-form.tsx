"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { InlineAlert } from "@/components/ui/inline-alert";
import { SettingsTabShell } from "@/components/dashboard/settings-tab-shell";
import { MAX_FAQ_ITEMS, type HelpFaqItem, type HelpPages } from "@/lib/storefront/help-pages";

// Ayarlar → Yardım Sayfaları (0184, 17 Eki 2026): market vitrininde Hesabım >
// Yardım'da görünen sayfalar. İletişim bilgileri Footer ayarlarından, sözleşmeler
// Yasal Bilgiler'den gelir; burada yalnız mağazanın kendi yazdığı metinler.
export function TenantHelpPagesForm({ initial, storeUrl }: { initial: HelpPages; storeUrl: string }) {
  const [about, setAbout] = useState(initial.about);
  const [supportNote, setSupportNote] = useState(initial.support_note);
  const [faq, setFaq] = useState<HelpFaqItem[]>(initial.faq.length ? initial.faq : [{ q: "", a: "" }]);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const updateFaq = (index: number, patch: Partial<HelpFaqItem>) =>
    setFaq((list) => list.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const moveFaq = (index: number, delta: number) =>
    setFaq((list) => {
      const next = [...list];
      const target = index + delta;
      if (target < 0 || target >= next.length) return list;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  async function save() {
    setPending(true);
    setMessage(null);
    const response = await fetch("/api/tenant/settings/help", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ about, support_note: supportNote, faq: faq.filter((item) => item.q.trim() && item.a.trim()) }),
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as { error?: string } | null;
    setPending(false);
    setMessage(
      response?.ok
        ? { tone: "success", text: "Kaydedildi. Vitrinde Hesabım > Yardım'da görünür." }
        : { tone: "error", text: result?.error ?? "Kaydedilemedi." },
    );
  }

  return (
    <div className="space-y-4">
      <SettingsTabShell
        layoutId="help-pages-tabs"
        tabs={[
          { key: "support", label: "Müşteri Hizmetleri" },
          { key: "about", label: "Hakkımızda" },
          { key: "faq", label: "Sıkça Sorulan Sorular" },
        ]}
        panels={{
          support: (
            <Card className="space-y-3 p-5">
              <p className="text-sm text-slate-600">
                Telefon, WhatsApp, e-posta ve adres <a href="/settings/footer" className="font-semibold text-emerald-700 underline">Footer ayarlarından</a>{" "}
                alınır. Buraya çalışma saatleri ya da müşterinize iletmek istediğiniz kısa bir not yazabilirsiniz.
              </p>
              <Textarea
                rows={4}
                value={supportNote}
                onChange={(e) => setSupportNote(e.target.value)}
                placeholder="Örn: Her gün 09:00–23:00 arası telefon ve WhatsApp'tan ulaşabilirsiniz."
              />
            </Card>
          ),
          about: (
            <Card className="space-y-3 p-5">
              <p className="text-sm text-slate-600">Mağazanızı tanıtan metin. Boş bırakırsanız Yardım&apos;da görünmez.</p>
              <Textarea
                rows={12}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Örn: 2010&apos;dan beri mahallemize taze ürünü kapınıza getiriyoruz…"
              />
            </Card>
          ),
          faq: (
            <Card className="space-y-4 p-5">
              <p className="text-sm text-slate-600">
                Müşterilerinizin sık sorduğu sorular. Vitrinde açılır-kapanır liste olarak görünür.
              </p>
              {faq.map((item, index) => (
                <div key={index} className="space-y-2 rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Soru {index + 1}</span>
                    <div className="ml-auto flex items-center gap-1">
                      <Button type="button" variant="ghost" onClick={() => moveFaq(index, -1)} disabled={index === 0} aria-label="Yukarı taşı">
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => moveFaq(index, 1)} disabled={index === faq.length - 1} aria-label="Aşağı taşı">
                        <ArrowDown className="size-4" />
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setFaq((list) => list.filter((_, i) => i !== index))} aria-label="Sil">
                        <Trash2 className="size-4 text-rose-500" />
                      </Button>
                    </div>
                  </div>
                  <Input value={item.q} onChange={(e) => updateFaq(index, { q: e.target.value })} placeholder="Örn: Teslimat ne kadar sürer?" />
                  <Textarea rows={3} value={item.a} onChange={(e) => updateFaq(index, { a: e.target.value })} placeholder="Cevap" />
                </div>
              ))}
              <Button
                type="button"
                variant="secondary"
                disabled={faq.length >= MAX_FAQ_ITEMS}
                onClick={() => setFaq((list) => [...list, { q: "", a: "" }])}
              >
                <Plus className="size-4" />
                Soru ekle
              </Button>
            </Card>
          ),
        }}
      />
      <InlineAlert tone={message?.tone ?? "success"} message={message?.text ?? null} />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => void save()} disabled={pending}>
          {pending ? "Kaydediliyor…" : "Kaydet"}
        </Button>
        <a href={`${storeUrl}/yardim`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
          Vitrinde gör <ExternalLink className="size-4" />
        </a>
      </div>
    </div>
  );
}
