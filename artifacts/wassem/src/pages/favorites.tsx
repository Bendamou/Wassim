import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Heart, MapPin, Users, Scissors, Star, Radio,
  Trash2, Compass, RefreshCw, Bell, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useFavorites, fetchFavoriteSalons } from "@/hooks/use-favorites";
import { useToast } from "@/hooks/use-toast";

type FavSalon = {
  id: number; name: string; address?: string; city?: string;
  is_live?: boolean; free_chairs?: number; total_chairs?: number;
  avg_service_price?: number;
  rating?: number; owner_name?: string; categories?: string;
  header_image?: string | null;
  active_claims?: number;
};

type Status = "open" | "full" | "offline";

function getStatus(s: FavSalon): Status {
  if (!s.is_live) return "offline";
  if ((s.free_chairs ?? 0) > 0) return "open";
  return "full";
}

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; border: string; glow: string }> = {
  open:    { label: "OPEN",    color: "#4ade80", bg: "rgba(74,222,128,0.12)", border: "rgba(74,222,128,0.4)", glow: "0 0 20px rgba(74,222,128,0.25)" },
  full:    { label: "FULL",    color: "#f97316", bg: "rgba(249,115,22,0.10)", border: "rgba(249,115,22,0.3)", glow: "none" },
  offline: { label: "OFFLINE", color: "#6b7280", bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.07)", glow: "none" },
};

const FILTERS = [
  { key: "all",     label: "All" },
  { key: "open",    label: "🟢 Open Now" },
  { key: "mens",    label: "Men's" },
  { key: "womens",  label: "Women's" },
] as const;
type Filter = (typeof FILTERS)[number]["key"];

const POLL_MS = 15_000;

export default function FavoritesPage() {
  const [, setLocation] = useLocation();
  const { token } = useAuth();
  const { toggle } = useFavorites();
  const { toast } = useToast();

  const [salons, setSalons]       = useState<FavSalon[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [filter, setFilter]       = useState<Filter>("all");
  const prevStatus = useRef<Record<number, Status>>({});

  const load = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const data: FavSalon[] = await fetchFavoriteSalons(token);

      // Detect status changes: full/offline → open triggers a toast
      data.forEach(s => {
        const prev = prevStatus.current[s.id];
        const next = getStatus(s);
        if (prev && prev !== "open" && next === "open") {
          toast({
            title: `🟢 ${s.name} just opened!`,
            description: `${s.free_chairs} chair${s.free_chairs !== 1 ? "s" : ""} available — book now`,
          });
        }
        prevStatus.current[s.id] = next;
      });

      // Sort: open first, then full, then offline
      const order: Record<Status, number> = { open: 0, full: 1, offline: 2 };
      data.sort((a, b) => order[getStatus(a)] - order[getStatus(b)]);

      setSalons(data);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    load();
    const id = setInterval(() => load(true), POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const handleRemove = async (salon: FavSalon) => {
    await toggle(salon.id);
    delete prevStatus.current[salon.id];
    setSalons(prev => prev.filter(s => s.id !== salon.id));
    toast({ title: `Removed ${salon.name} from favorites` });
  };

  const openCount = salons.filter(s => getStatus(s) === "open").length;

  const filtered = salons.filter(s => {
    if (filter === "open" && getStatus(s) !== "open") return false;
    if (filter === "mens" && s.categories?.includes("nails")) return false;
    if (filter === "womens" && !s.categories?.includes("nails") && !s.categories?.includes("skincare")) return false;
    return true;
  });

  return (
    <div className="min-h-[100dvh] bg-[#090013] pb-28">
      {/* ── Header ── */}
      <div className="sticky top-0 z-20 bg-[#090013]/95 backdrop-blur-xl border-b border-white/5 px-4 pt-12 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,31,142,0.15)", border: "1px solid rgba(255,31,142,0.3)" }}>
            <Heart size={18} className="text-[#FF1F8E] fill-[#FF1F8E]" />
          </div>
          <div>
            <h1 className="text-white font-black text-xl leading-tight">My Favorites</h1>
            {lastUpdated && (
              <p className="text-gray-600 text-[10px]">
                Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Open count badge */}
            {openCount > 0 && (
              <div className="flex items-center gap-1 bg-green-500/15 border border-green-500/35 rounded-full px-2.5 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-[10px] font-black">{openCount} open</span>
              </div>
            )}
            {/* Refresh button */}
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <RefreshCw size={14} className={`text-gray-400 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{
                background: filter === f.key ? "rgba(255,31,142,0.15)" : "rgba(255,255,255,0.05)",
                border: `1.5px solid ${filter === f.key ? "#FF1F8E" : "rgba(255,255,255,0.08)"}`,
                color: filter === f.key ? "#FF1F8E" : "#6b7280",
                boxShadow: filter === f.key ? "0 0 10px rgba(255,31,142,0.2)" : "none",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Notification hint (first load, has favorites) ── */}
      {!loading && salons.length > 0 && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl px-3 py-2"
          style={{ background: "rgba(0,180,255,0.06)", border: "1px solid rgba(0,180,255,0.12)" }}>
          <Bell size={11} className="text-[#00B4FF] shrink-0" />
          <p className="text-[#00B4FF]/70 text-[10px]">
            Refreshes every 15 s · you'll see a toast when a favourite opens up
          </p>
        </div>
      )}

      {/* ── Cards ── */}
      <div className="px-4 pt-3 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center pt-24">
            <div className="w-8 h-8 rounded-full border-2 border-[#FF1F8E] border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 pt-20 px-8 text-center">
            <div className="text-6xl">{salons.length === 0 ? "❤️" : "🔍"}</div>
            <h2 className="text-white font-black text-xl">
              {salons.length === 0 ? "No favorites yet" : "No matches"}
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              {salons.length === 0
                ? "Tap the ❤️ on any salon profile to save it here for one-tap booking."
                : "Try a different filter."}
            </p>
            {salons.length === 0 && (
              <button
                onClick={() => setLocation("/")}
                className="mt-2 px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all active:scale-[0.97]"
                style={{ background: "#FF1F8E", color: "#000", boxShadow: "0 0 20px rgba(255,31,142,0.4)" }}
              >
                <Compass size={16} />Browse Salons
              </button>
            )}
          </div>
        ) : (
          filtered.map(salon => {
            const status = getStatus(salon);
            const cfg = STATUS_CONFIG[status];
            return (
              <div
                key={salon.id}
                className="rounded-2xl border overflow-hidden transition-all"
                style={{ background: "#130028", borderColor: cfg.border, boxShadow: cfg.glow }}
              >
                {/* ── Photo header + status pill ── */}
                <div className="relative h-20 overflow-hidden">
                  {salon.header_image ? (
                    <img
                      src={`${salon.header_image}?w=600&h=160&fit=crop&q=70`}
                      alt={salon.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full" style={{ background: `linear-gradient(135deg,${cfg.bg},rgba(19,0,40,0.9))` }} />
                  )}
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to right,rgba(19,0,40,0.7) 0%,transparent 60%)" }} />

                  {/* Status pill — top-left */}
                  <div
                    className="absolute top-2.5 left-3 flex items-center gap-1.5 rounded-full px-2.5 py-1"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                  >
                    {status === "open" && (
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: cfg.color }} />
                    )}
                    {status === "open" && <Radio size={9} style={{ color: cfg.color }} />}
                    <span className="text-[10px] font-black" style={{ color: cfg.color }}>{cfg.label}</span>
                    {status === "open" && (
                      <span className="text-[10px] font-bold" style={{ color: cfg.color }}>
                        · {salon.free_chairs} chair{salon.free_chairs !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Remove heart — top-right */}
                  <button
                    onClick={() => handleRemove(salon)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90"
                    style={{ background: "rgba(255,31,142,0.2)", border: "1px solid rgba(255,31,142,0.4)" }}
                  >
                    <Heart size={12} className="text-[#FF1F8E] fill-[#FF1F8E]" />
                  </button>
                </div>

                {/* ── Info row ── */}
                <div className="px-3.5 pt-2.5 pb-2">
                  <p className="text-white font-black text-base leading-tight line-clamp-1">{salon.name}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {salon.address && (
                      <div className="flex items-center gap-1">
                        <MapPin size={9} className="text-gray-600 shrink-0" />
                        <span className="text-gray-500 text-[10px] truncate max-w-[140px]">{salon.address}</span>
                      </div>
                    )}
                    {!!salon.rating && Number(salon.rating) > 0 && (
                      <div className="flex items-center gap-0.5">
                        <Star size={9} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-yellow-400 text-[10px] font-bold">{Number(salon.rating).toFixed(1)}</span>
                      </div>
                    )}
                    {salon.avg_service_price && (
                      <span className="text-gray-600 text-[10px]">{salon.avg_service_price} MAD</span>
                    )}
                  </div>
                </div>

                {/* ── Action buttons ── */}
                <div className="flex border-t border-white/5">
                  <button
                    onClick={() => setLocation(`/salon/${salon.id}`)}
                    className="flex-1 py-3 flex items-center justify-center gap-1.5 font-black text-sm transition-all active:scale-[0.97]"
                    style={{
                      background: status === "open" ? "rgba(74,222,128,0.10)" : "rgba(0,180,255,0.07)",
                      color: status === "open" ? "#4ade80" : "#00B4FF",
                    }}
                  >
                    <Scissors size={13} />
                    {status === "open" ? "Book Now" : "View Salon"}
                  </button>
                  <div className="w-px bg-white/5" />
                  <button
                    onClick={() => setLocation(`/?salon=${salon.id}`)}
                    className="flex-1 py-3 flex items-center justify-center gap-1.5 font-bold text-sm text-gray-500 transition-all active:scale-[0.97] hover:text-gray-300"
                  >
                    <MapPin size={13} />
                    Map
                  </button>
                  <div className="w-px bg-white/5" />
                  <button
                    onClick={() => setLocation(`/salon/${salon.id}`)}
                    className="px-4 py-3 flex items-center justify-center text-gray-600 transition-all active:scale-[0.97] hover:text-gray-400"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
