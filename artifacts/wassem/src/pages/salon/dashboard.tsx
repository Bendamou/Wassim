import { useState, useEffect, useCallback, useRef } from "react";
import {
  Scissors, Plus, TrendingUp, Users, Star,
  Package, Radio, DollarSign, Clock, AlertTriangle, CheckCircle, X,
  Zap, ChevronDown, ChevronUp, Navigation, Edit3, Camera,
  Share2, Copy, Check, QrCode,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const API = "/api";

type Chair = { id: number; name: string; status: "available" | "occupied" };
type Claim = {
  id: number; client_name: string; client_avatar: string;
  chair_name: string; status: string; deposit_amount: number;
  card_last4: string; created_at: string; expires_at: string;
  service_name: string | null;
  client_lat?: number | null; client_lng?: number | null;
};
type Salon = {
  id: number; name: string; description: string; address: string;
  lat?: number | null; lng?: number | null;
  free_chairs: number; total_chairs: number; is_live: boolean;
  live_since: string | null; avg_service_price: number;
  photos?: string | null;
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
      <div className="mx-4 mb-5 rounded-3xl overflow-hidden border border-[#FF1F8E]/30"
        style={{ background: "linear-gradient(135deg,#1a0010,#0f0008)" }}>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-[#FF1F8E]/20 flex items-center justify-center">
              <DollarSign size={16} className="text-[#FF1F8E]" />
            </div>
            <p className="text-[#FF1F8E] font-black text-sm uppercase tracking-wider">Lost Revenue Estimator</p>
          </div>
          <p className="text-white/80 text-sm leading-relaxed">
            Your {salon.chairs.length} chair{salon.chairs.length !== 1 ? "s" : ""} could earn{" "}
            <span className="text-[#FF1F8E] font-black text-lg">{potentialPerHour} MAD/hr</span>{" "}
            when live. Every minute offline is missed revenue.
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            <Zap size={12} className="text-yellow-400" />
            <span>Based on {avgPrice} MAD avg · 2 sessions/hr/chair</span>
          </div>
        </div>
        <div className="h-1 bg-[#FF1F8E]/20">
          <div className="h-full w-full bg-gradient-to-r from-[#FF1F8E] to-transparent animate-pulse" />
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
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => d * Math.PI / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function QueuePanel({ salonId, token, salonLat, salonLng }: {
  salonId: number; token: string;
  salonLat?: number | null; salonLng?: number | null;
}) {
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
            className="rounded-2xl border border-[#00B4FF]/20 bg-[#00B4FF]/5 p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-[#00B4FF]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#00B4FF] font-black text-sm">#{i + 1}</span>
              </div>
              <img
                src={claim.client_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(claim.client_name)}&background=0d1a2e&color=00C1FF&bold=true&size=64`}
                alt={claim.client_name}
                className="w-9 h-9 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-bold text-sm truncate">{claim.client_name}</p>
                  {claim.status === "en_route" && (
                    <span className="flex-shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(255,31,142,0.18)", color: "#FF1F8E", border: "1px solid rgba(255,31,142,0.35)" }}>
                      🏃 On the way
                    </span>
                  )}
                </div>
                {claim.service_name && (
                  <p className="text-[#00B4FF] text-xs font-bold mt-0.5 flex items-center gap-1">
                    <Scissors size={9} />
                    {claim.service_name}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5 flex-wrap">
                  <Clock size={10} />
                  <span>{formatTimeAgo(claim.created_at)}</span>
                  <span>·</span>
                  <span className="text-[#00B4FF]">exp {expiresIn}m</span>
                  {claim.client_lat && claim.client_lng && salonLat && salonLng && (
                    <>
                      <span>·</span>
                      <span className="text-green-400 font-bold">
                        📍 {haversineKm(salonLat, salonLng, claim.client_lat, claim.client_lng).toFixed(1)} km away
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-green-400 font-black text-sm">{claim.deposit_amount} MAD</p>
                <p className="text-gray-600 text-xs">•••• {claim.card_last4}</p>
              </div>
            </div>
            {claim.client_lat && claim.client_lng && (
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${claim.client_lat},${claim.client_lng}`}
                target="_blank" rel="noopener noreferrer"
                className="w-full mb-2 py-2 rounded-xl border border-[#00B4FF]/30 text-[#00B4FF] font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                style={{ background: "rgba(0,180,255,0.08)" }}>
                <Navigation size={12} />
                Navigate to Client
                {salonLat && salonLng && ` · ${haversineKm(salonLat, salonLng, claim.client_lat, claim.client_lng).toFixed(1)} km`}
              </a>
            )}
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

// ── iOS-style Chair Toggle ─────────────────────────────────────────────────
function ChairToggle({ isOn, onToggle, loading }: { isOn: boolean; onToggle: () => void; loading: boolean }) {
  return (
    <button
      onClick={onToggle}
      disabled={loading}
      aria-label={isOn ? "Mark chair busy" : "Mark chair available"}
      className="relative flex-shrink-0 rounded-full disabled:opacity-50 focus:outline-none"
      style={{
        width: 52,
        height: 28,
        background: isOn
          ? "linear-gradient(135deg,#4ade80,#22c55e)"
          : "rgba(255,255,255,0.10)",
        border: isOn ? "none" : "1px solid rgba(255,255,255,0.15)",
        boxShadow: isOn ? "0 0 14px rgba(74,222,128,0.45)" : "none",
        transition: "background 0.3s, box-shadow 0.3s",
      }}
    >
      <span
        className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md block"
        style={{
          left: isOn ? "calc(100% - 26px)" : 2,
          transition: "left 0.28s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      />
    </button>
  );
}

// ── Swipe-to-Finish Slider ─────────────────────────────────────────────────
function SwipeToFinish({ onFinish, loading }: { onFinish: () => void; loading: boolean }) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [done, setDone] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  const THUMB = 48;
  const PAD = 4;
  const maxOff = () => (containerRef.current?.offsetWidth ?? 260) - THUMB - PAD * 2;

  const onStart = (x: number) => {
    if (loading || done) return;
    setDragging(true);
    startXRef.current = x - offset;
  };

  const onMove = (x: number) => {
    if (!dragging) return;
    setOffset(Math.max(0, Math.min(x - startXRef.current, maxOff())));
  };

  const onEnd = () => {
    if (!dragging) return;
    setDragging(false);
    if (offset >= maxOff() * 0.72) {
      setDone(true);
      setOffset(maxOff());
      onFinish();
      setTimeout(() => { setDone(false); setOffset(0); }, 1400);
    } else {
      setOffset(0);
    }
  };

  const pct = maxOff() > 0 ? offset / maxOff() : 0;

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl overflow-hidden select-none"
      style={{ height: 48, background: "rgba(255,31,142,0.08)", border: "1px solid rgba(255,31,142,0.18)" }}
      onMouseMove={e => onMove(e.clientX)}
      onMouseUp={onEnd}
      onMouseLeave={onEnd}
      onTouchMove={e => { e.preventDefault(); onMove(e.touches[0].clientX); }}
      onTouchEnd={onEnd}
    >
      {/* Progress fill */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: "linear-gradient(90deg,rgba(255,31,142,0.28),rgba(155,48,255,0.16))",
          clipPath: `inset(0 ${100 - pct * 100}% 0 0)`,
          transition: dragging ? "none" : "clip-path 0.3s ease",
        }}
      />
      {/* Track label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span
          className="text-[11px] font-black tracking-widest uppercase"
          style={{ color: "rgba(255,31,142,0.55)", opacity: Math.max(0, 1 - pct * 2) }}
        >
          Swipe to finish ›
        </span>
        {done && (
          <span className="text-[11px] font-black text-green-400 tracking-wider absolute">
            ✓ Chair is free!
          </span>
        )}
      </div>
      {/* Draggable thumb */}
      <div
        className="absolute top-1 bottom-1 rounded-xl flex items-center justify-center touch-none"
        style={{
          left: PAD,
          width: THUMB,
          transform: `translateX(${offset}px)`,
          background: done
            ? "linear-gradient(135deg,#4ade80,#22c55e)"
            : "linear-gradient(135deg,#FF1F8E,#9B30FF)",
          transition: dragging ? "none" : "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          cursor: dragging ? "grabbing" : "grab",
          boxShadow: "0 2px 14px rgba(255,31,142,0.45)",
        }}
        onMouseDown={e => { e.preventDefault(); onStart(e.clientX); }}
        onTouchStart={e => { e.preventDefault(); onStart(e.touches[0].clientX); }}
      >
        <span className="text-white text-lg font-black pointer-events-none">
          {done ? "✓" : "›"}
        </span>
      </div>
    </div>
  );
}

// ── Dashboard Share / QR Panel ─────────────────────────────────────────────
function DashboardSharePanel({ salonId, salonName }: { salonId: number; salonName: string }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const publicUrl = `${window.location.origin}/salon/${salonId}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(publicUrl)}&bgcolor=0D0020&color=00B4FF&margin=12&format=png`;

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(publicUrl); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) await navigator.share({ title: salonName, url: publicUrl }).catch(() => {});
  };

  return (
    <div className="px-4 mb-5">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between rounded-2xl px-4 py-3.5 border transition-all"
        style={{
          background: expanded ? "rgba(0,180,255,0.07)" : "rgba(255,255,255,0.03)",
          borderColor: expanded ? "rgba(0,180,255,0.35)" : "rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00B4FF]/15 flex items-center justify-center">
            <QrCode size={18} className="text-[#00B4FF]" />
          </div>
          <div className="text-left">
            <p className="text-white font-black text-sm">Share Your Salon</p>
            <p className="text-gray-500 text-[10px]">QR code · link · print it at your front desk</p>
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
      </button>

      {expanded && (
        <div className="mt-2 rounded-2xl border border-[#00B4FF]/15 p-5 flex flex-col items-center gap-4"
          style={{ background: "rgba(0,180,255,0.04)" }}>

          {/* QR code */}
          <div className="rounded-2xl overflow-hidden border border-[#00B4FF]/25 shadow-[0_0_24px_rgba(0,180,255,0.12)]">
            <img src={qrUrl} alt="Salon QR code" width={200} height={200} className="block" />
          </div>
          <p className="text-[#00B4FF] font-bold text-xs tracking-wide -mt-1">{salonName}</p>

          {/* Link row */}
          <div className="w-full flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
            <span className="flex-1 text-gray-400 text-[10px] truncate font-mono">{publicUrl}</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-all shrink-0"
              style={{ background: copied ? "rgba(74,222,128,0.15)" : "rgba(0,180,255,0.15)", color: copied ? "#4ade80" : "#00B4FF" }}
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          <p className="text-gray-600 text-[10px] text-center">
            Print this QR code and stick it at your front desk — clients scan it to see your live chairs and book instantly.
          </p>

          {typeof navigator.share === "function" && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 font-black text-black text-sm"
              style={{ background: "linear-gradient(90deg,#00B4FF,#FF1F8E)" }}
            >
              <Share2 size={15} />
              Share via…
            </button>
          )}
        </div>
      )}
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
  const [activeTab, setActiveTab] = useState<"overview" | "chairs" | "queue" | "edit">("overview");
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPhotos, setEditPhotos] = useState<string[]>([]);
  const [photoInput, setPhotoInput] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
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

  useEffect(() => {
    if (activeTab !== "edit" || !salon) return;
    setEditName(salon.name ?? "");
    setEditDesc(salon.description ?? "");
    setEditAddress(salon.address ?? "");
    let photos: string[] = [];
    try { photos = JSON.parse(salon.photos ?? "[]"); } catch {}
    setEditPhotos(photos);
  }, [activeTab, salon]);

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

  const saveEdit = async () => {
    if (!salon) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`${API}/salons/${salon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: editName.trim() || null,
          description: editDesc.trim() || null,
          address: editAddress.trim() || null,
          photos: JSON.stringify(editPhotos),
        }),
      });
      if (res.ok) {
        await loadSalon();
        toast({ title: "Salon profile updated!" });
      }
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#090013] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#00B4FF] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-[100dvh] bg-[#090013] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#00B4FF] to-[#FF1F8E] flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(0,193,255,0.4)]">
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
    <div className="min-h-[100dvh] bg-[#090013] pb-28">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#00B4FF]/8 to-transparent pt-14 pb-4 px-5">
        <p className="text-[#00B4FF] text-xs font-bold uppercase tracking-widest mb-1">Salon Dashboard</p>
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
                <Users size={12} className="text-[#00B4FF]" />
                <span className="text-[#00B4FF] font-bold">{queueCount} in queue</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── LOST REVENUE ESTIMATOR ── */}
      <RevenueEstimator salon={salon} freeChairs={freeChairs} />

      {/* ── SHARE / QR PANEL ── */}
      <DashboardSharePanel salonId={salon.id} salonName={salon.name} />

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 px-4 mb-5">
        {[
          { label: "Free", value: freeChairs, color: "text-green-400" },
          { label: "Queue", value: queueCount, color: "text-[#00B4FF]" },
          { label: "Rating", value: avgRating, color: "text-yellow-400" },
          { label: "Services", value: salon.services?.length ?? 0, color: "text-[#FF1F8E]" },
        ].map(stat => (
          <div key={stat.label} className="bg-white/5 border border-white/8 rounded-2xl p-3 flex flex-col items-center">
            <span className={`text-xl font-black ${stat.color}`}>{stat.value}</span>
            <span className="text-gray-600 text-[10px] font-bold mt-0.5">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex px-4 gap-2 mb-4">
        {(["overview", "chairs", "queue", "edit"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
              activeTab === tab
                ? "bg-[#00B4FF]/15 border-[#00B4FF]/50 text-[#00B4FF]"
                : "bg-white/3 border-white/8 text-gray-500"
            }`}
          >
            {tab}
            {tab === "queue" && queueCount > 0 && (
              <span className="ml-1 bg-[#00B4FF] text-black rounded-full text-[10px] font-black px-1.5">{queueCount}</span>
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
              <span className="text-[#00B4FF] font-black text-sm">{s.price} MAD</span>
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
              className="w-9 h-9 rounded-xl bg-[#00B4FF]/15 border border-[#00B4FF]/30 flex items-center justify-center"
            >
              <Plus size={18} className="text-[#00B4FF]" />
            </button>
          </div>

          {showAddChair && (
            <div className="mb-3 flex gap-2">
              <input
                value={newChairName}
                onChange={e => setNewChairName(e.target.value)}
                placeholder="e.g. Chair A, VIP Chair"
                onKeyDown={e => e.key === "Enter" && addChair()}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#00B4FF] placeholder:text-gray-600"
              />
              <button
                onClick={addChair}
                disabled={addingChair || !newChairName.trim()}
                className="bg-[#00B4FF] disabled:opacity-40 text-black font-black text-sm px-4 rounded-xl"
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
              const isToggling = togglingId === chair.id;
              return (
                <div
                  key={chair.id}
                  className="rounded-2xl border transition-all overflow-hidden"
                  style={{
                    background: hasClaim
                      ? "rgba(0,180,255,0.07)"
                      : isAvailable
                      ? "rgba(74,222,128,0.06)"
                      : "rgba(255,255,255,0.03)",
                    borderColor: hasClaim
                      ? "rgba(0,180,255,0.40)"
                      : isAvailable
                      ? "rgba(74,222,128,0.30)"
                      : "rgba(255,255,255,0.08)",
                    boxShadow: isAvailable
                      ? "0 0 18px rgba(74,222,128,0.12)"
                      : "none",
                  }}
                >
                  {/* ── Header row ── */}
                  <div className="flex items-center justify-between px-4 pt-3 pb-2">
                    <div className="flex items-center gap-3">
                      {/* Status dot */}
                      <div className="relative flex-shrink-0">
                        {isAvailable && (
                          <div className="absolute inset-0 rounded-full animate-ping"
                            style={{ background: hasClaim ? "#00B4FF" : "#4ade80", opacity: 0.35 }} />
                        )}
                        <div className="w-3 h-3 rounded-full" style={{
                          background: hasClaim ? "#00B4FF" : isAvailable ? "#4ade80" : "#374151",
                          boxShadow: isAvailable
                            ? `0 0 8px ${hasClaim ? "#00B4FF" : "#4ade80"}`
                            : "none",
                        }} />
                      </div>
                      <div>
                        <p className="text-white font-bold">{chair.name}</p>
                        <p className="text-[11px] font-bold" style={{
                          color: hasClaim ? "#00B4FF" : isAvailable ? "#4ade80" : "#6b7280",
                        }}>
                          {hasClaim ? "● Client en route" : isAvailable ? "✓ Live — visible on map" : "● Offline — not bookable"}
                        </p>
                      </div>
                    </div>
                    {/* iOS toggle */}
                    <ChairToggle
                      isOn={isAvailable}
                      onToggle={() => toggleChair(chair.id)}
                      loading={isToggling}
                    />
                  </div>

                  {/* ── Swipe-to-Finish (occupied chairs only) ── */}
                  {!isAvailable && (
                    <div className="px-4 pb-3">
                      <SwipeToFinish
                        onFinish={() => toggleChair(chair.id)}
                        loading={isToggling}
                      />
                    </div>
                  )}

                  {/* ── Active glow bar (available chairs) ── */}
                  {isAvailable && (
                    <div className="h-0.5 mx-4 mb-3 rounded-full"
                      style={{ background: `linear-gradient(90deg,${hasClaim ? "#00B4FF" : "#4ade80"},transparent)` }} />
                  )}
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
          <QueuePanel salonId={salon.id} token={token!} salonLat={salon.lat} salonLng={salon.lng} />
        </div>
      )}

      {/* ── EDIT TAB ── */}
      {activeTab === "edit" && (
        <div className="px-4 space-y-5 pb-4">
          <div>
            <p className="text-white font-black text-base mb-0.5">Edit Salon Profile</p>
            <p className="text-gray-600 text-xs">Updates your public page visible to clients</p>
          </div>

          {/* Name */}
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wider font-bold block mb-1.5">Salon Name</label>
            <input value={editName} onChange={e => setEditName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#9B30FF] placeholder:text-gray-700"
              placeholder={salon.name} />
          </div>

          {/* Description */}
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wider font-bold block mb-1.5">About the Salon</label>
            <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3}
              placeholder="Tell clients what makes your salon special, specialties, vibe…"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#9B30FF] placeholder:text-gray-700 resize-none" />
          </div>

          {/* Address */}
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wider font-bold block mb-1.5">Address</label>
            <input value={editAddress} onChange={e => setEditAddress(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#9B30FF] placeholder:text-gray-700"
              placeholder={salon.address ?? "Street, City, Neighbourhood"} />
          </div>

          {/* Photos */}
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wider font-bold block mb-1">Salon & Client Photos</label>
            <p className="text-gray-600 text-xs mb-2">Paste image URLs — salon interior, haircuts, client results</p>
            <div className="flex gap-2 mb-3">
              <input type="url" value={photoInput} onChange={e => setPhotoInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && photoInput.trim()) {
                    setEditPhotos(prev => [...prev, photoInput.trim()]);
                    setPhotoInput("");
                  }
                }}
                placeholder="https://..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#9B30FF] placeholder:text-gray-700" />
              <button
                onClick={() => {
                  if (photoInput.trim()) {
                    setEditPhotos(prev => [...prev, photoInput.trim()]);
                    setPhotoInput("");
                  }
                }}
                disabled={!photoInput.trim()}
                className="px-4 py-2.5 rounded-xl font-black text-sm disabled:opacity-40 flex items-center gap-1.5"
                style={{ background: "linear-gradient(135deg,#9B30FF,#00B4FF)", color: "#fff" }}>
                <Camera size={14} />
              </button>
            </div>
            {editPhotos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {editPhotos.map((url, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden aspect-square group">
                    <img src={url} alt="" className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/200x200/130028/9B30FF?text=Photo"; }} />
                    <button
                      onClick={() => setEditPhotos(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.2)" }}>
                      <X size={12} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save */}
          <button onClick={saveEdit} disabled={savingEdit}
            className="w-full py-4 rounded-2xl font-black text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#9B30FF,#00B4FF)", color: "#fff", boxShadow: "0 0 20px rgba(155,48,255,0.35)" }}>
            {savingEdit ? "Saving…" : <><Edit3 size={16} />Save Salon Profile</>}
          </button>
        </div>
      )}
    </div>
  );
}
