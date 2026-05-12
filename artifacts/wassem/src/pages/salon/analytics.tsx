import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  TrendingUp, Users, Star, Zap, AlertTriangle,
  ArrowLeft, DollarSign, Clock
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const API = "/api";

// Generate deterministic mock data
function seedRand(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return Math.abs(s) / 0xffffffff; };
}

const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

function generateWeekRevenue(salonId: number) {
  const rand = seedRand(salonId * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const base = 800 + salonId * 120;
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
  free_chairs: number; total_chairs: number;
};

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex-1 h-full flex flex-col justify-end items-center gap-1">
      <div
        className="w-full rounded-t-lg transition-all"
        style={{ height: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}60` }}
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
      <div className="min-h-[100dvh] bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#00C1FF] border-t-transparent animate-spin" />
      </div>
    );
  }

  const weekRevenue = generateWeekRevenue(salon.id);
  const hourlyCust = generateHourlyCustomers(salon.id);
  const totalRevenue = weekRevenue.reduce((a, b) => a + b, 0);
  const totalCustomers = hourlyCust.reduce((a, b) => a + b, 0) * 7;
  const maxRevenue = Math.max(...weekRevenue);
  const maxHourly = Math.max(...hourlyCust);
  const today = new Date().getDay();
  const avgService = salon.services.length
    ? Math.round(salon.services.reduce((s: number, sv: any) => s + sv.price, 0) / salon.services.length)
    : 80;

  // Revenue leakage: estimate empty chair hours
  const emptyChairs = Number(salon.total_chairs) - Number(salon.free_chairs);
  const leakageHoursPerDay = emptyChairs * 3; // assume 3 avg empty hours/day
  const leakage = leakageHoursPerDay * (avgService / 30) * 30 * 7; // per week

  const createOffer = async () => {
    if (!salon || !newOffer.title) return;
    setSubmitting(true);
    try {
      const body = {
        ...newOffer,
        day_of_week: newOffer.day_of_week >= 0 ? newOffer.day_of_week : null,
      };
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
    if (res.ok) {
      setFlashOffers(prev => prev.map(o => o.id === offerId ? { ...o, is_active: !current } : o));
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#0A0A0A] pb-28">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#00C1FF]/10 to-transparent pt-12 pb-5 px-5">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => setLocation("/salon/dashboard")} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div>
            <p className="text-[#00C1FF] text-xs font-bold uppercase tracking-widest">Revenue Analytics</p>
            <h1 className="text-2xl font-black text-white">{salon.name}</h1>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/5 border border-[#00C1FF]/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={16} className="text-[#00C1FF]" />
              <span className="text-gray-500 text-xs font-bold">This Week</span>
            </div>
            <p className="text-3xl font-black text-white">{totalRevenue.toLocaleString()}</p>
            <p className="text-[#00C1FF] text-xs font-bold">MAD Revenue</p>
          </div>
          <div className="bg-white/5 border border-[#FF00FF]/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users size={16} className="text-[#FF00FF]" />
              <span className="text-gray-500 text-xs font-bold">Customers</span>
            </div>
            <p className="text-3xl font-black text-white">{totalCustomers}</p>
            <p className="text-[#FF00FF] text-xs font-bold">This Week</p>
          </div>
          <div className="bg-white/5 border border-yellow-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Star size={16} className="text-yellow-400" />
              <span className="text-gray-500 text-xs font-bold">Avg Rating</span>
            </div>
            <p className="text-3xl font-black text-white">
              {salon.reviews?.length
                ? (salon.reviews.reduce((s: number, r: any) => s + r.rating, 0) / salon.reviews.length).toFixed(1)
                : "–"}
            </p>
            <p className="text-yellow-400 text-xs font-bold">{salon.reviews?.length ?? 0} reviews</p>
          </div>
          <div className="bg-white/5 border border-green-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-green-400" />
              <span className="text-gray-500 text-xs font-bold">Services</span>
            </div>
            <p className="text-3xl font-black text-white">{salon.services?.length ?? 0}</p>
            <p className="text-green-400 text-xs font-bold">Listed</p>
          </div>
        </div>
      </div>

      {/* Revenue Leakage Alert */}
      {leakage > 0 && (
        <div className="mx-4 mb-5 bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-black text-sm">Revenue Leakage Detected</p>
              <p className="text-gray-400 text-xs mt-1">
                {emptyChairs} chair{emptyChairs !== 1 ? 's' : ''} currently idle × ~{leakageHoursPerDay} empty hours/day.
                That's an estimated <span className="text-red-400 font-bold">{Math.round(leakage).toLocaleString()} MAD/week</span> in lost potential.
              </p>
              <p className="text-gray-500 text-xs mt-1.5">
                Toggle chairs 'Available' and run a Flash Offer to fill them.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 7-day Revenue Chart */}
      <div className="mx-4 mb-5">
        <p className="text-white font-black text-base mb-3">Daily Revenue (7 days)</p>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-end gap-1.5 h-28">
            {weekRevenue.map((rev, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <MiniBar
                  value={rev}
                  max={maxRevenue}
                  color={i === today ? "#00C1FF" : "rgba(0,193,255,0.35)"}
                />
                <span className="text-gray-600 text-[9px] font-bold">{DAYS[(today - 6 + i + 7) % 7]}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-gray-600 text-xs">Low: {Math.min(...weekRevenue).toLocaleString()} MAD</span>
            <span className="text-[#00C1FF] text-xs font-bold">Peak: {maxRevenue.toLocaleString()} MAD</span>
          </div>
        </div>
      </div>

      {/* Busiest Hours Heatmap */}
      <div className="mx-4 mb-5">
        <p className="text-white font-black text-base mb-3">Busiest Hours (avg clients/hour)</p>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-end gap-1 h-20">
            {hourlyCust.map((count, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <MiniBar
                  value={count}
                  max={maxHourly}
                  color={count >= maxHourly * 0.8 ? "#FF00FF" : count >= maxHourly * 0.5 ? "#00C1FF" : "rgba(255,255,255,0.15)"}
                />
                <span className="text-gray-700 text-[8px]">{HOURS[i]}h</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#FF00FF]" /><span className="text-xs text-gray-500">Peak</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#00C1FF]" /><span className="text-xs text-gray-500">Busy</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-white/20" /><span className="text-xs text-gray-500">Slow</span></div>
          </div>
        </div>
      </div>

      {/* Flash Offers Engine */}
      <div className="mx-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-yellow-400" />
            <p className="text-white font-black text-base">Flash Offers</p>
          </div>
          <button
            onClick={() => setShowOfferForm(v => !v)}
            className="bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 font-bold text-xs px-3 py-1.5 rounded-xl"
          >
            + New Offer
          </button>
        </div>

        {showOfferForm && (
          <div className="bg-white/5 border border-yellow-500/20 rounded-2xl p-4 mb-3 space-y-3">
            <input
              value={newOffer.title}
              onChange={e => setNewOffer(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Happy Hour 30% Off"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-yellow-500 placeholder:text-gray-600"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-gray-500 text-xs mb-1">Discount %</p>
                <input
                  type="number" min={5} max={80}
                  value={newOffer.discount_pct}
                  onChange={e => setNewOffer(p => ({ ...p, discount_pct: parseInt(e.target.value) || 20 }))}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-yellow-500"
                />
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Day (blank = daily)</p>
                <select
                  value={newOffer.day_of_week}
                  onChange={e => setNewOffer(p => ({ ...p, day_of_week: parseInt(e.target.value) }))}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-2 py-2 text-white text-sm outline-none focus:border-yellow-500"
                >
                  <option value={-1}>Every day</option>
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">From (hour)</p>
                <input
                  type="number" min={0} max={23}
                  value={newOffer.start_hour}
                  onChange={e => setNewOffer(p => ({ ...p, start_hour: parseInt(e.target.value) || 9 }))}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-yellow-500"
                />
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Until (hour)</p>
                <input
                  type="number" min={0} max={23}
                  value={newOffer.end_hour}
                  onChange={e => setNewOffer(p => ({ ...p, end_hour: parseInt(e.target.value) || 18 }))}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-yellow-500"
                />
              </div>
            </div>
            <button
              onClick={createOffer}
              disabled={submitting || !newOffer.title.trim()}
              className="w-full bg-yellow-500 disabled:opacity-40 text-black font-black rounded-xl py-3 text-sm"
            >
              {submitting ? "Creating..." : "⚡ Publish Flash Offer"}
            </button>
          </div>
        )}

        {flashOffers.length === 0 && !showOfferForm && (
          <p className="text-gray-600 text-sm text-center py-4">No flash offers yet. Create one to fill slow hours.</p>
        )}

        <div className="space-y-2">
          {flashOffers.map(offer => (
            <div
              key={offer.id}
              className={`flex items-center justify-between rounded-2xl px-4 py-3 border ${
                offer.is_active
                  ? "bg-yellow-500/10 border-yellow-500/30"
                  : "bg-white/5 border-white/10"
              }`}
            >
              <div>
                <p className={`font-bold text-sm ${offer.is_active ? "text-yellow-400" : "text-gray-500"}`}>
                  {offer.is_active ? "⚡ " : ""}{offer.title}
                </p>
                <p className="text-gray-600 text-xs">{offer.discount_pct}% discount</p>
              </div>
              <button
                onClick={() => toggleOffer(offer.id, offer.is_active)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                  offer.is_active
                    ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-400"
                    : "bg-white/5 border-white/10 text-gray-500"
                }`}
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
