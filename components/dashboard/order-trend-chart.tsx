"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Point = { date: string; count: number; amount: number };

// Grafik kütüphanesi yok (repo geleneği): Genel Bakış ciro grafiği elle SVG.
const H = 240;
const PAD = { l: 56, r: 12, t: 12, b: 28 };
const MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

function dayLabel(iso: string) {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

// Eksen etiketi: 148.650 → 149B, 1.250.000 → 1,3M
function shortMoney(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}M`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}B`;
  return String(Math.round(v));
}

// Eksenin üst sınırı: en büyük değerin üstündeki yuvarlak sayı
function niceMax(v: number) {
  if (v <= 0) return 4;
  const pow = 10 ** Math.floor(Math.log10(v));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * pow >= v / 4) ?? 10;
  return Math.ceil(v / (step * pow)) * step * pow;
}

export function OrderTrendChart({ points, currency }: { points: Point[]; currency: string }) {
  const [range, setRange] = useState<7 | 30>(30);
  const [hover, setHover] = useState<number | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const gid = useId().replace(/:/g, "");
  // Kutunun gerçek genişliğiyle çiz: yazılar ve nokta hiçbir ekranda uzamasın
  const [W, setW] = useState(760);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setW(Math.max(entry.contentRect.width, 280)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const data = useMemo(() => points.slice(-range), [points, range]);
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "₺";
  const max = niceMax(Math.max(...data.map((p) => p.amount)));
  const total = data.reduce((t, p) => t + p.amount, 0);
  const orders = data.reduce((t, p) => t + p.count, 0);

  const x = (i: number) => PAD.l + (i * (W - PAD.l - PAD.r)) / Math.max(data.length - 1, 1);
  const y = (v: number) => PAD.t + (1 - v / max) * (H - PAD.t - PAD.b);
  const line = data.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.amount).toFixed(1)}`).join(" ");
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const labelIdx = range === 7 ? data.map((_, i) => i) : [0, 7, 14, 21, data.length - 1];

  function onMove(e: React.MouseEvent) {
    const r = boxRef.current?.getBoundingClientRect();
    if (!r) return;
    const sx = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((sx - PAD.l) / (W - PAD.l - PAD.r)) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  }

  const hp = hover != null ? data[hover] : null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-x-6 gap-y-2">
        <div>
          <p className="text-2xl font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-white">
            {symbol}
            {total.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-slate-500">
            Son {range} gün · {orders.toLocaleString("tr-TR")} sipariş
          </p>
        </div>
        <div className="ml-auto flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {([7, 30] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => { setRange(r); setHover(null); }}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-semibold transition",
                range === r
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white",
              )}
            >
              {r} gün
            </button>
          ))}
        </div>
      </div>

      <div
        ref={boxRef}
        className="relative h-[240px] w-full"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <svg key={range} viewBox={`0 0 ${W} ${H}`} className="h-full w-full overflow-visible">
          <defs>
            <linearGradient id={`g${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--color-emerald-600)" stopOpacity="0.22" />
              <stop offset="1" stopColor="var(--color-emerald-600)" stopOpacity="0" />
            </linearGradient>
            <clipPath id={`c${gid}`}>
              <rect x="0" y="0" height={H} width={W} className="panel-chart-reveal" />
            </clipPath>
          </defs>
          {ticks.map((v) => (
            <g key={v}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
              <text x={PAD.l - 10} y={y(v) + 4} textAnchor="end" fontSize="11" className="fill-slate-400">
                {symbol}{shortMoney(v)}
              </text>
            </g>
          ))}
          {labelIdx.map((i) => (
            <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize="11" className="fill-slate-400">
              {dayLabel(data[i].date)}
            </text>
          ))}
          <g clipPath={`url(#c${gid})`}>
            <path d={`${line} L${x(data.length - 1)} ${y(0)} L${x(0)} ${y(0)}Z`} fill={`url(#g${gid})`} />
            <path d={line} fill="none" stroke="var(--color-emerald-600)" strokeWidth="2.5" strokeLinejoin="round" />
          </g>
          {hp && hover != null ? (
            <>
              <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} stroke="#c7cbe0" strokeDasharray="4 4" />
              <circle cx={x(hover)} cy={y(hp.amount)} r="5" fill="#fff" stroke="var(--color-emerald-600)" strokeWidth="3" />
            </>
          ) : null}
        </svg>
        {hp && hover != null ? (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-[125%] whitespace-nowrap rounded-xl bg-slate-900 px-3 py-2 text-xs text-white shadow-lg"
            style={{ left: x(hover), top: y(hp.amount) }}
          >
            <b className="block text-sm">
              {symbol}
              {hp.amount.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
            </b>
            {dayLabel(hp.date)} · {hp.count} sipariş
          </div>
        ) : null}
      </div>
    </div>
  );
}
