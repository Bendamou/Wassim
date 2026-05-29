import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  TrendingUp, Users, Star, Zap, AlertTriangle,
  ArrowLeft, DollarSign, Clock
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const API = "/api";

const CYAN  = "#00f2ff";
const PINK  = "#ff007f";
const PURPLE_MID = "#a020ff";

function seedRand(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return Math.abs(s) / 0xffffffff; };
}

const DAYS  = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

function generateWeekRevenue(salonId: number) {
  const rand = seedRand(salonId * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const base  = 800 + salonId * 120;
    const wkend = [0, 6].includes(i) ? 1.6 : 1;
    return Math.round((base + rand() * 600) * wkend);
  });
}

function generateHourlyCustomers(salonId: number) {
  const rand = seedRand(salonId * 11);
  return HOURS.map(h => {
    const peak = h >= 10 && h <= 13 ? 1.8 : h >= 16 && h <= 18 ? 1.5 : 1;
    return Math.max(1, Math.round((2 + rand() * 4) * peak));
  });
}

type FlashOffer = { id: number; title: string; discount_pct: number; is_active: boolean };
type Salon = {
  id: number; name: string; chairs: any[]; services: any[];
  free_chairs: number; total_chairs: number; reviews?: any[];
};

// ── Gradient bar — uses a unique SVG linear-gradient per bar ───────────────
function GradientBar({
  value, max, isHighlight, dimmed,
}: {
  value: number; max: number; isHighlight?: boolean; dimmed?: boolean;
}) {
  const pct = Math.round((value / max) * 100);
  const id  = `g${value}${max}${isHighlight ? "h" : ""}`;

  if (dimmed) {
    return (
      <div className="flex-1 h-full flex flex-col justify-end items-center gap-1">
        <div
          className="w-full rounded-t-lg transition-all"
          style={{
            height: `${pct}%`,
            background: `rgba(0,242,255,0.12)`,
            boxShadow: `0 0 4px rgba(0,242,255,0.15)`,
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 h-full flex flex-col justify-end items-center gap-1">
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <linearGradient id={id} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%"   stopColor={isHighlight ? PINK  : CYAN} />
            <stop offset="100%" stopColor={isHighlight ? CYAN  : PINK} />
          </linearGradient>
        </defs>
      </svg>
      <div
        className="w-full rounded-t-lg transition-all"
        style={{
          height: `${pct}%`,
          background: `url(#${id})`,
          backgroundImage: isHighlight
            ? `linear-gradient(to top, ${PINK}, ${CYAN})`
            : `linear-gradient(to top, ${CYAN}, ${PINK})`,
          boxShadow: isHighlight
            ? `0 0 12px rgba(255,0,127,0.55), 0 0 4px rgba(0,242,255,0.3)`
            : `0 0 12px rgba(0,242,255,0.5), 0 0 4px rgba(255,0,127,0.25)`,
        }}
      />
    </div>
  );
}

// ── Hourly bar with 3-tier coloring ──────────────────────────────────────
function HourBar({ value, max }: { value: number; max: number }) {
  const pct   = Math.round((value / max) * 100);
  const ratio = value / max;
  const isPeak = ratio >= 0.8;
  const isBusy = ratio >= 0.5;

  const bg = isPeak
    ? `linear-gradient(to top, ${PINK}, ${PURPLE_MID})`
    : isBusy
    ? `linear-gradient(to top, ${CYAN}, ${PURPLE_MID})`
    : `rgba(255,255,255,0.10)`;

  const glow = isPeak
    ? `0 0 10px rgba(255,0,127,0.6)`
    : isBusy
    ? `0 0 8px rgba(0,242,255,0.45)`
    : undefined;

  return (
    <div className="flex-1 h-full flex flex-col justify-end items-center gap-1">
      <div
        className="w-full rounded-t-md transition-all"
        style={{ height: `${pct}%`, background: bg, boxShadow: glow }}
      />
    </div>
  );
}

export default function SalonAnalytics() {
  const { token } = useAuth();
  const [, setLocation] = useLocation();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [flashOffers, setFlashOffers] = useState<FlashOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOffer, setNewOffer] = useState({ title: "", discount_pct: 20, day_of_week: -1, start_hour: 9, end_hour: 18 });
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/salons")
      .then(r => r.json())
      .then(async (salons: Salon[]) => {
        if (!salons.length) return;
        const detail = await fetch(`/api/salons/${salons[0].id}`).then(r => r.json());
        setSalon(detail);
        const offers = await fetch(`/api/salons/${salons[0].id}/flash-offers`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()).catch(() => []);
        setFlashOffers(Array.isArray(offers) ? offers : []);
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading || !salon) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center" style={{ background: "#36013F" }}>
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${CYAN} transparent` }} />
      </div>
    );
  }

  const weekRevenue  = generateWeekRevenue(salon.id);
  const hourlyCust   = generateHourlyCustomers(salon.id);
  const totalRevenue = weekRevenue.reduce((a, b) => a + b, 0);
  const totalCustomers = hourlyCust.reduce((a, b) => a + b, 0) * 7;
  const maxRevenue   = Math.max(...weekRevenue);
  const maxHourly    = Math.max(...hourlyCust);
  const today        = new Date().getDay();
  const avgService   = salon.services.length
    ? Math.round(salon.services.reduce((s: number, sv: any) => s + sv.price, 0) / salon.services.length)
    : 80;

  const emptyChairs    = Number(salon.total_chairs) - Number(salon.free_chairs);
  const leakageHoursPerDay = emptyChairs * 3;
  const leakage        = leakageHoursPerDay * (avgService / 30) * 30 * 7;

  const createOffer = async () => {
    if (!salon || !newOffer.title) return;
    setSubmitting(true);
    try {
      const body = { ...newOffer, day_of_week: newOffer.day_of_week >= 0 ? newOffer.day_of_week : null };
      const res = await fetch(`/api/salons/${salon.id}/flash-offers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const offer = await res.json();
        setFlashOffers(prev => [offer, ...prev]);
        setShowOfferForm(false);
        setNewOffer({ title: "", discount_pct: 20, day_of_week: -1, start_hour: 9, end_hour: 18 });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const toggleOffer = async (offerId: number, current: boolean) => {
    const res = await fetch(`/api/flash-offers/${offerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ is_active: !current }),
    });
    if (res.ok) setFlashOffers(prev => prev.map(o => o.id === offerId ? { ...o, is_active: !current } : o));
  };

  const cardBg   = "rgba(28,12,58,0.85)";
  const cardBorder = "rgba(120,60,220,0.35)";

  return (
    <div className="min-h-[100dvh] pb-28" style={{ background: "#36013F" }}>
      {/* ── Header ── */}
      <div className="pt-12 pb-5 px-5"
        style={{ background: "linear-gradient(to bottom, rgba(0,242,255,0.07), transparent)" }}>
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => setLocation("/salon/dashboard")}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
          >
            <ArrowLeft size={18} style={{ color: "#f3f1f6" }} />
          </button>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: CYAN }}>Revenue Analytics</p>
            <h1 className="text-2xl font-black" style={{ color: "#f3f1f6" }}>{salon.name}</h1>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {[
            { icon: DollarSign, label: "This Week", value: totalRevenue.toLocaleString(), unit: "MAD Revenue", color: CYAN },
            { icon: Users,      label: "Customers",  value: totalCustomers,               unit: "This Week",   color: PINK },
            {
              icon: Star, label: "Avg Rating",
              value: salon.reviews?.length
                ? (salon.reviews.reduce((s: number, r: any) => s + r.rating, 0) / salon.reviews.length).toFixed(1)
                : "–",
              unit: `${salon.reviews?.length ?? 0} reviews`, color: "#facc15",
            },
            { icon: TrendingUp, label: "Services", value: salon.services?.length ?? 0, unit: "Listed", color: "#4ade80" },
          ].map(kpi => (
            <div
              key={kpi.label}
              className="rounded-2xl p-4"
              style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
            >
              <div className="flex items-center gap-2 mb-1">
                <kpi.icon size={16} style={{ color: kpi.color }} />
                <span className="text-xs font-bold" style={{ color: "rgba(243,241,246,0.5)" }}>{kpi.label}</span>
              </div>
              <p className="text-3xl font-black" style={{ color: "#f3f1f6" }}>{kpi.value}</p>
              <p className="text-xs font-bold mt-0.5" style={{ color: kpi.color }}>{kpi.unit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Revenue Leakage Alert ── */}
      {leakage > 0 && (
        <div className="mx-4 mb-5 rounded-2xl p-4"
          style={{ background: "rgba(255,0,127,0.08)", border: "1px solid rgba(255,0,127,0.30)" }}>
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} style={{ color: PINK, flexShrink: 0, marginTop: 2 }} />
            <div>
              <p className="font-black text-sm" style={{ color: PINK }}>Revenue Leakage Detected</p>
              <p className="text-xs mt-1" style={{ color: "rgba(243,241,246,0.65)" }}>
                {emptyChairs} chair{emptyChairs !== 1 ? "s" : ""} idle × ~{leakageHoursPerDay} empty hrs/day —
                estimated <span style={{ color: PINK, fontWeight: 700 }}>{Math.round(leakage).toLocaleString()} MAD/week</span> lost.
              </p>
              <p className="text-xs mt-1.5" style={{ color: "rgba(243,241,246,0.4)" }}>
                Toggle chairs 'Available' and run a Flash Offer to fill them.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── 7-day Revenue Chart ── */}
      <div className="mx-4 mb-5">
        <p className="font-black text-base mb-3" style={{ color: "#f3f1f6" }}>Daily Revenue (7 days)</p>
        <div className="rounded-2xl p-4"
          style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
          {/* subtle grid lines */}
          <div className="relative">
            {[25, 50, 75].map(pct => (
              <div
                key={pct}
                className="absolute w-full"
                style={{
                  bottom: `${pct}%`,
                  borderTop: "1px solid rgba(120,60,220,0.18)",
                  zIndex: 0,
                }}
              />
            ))}
            <div className="flex items-end gap-1.5 h-28 relative z-10">
              {weekRevenue.map((rev, i) => {
                const isToday = i === today % 7;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <GradientBar value={rev} max={maxRevenue} isHighlight={isToday} dimmed={!isToday} />
                    <span className="text-[9px] font-bold" style={{ color: isToday ? CYAN : "rgba(243,241,246,0.35)" }}>
                      {DAYS[(today - 6 + i + 7) % 7]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex justify-between mt-3 pt-2" style={{ borderTop: "1px solid rgba(120,60,220,0.2)" }}>
            <span className="text-xs" style={{ color: "rgba(243,241,246,0.4)" }}>Low: {Math.min(...weekRevenue).toLocaleString()} MAD</span>
            <span className="text-xs font-bold" style={{ color: CYAN }}>Peak: {maxRevenue.toLocaleString()} MAD</span>
          </div>
        </div>
      </div>

      {/* ── Busiest Hours ── */}
      <div className="mx-4 mb-5">
        <p className="font-black text-base mb-3" style={{ color: "#f3f1f6" }}>Busiest Hours (avg clients/hr)</p>
        <div className="rounded-2xl p-4"
          style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
          <div className="flex items-end gap-1 h-20">
            {hourlyCust.map((count, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <HourBar value={count} max={maxHourly} />
                <span className="text-[8px]" style={{ color: "rgba(243,241,246,0.3)" }}>{HOURS[i]}h</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3">
            {[
              { color: PINK,               label: "Peak" },
              { color: CYAN,               label: "Busy" },
              { color: "rgba(255,255,255,0.20)", label: "Slow" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
                <span className="text-xs" style={{ color: "rgba(243,241,246,0.5)" }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Flash Offers Engine ── */}
      <div className="mx-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-yellow-400" />
            <p className="font-black text-base" style={{ color: "#f3f1f6" }}>Flash Offers</p>
          </div>
          <button
            onClick={() => setShowOfferForm(v => !v)}
            className="font-bold text-xs px-3 py-1.5 rounded-xl"
            style={{ background: "rgba(250,204,21,0.12)", border: "1px solid rgba(250,204,21,0.35)", color: "#facc15" }}
          >
            + New Offer
          </button>
        </div>

        {showOfferForm && (
          <div className="rounded-2xl p-4 mb-3 space-y-3"
            style={{ background: cardBg, border: "1px solid rgba(250,204,21,0.2)" }}>
            <input
              value={newOffer.title}
              onChange={e => setNewOffer(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Happy Hour 30% Off"
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ background: "rgba(15,5,29,0.7)", border: "1px solid rgba(120,60,220,0.3)", color: "#f3f1f6" }}
            />
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Discount %", key: "discount_pct", type: "number", min: 5, max: 80, val: newOffer.discount_pct },
                { label: "Start hour", key: "start_hour",   type: "number", min: 0, max: 23, val: newOffer.start_hour },
                { label: "End hour",   key: "end_hour",     type: "number", min: 0, max: 23, val: newOffer.end_hour },
              ].map(f => (
                <div key={f.key}>
                  <p className="text-xs mb-1" style={{ color: "rgba(243,241,246,0.45)" }}>{f.label}</p>
                  <input
                    type={f.type} min={(f as any).min} max={(f as any).max} value={f.val}
                    onChange={e => setNewOffer(p => ({ ...p, [f.key]: parseInt(e.target.value) || 0 }))}
                    className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                    style={{ background: "rgba(15,5,29,0.7)", border: "1px solid rgba(120,60,220,0.3)", color: "#f3f1f6" }}
                  />
                </div>
              ))}
              <div>
                <p className="text-xs mb-1" style={{ color: "rgba(243,241,246,0.45)" }}>Day</p>
                <select
                  value={newOffer.day_of_week}
                  onChange={e => setNewOffer(p => ({ ...p, day_of_week: parseInt(e.target.value) }))}
                  className="w-full rounded-xl px-2 py-2 text-sm outline-none"
                  style={{ background: "rgba(15,5,29,0.7)", border: "1px solid rgba(120,60,220,0.3)", color: "#f3f1f6" }}
                >
                  <option value={-1}>Every day</option>
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
            </div>
            <button
              onClick={createOffer}
              disabled={submitting || !newOffer.title.trim()}
              className="w-full font-black rounded-xl py-3 text-sm disabled:opacity-40"
              style={{ background: "#facc15", color: "#36013F" }}
            >
              {submitting ? "Creating..." : "⚡ Publish Flash Offer"}
            </button>
          </div>
        )}

        {flashOffers.length === 0 && !showOfferForm && (
          <p className="text-sm text-center py-4" style={{ color: "rgba(243,241,246,0.35)" }}>
            No flash offers yet. Create one to fill slow hours.
          </p>
        )}

        <div className="space-y-2">
          {flashOffers.map(offer => (
            <div
              key={offer.id}
              className="flex items-center justify-between rounded-2xl px-4 py-3"
              style={{
                background: offer.is_active ? "rgba(250,204,21,0.08)" : cardBg,
                border: offer.is_active ? "1px solid rgba(250,204,21,0.35)" : `1px solid ${cardBorder}`,
              }}
            >
              <div>
                <p className="font-bold text-sm" style={{ color: offer.is_active ? "#facc15" : "rgba(243,241,246,0.45)" }}>
                  {offer.is_active ? "⚡ " : ""}{offer.title}
                </p>
                <p className="text-xs" style={{ color: "rgba(243,241,246,0.3)" }}>{offer.discount_pct}% discount</p>
              </div>
              <button
                onClick={() => toggleOffer(offer.id, offer.is_active)}
                className="text-xs font-bold px-3 py-1.5 rounded-xl"
                style={{
                  background: offer.is_active ? "rgba(250,204,21,0.15)" : "rgba(255,255,255,0.05)",
                  border: offer.is_active ? "1px solid rgba(250,204,21,0.40)" : "1px solid rgba(255,255,255,0.10)",
                  color: offer.is_active ? "#facc15" : "rgba(243,241,246,0.40)",
                }}
              >
                {offer.is_active ? "Live" : "Off"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
