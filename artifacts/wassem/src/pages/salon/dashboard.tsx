import { useState, useEffect, useCallback, useRef } from "react";
import {
  Scissors, Plus, ToggleLeft, ToggleRight, TrendingUp, Users, Star,
  Package, Radio, DollarSign, Clock, AlertTriangle, CheckCircle, X,
  Zap, ChevronDown, ChevronUp,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const API = "/api";

type Chair = { id: number; name: string; status: "available" | "occupied" };
type Claim = {
  id: number; client_name: string; client_avatar: string;
  chair_name: string; status: string; deposit_amount: number;
  card_last4: string; created_at: string; expires_at: string;
};
type Salon = {
  id: number; name: string; description: string; address: string;
  free_chairs: number; total_chairs: number; is_live: boolean;
  live_since: string | null; avg_service_price: number;
  chairs: Chair[]; services: any[]; products: any[];
  reviews: any[]; activeClaims: Claim[];
};

function formatTimeAgo(ts: string) {
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString("fr-MA", { hour: "2-digit", minute: "2-digit" });
}

// ── Lost Revenue Estimator ─────────────────────────────────────────────────
function RevenueEstimator({ salon, freeChairs }: { salon: Salon; freeChairs: number }) {
  const [lostMad, setLostMad] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const avgPrice = salon.avg_service_price ?? 80;
  const sessionsPerHour = 2; // ~30 min per haircut
  const perMinutePerChair = (avgPrice * sessionsPerHour) / 60;

  useEffect(() => {
    if (!salon.is_live || !salon.live_since || freeChairs === 0) {
      setLostMad(0);
      return;
    }
    const tick = () => {
      const minsLive = (Date.now() - new Date(salon.live_since!).getTime()) / 60000;
      setLostMad(Math.round(freeChairs * perMinutePerChair * minsLive));
    };
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, [salon.is_live, salon.live_since, freeChairs, perMinutePerChair]);

  const potentialPerHour = Math.round(salon.chairs.length * avgPrice * sessionsPerHour);

  if (!salon.is_live) {
    return (
      <div className="mx-4 mb-5 rounded-3xl overflow-hidden border border-[#ff007f]/30"
        style={{ background: "linear-gradient(135deg,#1a0010,#0f0008)" }}>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-[#ff007f]/20 flex items-center justify-center">
              <DollarSign size={16} className="text-[#ff007f]" />
            </div>
            <p className="text-[#ff007f] font-black text-sm uppercase tracking-wider">Lost Revenue Estimator</p>
          </div>
          <p className="text-white/80 text-sm leading-relaxed">
            Your {salon.chairs.length} chair{salon.chairs.length !== 1 ? "s" : ""} could earn{" "}
            <span className="text-[#ff007f] font-black text-lg">{potentialPerHour} MAD/hr</span>{" "}
            when live. Every minute offline is missed revenue.
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            <Zap size={12} className="text-yellow-400" />
            <span>Based on {avgPrice} MAD avg · 2 sessions/hr/chair</span>
          </div>
        </div>
        <div className="h-1 bg-[#ff007f]/20">
          <div className="h-full w-full bg-gradient-to-r from-[#ff007f] to-transparent animate-pulse" />
        </div>
      </div>
    );
  }

  if (freeChairs === 0) {
    return (
      <div className="mx-4 mb-5 rounded-3xl border border-green-500/40 bg-green-500/5 p-4">
        <div className="flex items-center gap-3">
          <CheckCircle size={24} className="text-green-400 flex-shrink-0" />
          <div>
            <p className="text-green-400 font-black">All chairs working! 🔥</p>
            <p className="text-gray-500 text-xs">Zero idle time — you're maximizing revenue</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 mb-5 rounded-3xl overflow-hidden border border-red-500/40"
      style={{ background: "linear-gradient(135deg,#1a0000,#0f0000)" }}>
      <button className="w-full p-4" onClick={() => setIsExpanded(v => !v)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500 rounded-xl animate-ping opacity-30" />
              <div className="relative w-8 h-8 rounded-xl bg-red-500/30 flex items-center justify-center">
                <DollarSign size={16} className="text-red-400" />
              </div>
            </div>
            <div className="text-left">
              <p className="text-red-400 text-[10px] font-black uppercase tracking-wider">Idle Revenue Lost</p>
              <p className="text-white font-black text-2xl leading-none">
                {lostMad.toLocaleString()} MAD
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-gray-500 text-xs">{freeChairs} chair{freeChairs !== 1 ? "s" : ""} idle</p>
              <p className="text-red-400 text-xs font-bold">
                -{Math.round(freeChairs * perMinutePerChair)}/min
              </p>
            </div>
            {isExpanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Avg service price</span>
            <span className="text-white font-bold">{avgPrice} MAD</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Sessions per chair/hr</span>
            <span className="text-white font-bold">× {sessionsPerHour}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Idle chairs</span>
            <span className="text-red-400 font-bold">{freeChairs} chair{freeChairs !== 1 ? "s" : ""}</span>
          </div>
          <div className="mt-2 pt-2 border-t border-white/5 flex justify-between text-sm">
            <span className="text-gray-400 font-bold">Revenue if fully booked</span>
            <span className="text-green-400 font-black">{potentialPerHour} MAD/hr</span>
          </div>
        </div>
      )}

      <div className="h-0.5 bg-red-900">
        <div
          className="h-full bg-red-500 transition-all duration-1000"
          style={{ width: `${Math.min(100, (lostMad / (potentialPerHour || 1)) * 100)}%` }}
        />
      </div>
    </div>
  );
}

// ── Queue Panel ────────────────────────────────────────────────────────────
function QueuePanel({ salonId, token }: { salonId: number; token: string }) {
  const [queue, setQueue] = useState<Claim[]>([]);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const { toast } = useToast();

  const loadQueue = useCallback(async () => {
    const res = await fetch(`${API}/salons/${salonId}/queue`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setQueue(await res.json());
  }, [salonId, token]);

  useEffect(() => {
    loadQueue();
    const id = setInterval(loadQueue, 10000);
    return () => clearInterval(id);
  }, [loadQueue]);

  const updateClaim = async (claimId: number, status: string) => {
    setUpdatingId(claimId);
    try {
      await fetch(`${API}/claims/${claimId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      toast({ title: status === "noshow" ? "Marked as no-show" : "Marked complete ✓" });
      loadQueue();
    } finally {
      setUpdatingId(null);
    }
  };

  if (queue.length === 0) {
    return (
      <div className="mx-4 mb-5 rounded-2xl border border-white/10 bg-white/3 p-5 text-center">
        <Users size={28} className="text-gray-700 mx-auto mb-2" />
        <p className="text-gray-600 text-sm font-bold">No clients in queue</p>
        <p className="text-gray-700 text-xs mt-0.5">Claims appear here when clients book a chair</p>
      </div>
    );
  }

  return (
    <div className="px-4 mb-5 space-y-2">
      {queue.map((claim, i) => {
        const expiresIn = Math.max(0, Math.round((new Date(claim.expires_at).getTime() - Date.now()) / 60000));
        return (
          <div
            key={claim.id}
            className="rounded-2xl border border-[#00f2ff]/20 bg-[#00f2ff]/5 p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-[#00f2ff]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#00f2ff] font-black text-sm">#{i + 1}</span>
              </div>
              <img
                src={claim.client_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(claim.client_name)}&background=0d1a2e&color=00C1FF&bold=true&size=64`}
                alt={claim.client_name}
                className="w-9 h-9 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{claim.client_name}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock size={10} />
                  <span>{formatTimeAgo(claim.created_at)}</span>
                  <span>·</span>
                  <span className="text-[#00f2ff]">expires in {expiresIn}m</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-green-400 font-black text-sm">{claim.deposit_amount} MAD</p>
                <p className="text-gray-600 text-xs">•••• {claim.card_last4}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => updateClaim(claim.id, "completed")}
                disabled={updatingId === claim.id}
                className="flex-1 py-2 rounded-xl bg-green-500/20 border border-green-500/40 text-green-400 font-bold text-xs flex items-center justify-center gap-1"
              >
                <CheckCircle size={12} />
                Check In
              </button>
              <button
                onClick={() => updateClaim(claim.id, "noshow")}
                disabled={updatingId === claim.id}
                className="flex-1 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-xs flex items-center justify-center gap-1"
              >
                <AlertTriangle size={12} />
                No-Show
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export default function SalonDashboard() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [togglingLive, setTogglingLive] = useState(false);
  const [newChairName, setNewChairName] = useState("");
  const [addingChair, setAddingChair] = useState(false);
  const [showAddChair, setShowAddChair] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "chairs" | "queue">("overview");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadSalon = useCallback(async () => {
    const allRes = await fetch(`${API}/salons`, { headers: { Authorization: `Bearer ${token}` } });
    if (!allRes.ok) return;
    const all: Salon[] = await allRes.json();
    if (all.length === 0) return;
    const detail = await fetch(`${API}/salons/${all[0].id}`).then(r => r.json());
    setSalon(detail);
  }, [token]);

  useEffect(() => {
    loadSalon().finally(() => setLoading(false));
    pollRef.current = setInterval(loadSalon, 15000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadSalon]);

  const toggleLive = async () => {
    if (!salon) return;
    setTogglingLive(true);
    try {
      const res = await fetch(`${API}/salons/${salon.id}/go-live`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const updated = await res.json();
        setSalon(prev => prev ? { ...prev, is_live: updated.is_live, live_since: updated.live_since } : prev);
        toast({
          title: updated.is_live ? "🟢 You're now LIVE!" : "Offline",
          description: updated.is_live
            ? "Clients within 5km can see your open chairs"
            : "Your salon is now hidden from the map",
        });
      }
    } finally {
      setTogglingLive(false);
    }
  };

  const toggleChair = async (chairId: number) => {
    if (!salon) return;
    setTogglingId(chairId);
    try {
      const res = await fetch(`${API}/salons/${salon.id}/chairs/${chairId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const updated = await res.json();
        setSalon(prev => prev ? {
          ...prev,
          chairs: prev.chairs.map(c => c.id === chairId ? updated : c),
        } : prev);
      }
    } finally {
      setTogglingId(null);
    }
  };

  const addChair = async () => {
    if (!salon || !newChairName.trim()) return;
    setAddingChair(true);
    try {
      const res = await fetch(`${API}/salons/${salon.id}/chairs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newChairName.trim() }),
      });
      if (res.ok) {
        const chair = await res.json();
        setSalon(prev => prev ? { ...prev, chairs: [...prev.chairs, chair] } : prev);
        setNewChairName("");
        setShowAddChair(false);
        toast({ title: "Chair added!" });
      }
    } finally {
      setAddingChair(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#36013F] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#00f2ff] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-[100dvh] bg-[#36013F] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#00f2ff] to-[#ff007f] flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(0,193,255,0.4)]">
          <Scissors size={36} className="text-white" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">No salon yet</h2>
        <p className="text-gray-500 text-sm">Your salon profile will appear here once set up.</p>
      </div>
    );
  }

  const freeChairs = salon.chairs.filter(c => c.status === "available").length;
  const avgRating = salon.reviews?.length
    ? (salon.reviews.reduce((s: number, r: any) => s + r.rating, 0) / salon.reviews.length).toFixed(1)
    : "–";
  const queueCount = salon.activeClaims?.length ?? 0;

  return (
    <div className="min-h-[100dvh] bg-[#36013F] pb-28">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#00f2ff]/8 to-transparent pt-14 pb-4 px-5">
        <p className="text-[#00f2ff] text-xs font-bold uppercase tracking-widest mb-1">Salon Dashboard</p>
        <h1 className="text-2xl font-black text-white">{salon.name}</h1>
        <p className="text-gray-600 text-xs mt-0.5">{salon.address}</p>
      </div>

      {/* ── GO LIVE TOGGLE ── */}
      <div className="px-4 mb-5">
        <div
          className={`rounded-3xl p-5 border-2 transition-all duration-300 ${
            salon.is_live
              ? "border-green-500 shadow-[0_0_30px_rgba(74,222,128,0.25)]"
              : "border-white/10"
          }`}
          style={{
            background: salon.is_live
              ? "linear-gradient(135deg,rgba(74,222,128,0.08),rgba(0,10,0,0.95))"
              : "rgba(255,255,255,0.03)",
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {salon.is_live && (
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                )}
                <p className={`font-black text-xl ${salon.is_live ? "text-green-400" : "text-white"}`}>
                  {salon.is_live ? "LIVE NOW" : "Go Live"}
                </p>
              </div>
              <p className="text-gray-500 text-xs leading-relaxed">
                {salon.is_live
                  ? `Since ${salon.live_since ? formatTime(salon.live_since) : "today"} · ${freeChairs} chair${freeChairs !== 1 ? "s" : ""} open · clients can find you`
                  : `Tap to appear on the client map · ${freeChairs} chair${freeChairs !== 1 ? "s" : ""} ready`}
              </p>
            </div>

            <button
              onClick={toggleLive}
              disabled={togglingLive}
              className={`relative w-16 h-8 rounded-full transition-all duration-300 flex-shrink-0 ${
                salon.is_live ? "bg-green-500 shadow-[0_0_15px_rgba(74,222,128,0.6)]" : "bg-gray-800"
              } ${togglingLive ? "opacity-60" : ""}`}
            >
              <div
                className={`absolute w-6 h-6 bg-white rounded-full top-1 transition-all duration-300 shadow-md ${
                  salon.is_live ? "left-9" : "left-1"
                }`}
              />
            </button>
          </div>

          {salon.is_live && (
            <div className="mt-3 flex items-center gap-3 pt-3 border-t border-green-500/20">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Radio size={12} className="text-green-400" />
                <span>Live on map · 5km radius</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 ml-auto">
                <Users size={12} className="text-[#00f2ff]" />
                <span className="text-[#00f2ff] font-bold">{queueCount} in queue</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── LOST REVENUE ESTIMATOR ── */}
      <RevenueEstimator salon={salon} freeChairs={freeChairs} />

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 px-4 mb-5">
        {[
          { label: "Free", value: freeChairs, color: "text-green-400" },
          { label: "Queue", value: queueCount, color: "text-[#00f2ff]" },
          { label: "Rating", value: avgRating, color: "text-yellow-400" },
          { label: "Services", value: salon.services?.length ?? 0, color: "text-[#ff007f]" },
        ].map(stat => (
          <div key={stat.label} className="bg-white/5 border border-white/8 rounded-2xl p-3 flex flex-col items-center">
            <span className={`text-xl font-black ${stat.color}`}>{stat.value}</span>
            <span className="text-gray-600 text-[10px] font-bold mt-0.5">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex px-4 gap-2 mb-4">
        {(["overview", "chairs", "queue"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
              activeTab === tab
                ? "bg-[#00f2ff]/15 border-[#00f2ff]/50 text-[#00f2ff]"
                : "bg-white/3 border-white/8 text-gray-500"
            }`}
          >
            {tab}
            {tab === "queue" && queueCount > 0 && (
              <span className="ml-1 bg-[#00f2ff] text-black rounded-full text-[10px] font-black px-1.5">{queueCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === "overview" && (
        <div className="px-4 space-y-3">
          <p className="text-white font-black text-base mb-1">Services ({salon.services?.length ?? 0})</p>
          {(salon.services ?? []).slice(0, 4).map((s: any) => (
            <div key={s.id} className="bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 flex justify-between items-center">
              <span className="text-white text-sm font-bold">{s.name}</span>
              <span className="text-[#00f2ff] font-black text-sm">{s.price} MAD</span>
            </div>
          ))}
          {(salon.services?.length ?? 0) === 0 && (
            <p className="text-gray-600 text-sm text-center py-4">No services added yet.</p>
          )}
        </div>
      )}

      {/* ── CHAIRS TAB ── */}
      {activeTab === "chairs" && (
        <div className="px-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white font-black text-base">
              Chair Management
              <span className="ml-2 text-gray-600 font-normal text-sm">({freeChairs}/{salon.chairs.length} free)</span>
            </p>
            <button
              onClick={() => setShowAddChair(v => !v)}
              className="w-9 h-9 rounded-xl bg-[#00f2ff]/15 border border-[#00f2ff]/30 flex items-center justify-center"
            >
              <Plus size={18} className="text-[#00f2ff]" />
            </button>
          </div>

          {showAddChair && (
            <div className="mb-3 flex gap-2">
              <input
                value={newChairName}
                onChange={e => setNewChairName(e.target.value)}
                placeholder="e.g. Chair A, VIP Chair"
                onKeyDown={e => e.key === "Enter" && addChair()}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#00f2ff] placeholder:text-gray-600"
              />
              <button
                onClick={addChair}
                disabled={addingChair || !newChairName.trim()}
                className="bg-[#00f2ff] disabled:opacity-40 text-black font-black text-sm px-4 rounded-xl"
              >
                Add
              </button>
            </div>
          )}

          <div className="space-y-2">
            {salon.chairs.length === 0 && (
              <p className="text-gray-600 text-sm text-center py-6">No chairs yet. Add your first above.</p>
            )}
            {salon.chairs.map(chair => {
              const isAvailable = chair.status === "available";
              const hasClaim = salon.activeClaims?.some(c => c.chair_name === chair.name);
              return (
                <div
                  key={chair.id}
                  className={`flex items-center justify-between rounded-2xl px-4 py-3 border transition-all ${
                    hasClaim
                      ? "bg-[#00f2ff]/10 border-[#00f2ff]/40 shadow-[0_0_12px_rgba(0,193,255,0.1)]"
                      : isAvailable
                      ? "bg-green-500/8 border-green-500/25"
                      : "bg-white/3 border-white/8"
                  }`}
                >
                  <div>
                    <p className="text-white font-bold">{chair.name}</p>
                    <p className={`text-xs font-bold ${
                      hasClaim ? "text-[#00f2ff]" : isAvailable ? "text-green-400" : "text-gray-500"
                    }`}>
                      {hasClaim ? "● Client en route" : isAvailable ? "✓ Available" : "● Occupied"}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleChair(chair.id)}
                    disabled={togglingId === chair.id}
                    className="transition-opacity disabled:opacity-50"
                  >
                    {isAvailable
                      ? <ToggleRight size={36} className="text-green-400" />
                      : <ToggleLeft size={36} className="text-gray-600" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── QUEUE TAB ── */}
      {activeTab === "queue" && (
        <div>
          <div className="px-4 mb-3">
            <p className="text-white font-black text-base">Live Queue</p>
            <p className="text-gray-600 text-xs mt-0.5">Clients with confirmed deposits — auto-refreshes every 10s</p>
          </div>
          <QueuePanel salonId={salon.id} token={token!} />
        </div>
      )}
    </div>
  );
}
