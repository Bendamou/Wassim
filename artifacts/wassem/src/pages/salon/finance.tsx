import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, DollarSign, TrendingUp, Scissors, Users,
  Calendar, Clock, ChevronDown, ChevronUp, Star,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const API = "/api";
const CYAN = "#00B4FF";
const PINK = "#FF1F8E";

function seedRand(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return Math.abs(s) / 0xffffffff; };
}

type Chair = { id: number; name: string; status: string };
type Claim = { id: number; chair_name: string; client_name: string; status: string; deposit_amount: number };
type Salon = { id: number; name: string; chairs: Chair[]; avg_service_price: number; services: any[]; activeClaims: Claim[] };

function barberStats(salonId: number, chairId: number) {
  const rand = seedRand(salonId * 100 + chairId);
  const sessions   = Math.round(12 + rand() * 30);
  const avgPrice   = Math.round(70 + rand() * 80);
  const earnings   = sessions * avgPrice;
  const rating     = parseFloat((3.8 + rand() * 1.2).toFixed(1));
  const noShows    = Math.round(rand() * 3);
  const avgMinutes = Math.round(25 + rand() * 20);
  return { sessions, avgPrice, earnings, rating, noShows, avgMinutes };
}

function Sparkline({ values, color, uid }: { values: number[]; color: string; uid: string }) {
  const max = Math.max(...values); const min = Math.min(...values);
  const range = max - min || 1;
  const w = 72, h = 26, pad = 2;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const lastPt = pts[pts.length - 1].split(",");
  const area = `M${pts[0]} ` + pts.slice(1).map(p => `L${p}`).join(" ")
    + ` L${(w - pad).toFixed(1)},${(h - pad).toFixed(1)} L${pad},${(h - pad).toFixed(1)} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0.01} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${uid})`} />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastPt[0]} cy={lastPt[1]} r={2.5} fill={color} />
    </svg>
  );
}

function WeekChart({ salonId, avgPrice }: { salonId: number; avgPrice: number }) {
  const rand  = seedRand(salonId * 31);
  const days  = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const today = new Date().getDay();
  const vals  = days.map((_, i) => {
    if (i > today) return 0;
    return Math.round((avgPrice * 3 + rand() * avgPrice * 4) * ([0, 6].includes(i) ? 1.5 : 1));
  });
  const max = Math.max(...vals, 1);
  const total = vals.reduce((a, b) => a + b, 0);
  return (
    <div>
      <div className="flex items-end gap-1 h-20">
        {vals.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-t-md" style={{
              height: `${Math.max((v / max) * 72, 4)}px`,
              background: i === today
                ? `linear-gradient(180deg,${CYAN},${CYAN}80)`
                : v === 0 ? "rgba(255,255,255,0.04)"
                : `linear-gradient(180deg,${PINK}90,${PINK}30)`,
              boxShadow: i === today ? `0 0 8px ${CYAN}50` : "none",
            }} />
            <span className="text-[9px] font-bold" style={{ color: i === today ? CYAN : "#4b5563" }}>{days[i]}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-3 pt-3 border-t border-white/5">
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">This week</p>
          <p className="text-white font-black text-lg">{total.toLocaleString()} MAD</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Daily avg</p>
          <p className="font-black text-lg" style={{ color: CYAN }}>
            {Math.round(total / Math.max(today + 1, 1)).toLocaleString()} MAD
          </p>
        </div>
      </div>
    </div>
  );
}

function BarberCard({ chair, salonId, claims }: { chair: Chair; salonId: number; claims: Claim[] }) {
  const [open, setOpen] = useState(false);
  const s = barberStats(salonId, chair.id);
  const myClaims = claims.filter(c => c.chair_name === chair.name);
  const rand = seedRand(salonId * 200 + chair.id);
  const weekVals = Array.from({ length: 7 }, () => Math.round(s.avgPrice * (1 + rand() * 3)));
  const isLive = chair.status === "available";
  const uid = `sp${salonId}x${chair.id}`;
  return (
    <div className="rounded-2xl border overflow-hidden" style={{
      background: "rgba(255,255,255,0.03)",
      borderColor: isLive ? `${CYAN}35` : "rgba(255,255,255,0.07)",
      boxShadow: isLive ? `0 0 16px ${CYAN}10` : "none",
    }}>
      <button className="w-full p-4 flex items-center gap-3" onClick={() => setOpen(v => !v)}>
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg" style={{
          background: `linear-gradient(135deg,${PINK}20,${CYAN}20)`,
          border: `1px solid ${isLive ? CYAN : PINK}30`,
        }}>✂</div>
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white font-black text-sm">{chair.name}</p>
            {isLive && (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                style={{ background: `${CYAN}20`, color: CYAN, border: `1px solid ${CYAN}30` }}>
                ● LIVE
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500">{s.sessions} sessions</span>
            <span className="text-gray-700">·</span>
            <span className="text-xs font-bold" style={{ color: PINK }}>{s.earnings.toLocaleString()} MAD</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Sparkline values={weekVals} color={isLive ? CYAN : PINK} uid={uid} />
          {open ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {([
              ["Earnings",  `${s.earnings.toLocaleString()} MAD`, PINK],
              ["Sessions",  String(s.sessions),                   CYAN],
              ["Avg price", `${s.avgPrice} MAD`,                  "#a78bfa"],
              ["Rating",    `★ ${s.rating}`,                      "#facc15"],
              ["No-shows",  String(s.noShows),                    s.noShows > 1 ? "#f87171" : "#4ade80"],
              ["Avg time",  `${s.avgMinutes}m`,                   "#94a3b8"],
            ] as [string, string, string][]).map(([label, value, color]) => (
              <div key={label} className="rounded-xl p-2.5 text-center"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="font-black text-sm" style={{ color }}>{value}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          {myClaims.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Active client</p>
              {myClaims.map(claim => (
                <div key={claim.id} className="rounded-xl px-3 py-2 flex items-center justify-between"
                  style={{ background: `${CYAN}08`, border: `1px solid ${CYAN}20` }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: CYAN }} />
                    <span className="text-white text-sm font-bold">{claim.client_name}</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: CYAN }}>{claim.deposit_amount} MAD</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SalonFinance() {
  const [, setLocation] = useLocation();
  const { token } = useAuth();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month">("week");

  const loadSalon = useCallback(async () => {
    const allRes = await fetch(`${API}/salons`, { headers: { Authorization: `Bearer ${token}` } });
    if (!allRes.ok) return;
    const all: Salon[] = await allRes.json();
    if (all.length === 0) return;
    const detail = await fetch(`${API}/salons/${all[0].id}`).then(r => r.json());
    setSalon(detail);
  }, [token]);

  useEffect(() => { loadSalon().finally(() => setLoading(false)); }, [loadSalon]);

  if (loading) return (
    <div className="min-h-[100dvh] flex items-center justify-center" style={{ background: "#1a0030" }}>
      <div className="w-10 h-10 rounded-full border-2 border-[#00B4FF] border-t-transparent animate-spin" />
    </div>
  );
  if (!salon) return (
    <div className="min-h-[100dvh] flex items-center justify-center p-8 text-center" style={{ background: "#1a0030" }}>
      <div>
        <DollarSign size={48} className="text-gray-700 mx-auto mb-4" />
        <p className="text-white font-black text-xl">No salon found</p>
        <p className="text-gray-500 text-sm mt-2">Set up your salon profile first.</p>
      </div>
    </div>
  );

  const rand = seedRand(salon.id * 5);
  const totalEarnings = salon.chairs.reduce((s, c) => s + barberStats(salon.id, c.id).earnings, 0);
  const totalSessions = salon.chairs.reduce((s, c) => s + barberStats(salon.id, c.id).sessions, 0);
  const avgRating = salon.chairs.length
    ? (salon.chairs.reduce((s, c) => s + barberStats(salon.id, c.id).rating, 0) / salon.chairs.length).toFixed(1)
    : "–";
  const depositTotal  = (salon.activeClaims ?? []).reduce((s: number, c: Claim) => s + c.deposit_amount, 0);
  const monthEarnings = Math.round(totalEarnings * 4.2 + rand() * 2000);
  const displayed     = period === "week" ? totalEarnings : monthEarnings;
  const net           = Math.round(displayed * 0.92 + depositTotal);

  const kpis: [string, string, string, React.ElementType][] = [
    [period === "week" ? "Weekly Revenue" : "Monthly Revenue", `${displayed.toLocaleString()} MAD`, PINK, DollarSign],
    ["Total Sessions", String(totalSessions),                  CYAN,      Scissors],
    ["Avg Rating",     `★ ${avgRating}`,                       "#facc15", Star],
    ["Deposits Held",  `${depositTotal} MAD`,                  "#a78bfa", Users],
  ];

  return (
    <div className="min-h-[100dvh] pb-28"
      style={{ background: "radial-gradient(ellipse 110% 90% at 50% 20%, #2d1260 0%, #1a0030 60%)" }}>

      <div className="px-5 pt-14 pb-4"
        style={{ background: "linear-gradient(180deg,rgba(0,180,255,0.06),transparent)" }}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setLocation("/salon/dashboard")}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}>
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: CYAN }}>Finance Dashboard</p>
            <h1 className="text-xl font-black text-white">{salon.name}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          {(["week", "month"] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className="flex-1 py-2 rounded-xl text-sm font-bold capitalize"
              style={{
                background: period === p ? `${CYAN}15` : "rgba(255,255,255,0.04)",
                border: `1px solid ${period === p ? `${CYAN}40` : "rgba(255,255,255,0.08)"}`,
                color: period === p ? CYAN : "#6b7280",
              }}>
              This {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 mb-5">
        {kpis.map(([label, value, color, Icon]) => (
          <div key={label} className="rounded-2xl p-4"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
                <Icon size={14} style={{ color }} />
              </div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider leading-tight">{label}</p>
            </div>
            <p className="font-black text-xl text-white leading-none">{value}</p>
          </div>
        ))}
      </div>

      <div className="mx-4 mb-5 rounded-2xl p-4"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} style={{ color: CYAN }} />
          <p className="text-white font-black text-sm">Revenue by Day</p>
          <div className="ml-auto flex items-center gap-3 text-[10px] text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: CYAN }} />Today
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: PINK }} />Past
            </span>
          </div>
        </div>
        <WeekChart salonId={salon.id} avgPrice={salon.avg_service_price ?? 80} />
      </div>

      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white font-black text-base">Chair Breakdown</p>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
            {salon.chairs.length} chair{salon.chairs.length !== 1 ? "s" : ""}
          </span>
        </div>

        {salon.chairs.length === 0 ? (
          <div className="rounded-2xl p-8 text-center"
            style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
            <Scissors size={32} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 font-bold">No chairs yet</p>
            <p className="text-gray-600 text-sm mt-1">Add them in the Salon Dashboard.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {salon.chairs.map(c => (
              <BarberCard key={c.id} chair={c} salonId={salon.id} claims={salon.activeClaims ?? []} />
            ))}
          </div>
        )}

        {salon.chairs.length > 0 && (
          <>
            <div className="mt-4 rounded-2xl p-4"
              style={{ background: `linear-gradient(135deg,${PINK}10,${CYAN}08)`, border: `1px solid ${PINK}25` }}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={14} style={{ color: PINK }} />
                <p className="text-white font-black text-sm">Payout Summary</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Gross ({period})</span>
                  <span className="text-white font-bold">{displayed.toLocaleString()} MAD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Platform fee (8%)</span>
                  <span className="text-red-400 font-bold">−{Math.round(displayed * 0.08).toLocaleString()} MAD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Deposits collected</span>
                  <span className="font-bold" style={{ color: CYAN }}>+{depositTotal} MAD</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/10 font-black">
                  <span className="text-white">Net earnings</span>
                  <span style={{ color: PINK }}>{net.toLocaleString()} MAD</span>
                </div>
              </div>
            </div>

            <div className="mt-3 mb-4 rounded-2xl p-4 flex items-center gap-3"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <Clock size={18} style={{ color: CYAN }} />
              <div>
                <p className="text-white font-bold text-sm">Next payout</p>
                <p className="text-gray-500 text-xs">Every Monday · Direct transfer</p>
              </div>
              <div className="ml-auto text-right">
                <p className="font-black" style={{ color: CYAN }}>
                  {Math.round(net / (period === "week" ? 1 : 4)).toLocaleString()} MAD
                </p>
                <p className="text-gray-600 text-xs">estimated</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
