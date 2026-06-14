import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { Scissors, Navigation, Zap, X, MapPin, Users, Radio, ChevronRight, Search, Bell } from "lucide-react";
import { useAuth } from "@/lib/auth";
import "leaflet/dist/leaflet.css";

// ── City definitions ──────────────────────────────────────────────────────
const CITIES = [
  { key: "all",     label: "All",     lat: 34.80, lng: -2.11, zoom: 9  },
  { key: "oujda",   label: "Oujda",   lat: 34.6814, lng: -1.9086, zoom: 13 },
  { key: "berkane", label: "Berkane", lat: 34.9200, lng: -2.3200, zoom: 13 },
] as const;
type CityKey = (typeof CITIES)[number]["key"];

const DEFAULT_CENTER: [number, number] = [34.6814, -1.9086];
const DEFAULT_ZOOM = 12;
const POLL_MS = 20_000;
const AVAIL_POLL_MS = 15_000;
const BANNER_TTL = 8_000;
const AVAIL_TTL = 9_000;

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371, r = (d: number) => (d * Math.PI) / 180;
  const a = Math.sin(r(lat2-lat1)/2)**2 + Math.cos(r(lat1))*Math.cos(r(lat2))*Math.sin(r(lng2-lng1)/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function fmtDist(km: number) { return km < 1 ? `${Math.round(km*1000)} m` : `${km.toFixed(1)} km`; }
function fmtCountdown(iso: string | null | undefined): { label: string; mins: number } | null {
  if (!iso) return null;
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 0) return null;
  const mins = Math.ceil(diffMs / 60_000);
  return { label: mins < 1 ? "< 1 min" : `${mins} min`, mins };
}

// ── Types ─────────────────────────────────────────────────────────────────
type Salon = {
  id: number; name: string; address: string; lat: number; lng: number;
  free_chairs: number; total_chairs: number; is_live: boolean;
  active_claims?: number; next_expiry?: string | null;
  categories?: string; description?: string; avg_service_price?: number;
  is_verified?: boolean; header_image?: string | null; photos?: string | null;
};
type FlashOffer = {
  id: number; salon_id: number; title: string; discount_pct: number;
  is_active: boolean; salon_name?: string; lat?: number; lng?: number;
};
type BannerData = FlashOffer & { distKm: number };
type AvailBanner = { salonId: number; salonName: string; freeChairs: number; distKm: number; lat: number; lng: number };

const CATEGORIES = [
  { key: "all",      label: "All",      emoji: "🔍", color: "#a855f7" },
  { key: "barber",   label: "Barber",   emoji: "💈", color: "#00B4FF" },
  { key: "hair",     label: "Hair",     emoji: "✂️", color: "#00B4FF" },
  { key: "nails",    label: "Nails",    emoji: "💅", color: "#FF1F8E" },
  { key: "skincare", label: "Skincare", emoji: "🧴", color: "#FF1F8E" },
  { key: "massage",  label: "Massage",  emoji: "💆", color: "#FF1F8E" },
  { key: "spa",      label: "Spa",      emoji: "🧖", color: "#FF1F8E" },
] as const;
type CatKey = (typeof CATEGORIES)[number]["key"];

// ── Smart category matcher (works even without DB `categories` field) ─────
function matchesCategory(salon: Salon, cat: CatKey): boolean {
  if (cat === "all") return true;
  if (salon.categories) {
    return salon.categories.split(",").map(c => c.trim()).includes(cat);
  }
  const text = `${salon.name} ${salon.description ?? ""}`.toLowerCase();
  if (cat === "barber")   return /barber|barbier|rasage|dégradé|coupe homme|barbershop/.test(text);
  if (cat === "hair")     return /hair|coiffure|kératine|coloration|coiffeur/.test(text);
  if (cat === "nails")    return /nail|manucure|beauty|beauté|ongle/.test(text);
  if (cat === "skincare") return /skin|soin|spa|beauté|facial/.test(text);
  if (cat === "massage")  return /massage/.test(text);
  if (cat === "spa")      return /spa|hammam/.test(text);
  return false;
}

function matchesCity(salon: Salon, city: CityKey): boolean {
  if (city === "all") return true;
  const addr = `${salon.address ?? ""}`.toLowerCase();
  return addr.includes(city);
}

function matchesSearch(salon: Salon, q: string): boolean {
  if (!q.trim()) return true;
  const t = `${salon.name} ${salon.address ?? ""} ${salon.description ?? ""}`.toLowerCase();
  return q.toLowerCase().split(" ").every(word => t.includes(word));
}

// ── Flash Banner ──────────────────────────────────────────────────────────
function FlashBanner({ offer, onDismiss, onView }: { offer: BannerData; onDismiss: () => void; onView: () => void }) {
  const [progress, setProgress] = useState(100);
  const startRef = useRef(Date.now());
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const tick = () => {
      const pct = Math.max(0, 100 - ((Date.now()-startRef.current)/BANNER_TTL)*100);
      setProgress(pct);
      if (pct > 0) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    const t = setTimeout(onDismiss, BANNER_TTL);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); clearTimeout(t); };
  }, [onDismiss]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-yellow-400/50 shadow-[0_0_40px_rgba(255,221,0,0.25)]"
      style={{ background: "linear-gradient(135deg,#1a1500,#0f0c00)" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%,rgba(255,221,0,0.12),transparent 70%)" }} />
      <div className="relative p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-yellow-400 rounded-xl animate-ping opacity-40" />
              <div className="relative w-9 h-9 bg-yellow-400 rounded-xl flex items-center justify-center shadow-[0_0_14px_rgba(255,221,0,0.7)]">
                <Zap size={18} className="text-black fill-black" />
              </div>
            </div>
            <div>
              <p className="text-yellow-300 text-[10px] font-black uppercase tracking-widest">⚡ Flash Offer</p>
              <p className="text-white font-black text-base leading-tight">{offer.salon_name ?? `Salon #${offer.salon_id}`}</p>
            </div>
          </div>
          <button onClick={onDismiss} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
            <X size={14} className="text-gray-400" />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <div className="bg-yellow-400 text-black font-black text-sm px-2.5 py-1 rounded-lg shadow-[0_0_10px_rgba(255,221,0,0.5)]">
            -{offer.discount_pct}%
          </div>
          <p className="text-gray-300 text-sm font-bold flex-1 truncate">{offer.title}</p>
          <div className="flex items-center gap-1 bg-white/8 border border-white/10 rounded-full px-2 py-1 flex-shrink-0">
            <MapPin size={9} className="text-yellow-400" />
            <span className="text-yellow-300 text-[10px] font-bold">{fmtDist(offer.distKm)}</span>
          </div>
        </div>
        <button onClick={onView} className="w-full mt-3 bg-yellow-400 active:scale-[0.97] text-black font-black text-sm rounded-xl py-2.5 transition-transform">
          View Deal →
        </button>
      </div>
      <div className="h-1 bg-white/5">
        <div className="h-full bg-yellow-400 transition-none" style={{ width: `${progress}%`, boxShadow: "0 0 6px rgba(255,221,0,0.7)" }} />
      </div>
    </div>
  );
}

// ── Availability Banner ───────────────────────────────────────────────────
function AvailabilityBanner({ avail, onDismiss, onBook }: { avail: AvailBanner; onDismiss: () => void; onBook: () => void }) {
  const [progress, setProgress] = useState(100);
  const startRef = useRef(Date.now());
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const tick = () => {
      const pct = Math.max(0, 100 - ((Date.now() - startRef.current) / AVAIL_TTL) * 100);
      setProgress(pct);
      if (pct > 0) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    const t = setTimeout(onDismiss, AVAIL_TTL);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); clearTimeout(t); };
  }, [onDismiss]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-400/40 shadow-[0_0_40px_rgba(52,211,153,0.2)]"
      style={{ background: "linear-gradient(135deg,#001a0d,#000f08)" }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%,rgba(52,211,153,0.1),transparent 70%)" }} />
      <div className="relative p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-emerald-400 rounded-xl animate-ping opacity-30" />
              <div className="relative w-9 h-9 bg-emerald-400 rounded-xl flex items-center justify-center shadow-[0_0_14px_rgba(52,211,153,0.6)]">
                <Bell size={18} className="text-black" />
              </div>
            </div>
            <div>
              <p className="text-emerald-300 text-[10px] font-black uppercase tracking-widest">🟢 Just Opened Up</p>
              <p className="text-white font-black text-base leading-tight">{avail.salonName}</p>
            </div>
          </div>
          <button onClick={onDismiss} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <X size={14} className="text-gray-400" />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <div className="flex items-center gap-1 bg-emerald-400/20 border border-emerald-400/40 rounded-full px-2.5 py-1">
            <Users size={11} className="text-emerald-400" />
            <span className="text-emerald-300 font-black text-sm">{avail.freeChairs} chair{avail.freeChairs !== 1 ? "s" : ""} free</span>
          </div>
          {avail.distKm < 50 && (
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-2 py-1">
              <MapPin size={9} className="text-gray-400" />
              <span className="text-gray-300 text-[10px] font-bold">{fmtDist(avail.distKm)} away</span>
            </div>
          )}
        </div>
        <button onClick={onBook}
          className="w-full mt-3 bg-emerald-400 active:scale-[0.97] text-black font-black text-sm rounded-xl py-2.5 transition-transform shadow-[0_0_12px_rgba(52,211,153,0.4)]">
          Book Now →
        </button>
      </div>
      <div className="h-1 bg-white/5">
        <div className="h-full bg-emerald-400 transition-none" style={{ width: `${progress}%`, boxShadow: "0 0 6px rgba(52,211,153,0.6)" }} />
      </div>
    </div>
  );
}

// ── Salon Card strip ──────────────────────────────────────────────────────
function SalonCard({ salon, onPress, tag }: { salon: Salon; onPress: () => void; tag?: { label: string; color: string } }) {
  const free = Number(salon.free_chairs);
  const live = salon.is_live && free > 0;
  const full = free === 0;
  const borderColor = tag ? "rgba(250,204,21,0.55)" : live ? "rgba(0,180,255,0.45)" : "rgba(255,255,255,0.07)";

  return (
    <button onClick={onPress}
      className="flex-shrink-0 w-52 rounded-2xl overflow-hidden border transition-all active:scale-[0.96] text-left"
      style={{ background: "#130028", borderColor }}>

      {/* ── Photo header ── */}
      {salon.header_image ? (
        <div className="relative w-full h-[72px] overflow-hidden">
          <img
            src={`${salon.header_image}?w=420&h=144&fit=crop&q=70`}
            alt={salon.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* gradient overlay */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom,transparent 30%,rgba(19,0,40,0.85) 100%)" }} />
          {/* tag badge */}
          {tag && (
            <div className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black"
              style={{ background: tag.color, color: "#000" }}>
              {tag.label}
            </div>
          )}
          {/* live badge */}
          {live && (
            <div className="absolute top-1.5 right-1.5 flex items-center gap-1 bg-[#00B4FF]/90 rounded-full px-1.5 py-0.5">
              <Radio size={7} className="text-black" />
              <span className="text-black text-[8px] font-black">LIVE</span>
            </div>
          )}
          {/* full pill */}
          {full && (
            <div className="absolute bottom-1.5 right-1.5 bg-black/70 text-gray-400 text-[8px] font-bold px-1.5 py-0.5 rounded-full">
              Full
            </div>
          )}
        </div>
      ) : (
        /* no photo — minimal top strip */
        <div className="w-full h-8 flex items-center justify-between px-3"
          style={{ background: live ? "rgba(0,180,255,0.1)" : "rgba(255,255,255,0.03)" }}>
          {tag && <span className="text-[9px] font-black" style={{ color: tag.color }}>{tag.label}</span>}
          {live && <div className="flex items-center gap-1"><Radio size={7} className="text-[#00B4FF]" /><span className="text-[#00B4FF] text-[8px] font-black">LIVE</span></div>}
        </div>
      )}

      {/* ── Info ── */}
      <div className="p-2.5">
        <p className="text-white font-black text-[13px] leading-tight line-clamp-1 mb-1">{salon.name}</p>
        {salon.address && (
          <div className="flex items-center gap-1 mb-1.5">
            <MapPin size={8} className="text-gray-600 flex-shrink-0" />
            <span className="text-gray-500 text-[9px] truncate">{salon.address}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          {free > 0 ? (
            <div className="flex items-center gap-1 bg-[#00B4FF]/10 border border-[#00B4FF]/20 rounded-full px-1.5 py-0.5">
              <Users size={8} className="text-[#00B4FF]" />
              <span className="text-[#00B4FF] text-[9px] font-bold">{free} free</span>
            </div>
          ) : (
            <span className="text-gray-600 text-[9px]">Full</span>
          )}
          {salon.avg_service_price && (
            <span className="text-gray-500 text-[9px] ml-auto">{salon.avg_service_price} MAD</span>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Home Page ─────────────────────────────────────────────────────────────
export default function Home() {
  const [, setLocation] = useLocation();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const { user } = useAuth();

  const defaultCat: CatKey = user?.gender_pref === "men" ? "barber" : user?.gender_pref === "women" ? "nails" : "all";

  const [cat, setCat]     = useState<CatKey>(defaultCat);
  const [city, setCity]   = useState<CityKey>("all");
  const [query, setQuery] = useState("");
  const [salons, setSalons]         = useState<Salon[]>([]);
  const [offers, setOffers]         = useState<FlashOffer[]>([]);
  const [geoGranted, setGeoGranted] = useState(false);
  const [userLoc, setUserLoc]       = useState<{lat:number;lng:number}|null>(null);
  const [banner, setBanner]             = useState<BannerData|null>(null);
  const [bannerVisible, setBannerV]     = useState(false);
  const [availBanner, setAvailBanner]   = useState<AvailBanner|null>(null);
  const [availVisible, setAvailVisible] = useState(false);
  const [searchOpen, setSearchOpen]     = useState(false);
  const seenRef        = useRef<Set<number>>(new Set());
  const prevRef        = useRef<Set<number>>(new Set());
  const prevChairsRef  = useRef<Map<number, number>>(new Map());  // salonId → free_chairs
  const seenAvailRef   = useRef<Set<number>>(new Set());          // salonIds already notified
  const availQueueRef  = useRef<AvailBanner[]>([]);               // pending notifications

  // ── Derived data ──────────────────────────────────────────────────────
  const visible = useMemo(() => {
    const byCat  = salons.filter(s => matchesCategory(s, cat));
    const byCity = byCat.filter(s => matchesCity(s, city));
    const byQ    = byCity.filter(s => matchesSearch(s, query));
    return [...byQ].sort((a, b) => {
      const sa = (a.is_live ? 2 : 0) + (Number(a.free_chairs) > 0 ? 1 : 0);
      const sb = (b.is_live ? 2 : 0) + (Number(b.free_chairs) > 0 ? 1 : 0);
      return sb - sa;
    });
  }, [salons, cat, city, query]);

  const liveSalons = useMemo(() => salons.filter(s => s.is_live && Number(s.free_chairs) > 0).length, [salons]);
  const freeCount  = useMemo(() => salons.filter(s => Number(s.free_chairs) > 0).length, [salons]);
  const activeDeals = offers.filter(o => o.is_active).length;

  // ── Smart suggestion: nearest open salon when all visible are full ─────
  const suggestedSalon = useMemo(() => {
    const anyOpen = visible.some(s => Number(s.free_chairs) > 0 && s.is_live);
    if (anyOpen || !salons.length) return null; // already have an open option in view
    const loc = userLoc ?? { lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] };
    return salons
      .filter(s => Number(s.free_chairs) > 0 && s.is_live && s.lat && s.lng)
      .map(s => ({ ...s, _dist: haversine(loc.lat, loc.lng, Number(s.lat), Number(s.lng)) }))
      .sort((a, b) => a._dist - b._dist)[0] ?? null;
  }, [visible, salons, userLoc]);

  // ── Load salons ───────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/salons").then(r => r.json()).then(setSalons).catch(() => {});
  }, []);

  // ── Flash offers ──────────────────────────────────────────────────────
  const checkOffers = useCallback(async () => {
    try {
      const data: FlashOffer[] = await fetch("/api/flash-offers/active").then(r => r.json());
      if (!Array.isArray(data)) return;
      setOffers(data);
      const ids = new Set(data.map(o => o.id));
      const newOnes = data.filter(o => !prevRef.current.has(o.id) && !seenRef.current.has(o.id));
      prevRef.current = ids;
      if (!newOnes.length || banner) return;
      const loc = userLoc ?? { lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] };
      let chosen: BannerData | null = null;
      for (const o of newOnes) {
        if (!o.lat || !o.lng) continue;
        const d = haversine(loc.lat, loc.lng, Number(o.lat), Number(o.lng));
        if (d <= 50 && (!chosen || d < chosen.distKm)) chosen = { ...o, distKm: d };
      }
      if (chosen) {
        seenRef.current.add(chosen.id);
        setBanner(chosen);
        setTimeout(() => setBannerV(true), 50);
      }
    } catch { /* silent */ }
  }, [userLoc, banner]);

  useEffect(() => {
    checkOffers();
    const id = setInterval(checkOffers, POLL_MS);
    return () => clearInterval(id);
  }, [checkOffers]);

  const dismissBanner = useCallback(() => {
    setBannerV(false);
    setTimeout(() => setBanner(null), 400);
  }, []);

  // ── Availability polling ───────────────────────────────────────────────
  const showNextAvail = useCallback((queue: AvailBanner[]) => {
    if (!queue.length) return;
    const next = queue[0];
    availQueueRef.current = queue.slice(1);
    setAvailBanner(next);
    setTimeout(() => setAvailVisible(true), 50);
  }, []);

  const checkAvailability = useCallback(async () => {
    try {
      const data: Salon[] = await fetch("/api/salons").then(r => r.json());
      if (!Array.isArray(data)) return;
      setSalons(data);

      const loc = userLoc ?? { lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] };
      const newNotifs: AvailBanner[] = [];

      for (const s of data) {
        const prev = prevChairsRef.current.get(s.id) ?? 0;
        const curr = Number(s.free_chairs);
        // Transitioned from 0 → >0 and not already notified this session
        if (prev === 0 && curr > 0 && !seenAvailRef.current.has(s.id) && s.lat && s.lng) {
          const d = haversine(loc.lat, loc.lng, Number(s.lat), Number(s.lng));
          if (d <= 60) {
            seenAvailRef.current.add(s.id);
            newNotifs.push({ salonId: s.id, salonName: s.name, freeChairs: curr, distKm: d, lat: Number(s.lat), lng: Number(s.lng) });
          }
        }
        prevChairsRef.current.set(s.id, curr);
      }

      // Reset seen set when a salon goes back to 0 (so next opening triggers again)
      for (const s of data) {
        if (Number(s.free_chairs) === 0) seenAvailRef.current.delete(s.id);
      }

      if (newNotifs.length > 0) {
        // Sort by distance — closest first
        newNotifs.sort((a, b) => a.distKm - b.distKm);
        if (!availBanner) {
          showNextAvail(newNotifs);
        } else {
          availQueueRef.current = [...availQueueRef.current, ...newNotifs];
        }
      }
    } catch { /* silent */ }
  }, [userLoc, availBanner, showNextAvail]);

  useEffect(() => {
    const id = setInterval(checkAvailability, AVAIL_POLL_MS);
    return () => clearInterval(id);
  }, [checkAvailability]);

  const dismissAvailBanner = useCallback(() => {
    setAvailVisible(false);
    setTimeout(() => {
      setAvailBanner(null);
      // Show next in queue after a short gap
      if (availQueueRef.current.length > 0) {
        setTimeout(() => showNextAvail(availQueueRef.current), 500);
      }
    }, 400);
  }, [showNextAvail]);

  // ── City → pan map ────────────────────────────────────────────────────
  useEffect(() => {
    const wm = (window as any).__wassemMap;
    if (!wm) return;
    const c = CITIES.find(c => c.key === city);
    if (c) wm.map.setView([c.lat, c.lng], c.zoom, { animate: true });
  }, [city]);

  // ── Render markers ────────────────────────────────────────────────────
  const renderMarkers = useCallback((L: any, map: any, salonList: Salon[], offerList: FlashOffer[], activeCat: CatKey, activeCity: CityKey, activeQuery: string) => {
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const filtered = salonList
      .filter(s => matchesCategory(s, activeCat))
      .filter(s => matchesCity(s, activeCity))
      .filter(s => matchesSearch(s, activeQuery));

    filtered.forEach(salon => {
      if (!salon.lat || !salon.lng) return;
      const free = Number(salon.free_chairs);
      const activeOffer = offerList.find(o => o.salon_id === salon.id && o.is_active);
      const live = salon.is_live && free > 0;
      const glowColor = activeOffer ? "rgba(255,221,0,0.5)" : live ? "rgba(0,193,255,0.6)" : free > 0 ? "rgba(74,222,128,0.4)" : "rgba(100,100,100,0.2)";
      const borderColor = activeOffer ? "#FFDD00" : live ? "#00B4FF" : free > 0 ? "#4ade80" : "#444";

      const countdown = fmtCountdown(salon.next_expiry);
      const activeClaims = Number(salon.active_claims ?? 0);

      const badge = activeOffer
        ? `<div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#FFDD00;color:#000;font-weight:900;font-size:9px;padding:2px 5px;border-radius:10px;white-space:nowrap;box-shadow:0 0 8px rgba(255,221,0,0.8)">⚡ -${activeOffer.discount_pct}%</div>`
        : live
        ? `<div style="position:absolute;top:-14px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#00B4FF,#00ff88);color:#000;font-weight:900;font-size:8px;padding:2px 6px;border-radius:10px;white-space:nowrap;box-shadow:0 0 10px rgba(0,193,255,0.8)">● LIVE · ${free}</div>`
        : free > 0
        ? `<div style="position:absolute;top:-8px;right:-4px;background:#4ade80;color:#000;font-weight:900;font-size:9px;padding:1px 4px;border-radius:10px">${free}</div>`
        : "";

      // Countdown badge — sits below the marker when chairs are claimed
      const timerBadge = (activeClaims > 0 && countdown)
        ? `<div style="position:absolute;bottom:-18px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:2px;background:${countdown.mins <= 5 ? "#f97316" : countdown.mins <= 10 ? "#eab308" : "#6b7280"};color:#000;font-weight:900;font-size:8px;padding:2px 5px;border-radius:8px;white-space:nowrap;box-shadow:0 0 8px ${countdown.mins <= 5 ? "rgba(249,115,22,0.7)" : countdown.mins <= 10 ? "rgba(234,179,8,0.5)" : "rgba(0,0,0,0.3)"}">⏱ ${countdown.label}</div>`
        : "";

      const iconSize: [number, number] = timerBadge ? [48, 72] : [48, 48];
      const icon = L.divIcon({
        html: `<div style="position:relative;width:48px;height:${timerBadge ? 72 : 48}px">
          ${free > 0 || activeOffer ? `<div style="position:absolute;top:0;left:0;width:48px;height:48px;background:${glowColor};border-radius:50%;animation:ping 1.5s ease-out infinite;pointer-events:none"></div>` : ""}
          <div style="width:48px;height:48px;background:#0D0D0D;border:2.5px solid ${borderColor};border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 16px ${glowColor};position:relative">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="${borderColor}"><path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3z"/></svg>
            ${salon.is_verified ? `<div style="position:absolute;bottom:-2px;right:-2px;width:14px;height:14px;background:#00B4FF;border-radius:50%;border:2px solid #0A0A0A;font-size:8px;display:flex;align-items:center;justify-content:center">✓</div>` : ""}
          </div>${badge}${timerBadge}
        </div>`,
        className: "", iconSize, iconAnchor: [24, 24],
      });

      markersRef.current.push(
        L.marker([salon.lat, salon.lng], { icon })
          .addTo(map)
          .on("click", () => setLocation(`/salon/${salon.id}`))
      );
    });
  }, [setLocation]);

  // Re-render markers whenever filters change
  useEffect(() => {
    const wm = (window as any).__wassemMap;
    if (wm) renderMarkers(wm.L, wm.map, salons, offers, cat, city, query);
  }, [salons, offers, cat, city, query, renderMarkers]);

  // 30-second countdown tick — keeps ⏱ badges accurate without a full poll
  useEffect(() => {
    const id = setInterval(() => {
      const wm = (window as any).__wassemMap;
      if (wm) renderMarkers(wm.L, wm.map, salons, offers, cat, city, query);
    }, 30_000);
    return () => clearInterval(id);
  }, [salons, offers, cat, city, query, renderMarkers]);

  // ── Leaflet init ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    import("leaflet").then(leaflet => {
      const L = leaflet.default;
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      const map = L.map(mapRef.current!, { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, zoomControl: false, attributionControl: false });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);
      mapInstanceRef.current = map;
      (window as any).__wassemMap = { L, map };

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(pos => {
          const { latitude: lat, longitude: lng } = pos.coords;
          setGeoGranted(true);
          setUserLoc({ lat, lng });
          map.setView([lat, lng], 14);
          const icon = L.divIcon({
            html: `<div style="width:40px;height:40px;background:linear-gradient(135deg,#00B4FF,#FF1F8E);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(0,193,255,0.6);border:2px solid rgba(255,255,255,0.4)"><div style="width:12px;height:12px;background:white;border-radius:50%"></div></div>`,
            className: "", iconSize: [40, 40], iconAnchor: [20, 20],
          });
          L.marker([lat, lng], { icon }).addTo(map);
        }, () => {});
      }
    });
    return () => {
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; delete (window as any).__wassemMap; markersRef.current = []; }
    };
  }, []);

  // ── Role redirects ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    if (user.role === "professional") setLocation("/pro/requests");
    else if (user.role === "salon_owner") setLocation("/salon/dashboard");
  }, [user, setLocation]);
  if (user && user.role !== "client") return null;

  const activeCat = CATEGORIES.find(c => c.key === cat)!;
  const PANEL_H = 252;

  return (
    <div className="relative w-full bg-[#090013]" style={{ height: "100dvh" }}>

      {/* ── Map ── */}
      <div ref={mapRef} className="absolute inset-0 z-0" style={{ bottom: PANEL_H }} />

      {/* Top fade */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
        style={{ height: 140, background: "linear-gradient(to bottom,rgba(9,0,19,0.97) 0%,rgba(9,0,19,0) 100%)" }} />

      {/* ── Header ── */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-safe-top" style={{ paddingTop: "max(env(safe-area-inset-top,0px), 44px)" }}>

        {/* Logo + status row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00B4FF] to-[#FF1F8E] flex items-center justify-center shadow-[0_0_12px_rgba(0,193,255,0.5)] overflow-hidden">
              <img src="/tawoss-logo.png" alt="" className="w-6 h-6 object-contain" />
            </div>
            <span className="text-white font-black text-lg tracking-tight">TAWOSS</span>
          </div>
          <div className="flex items-center gap-1.5">
            {activeDeals > 0 && (
              <div className="flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/40 rounded-full px-2 py-1">
                <Zap size={10} className="text-yellow-400" />
                <span className="text-yellow-400 text-[10px] font-bold">{activeDeals}</span>
              </div>
            )}
            {liveSalons > 0 && (
              <div className="flex items-center gap-1 bg-[#00B4FF]/15 border border-[#00B4FF]/40 rounded-full px-2 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00B4FF] animate-pulse" />
                <span className="text-[#00B4FF] text-[10px] font-bold">{liveSalons} live</span>
              </div>
            )}
            <div className="bg-black/60 backdrop-blur border border-white/10 rounded-full px-2 py-1 flex items-center gap-1">
              <Navigation size={9} className={geoGranted ? "text-[#00B4FF]" : "text-gray-600"} />
              <span className="text-gray-400 text-[10px] font-bold">{geoGranted ? "Near you" : "Morocco"}</span>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className={`flex items-center gap-2 mb-2 transition-all duration-200 ${searchOpen ? "opacity-100" : "opacity-100"}`}>
          <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <Search size={13} className="text-gray-500 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search salons…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-white text-sm placeholder:text-gray-600 outline-none min-w-0"
            />
            {query && (
              <button onClick={() => setQuery("")} className="flex-shrink-0">
                <X size={13} className="text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* City + Category pills — single scrollable row */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {/* City pills */}
          {CITIES.map(c => {
            const on = city === c.key;
            return (
              <button key={c.key} onClick={() => setCity(c.key)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-black transition-all"
                style={{
                  background: on ? "rgba(155,48,255,0.25)" : "rgba(255,255,255,0.05)",
                  border: `1.5px solid ${on ? "#9B30FF" : "rgba(255,255,255,0.1)"}`,
                  color: on ? "#c084fc" : "#555",
                  boxShadow: on ? "0 0 10px rgba(155,48,255,0.3)" : "none",
                }}>
                {c.key === "oujda" ? "🌆 " : c.key === "berkane" ? "🏘️ " : ""}{c.label}
              </button>
            );
          })}
          {/* Divider */}
          <div className="flex-shrink-0 w-px bg-white/10 my-1" />
          {/* Category pills */}
          {CATEGORIES.map(c => {
            const on = cat === c.key;
            return (
              <button key={c.key} onClick={() => setCat(c.key)}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all"
                style={{
                  background: on ? `${c.color}22` : "rgba(255,255,255,0.05)",
                  borderColor: on ? c.color : "rgba(255,255,255,0.1)",
                  color: on ? c.color : "#555",
                  boxShadow: on ? `0 0 8px ${c.color}40` : "none",
                }}>
                <span>{c.emoji}</span>
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Flash Banner (above panel) ── */}
      {banner && (
        <div className="absolute left-3 right-3 z-30 transition-all duration-500 ease-out"
          style={{
            bottom: bannerVisible ? PANEL_H + 8 : PANEL_H - 40,
            opacity: bannerVisible ? 1 : 0,
            transform: bannerVisible ? "scale(1)" : "scale(0.96)",
          }}>
          <FlashBanner offer={banner} onDismiss={dismissBanner}
            onView={() => { dismissBanner(); setLocation(`/salon/${banner.salon_id}`); }} />
        </div>
      )}

      {/* ── Availability Banner (stacks above flash banner if both active) ── */}
      {availBanner && (
        <div className="absolute left-3 right-3 z-31 transition-all duration-500 ease-out"
          style={{
            bottom: availVisible
              ? (banner && bannerVisible ? PANEL_H + 8 + 160 : PANEL_H + 8)
              : PANEL_H - 40,
            opacity: availVisible ? 1 : 0,
            transform: availVisible ? "scale(1)" : "scale(0.96)",
            zIndex: 31,
          }}>
          <AvailabilityBanner
            avail={availBanner}
            onDismiss={dismissAvailBanner}
            onBook={() => { dismissAvailBanner(); setLocation(`/salon/${availBanner.salonId}`); }}
          />
        </div>
      )}

      {/* ── Bottom Panel ── */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-[#090013] border-t border-white/5"
        style={{ height: PANEL_H, paddingBottom: "env(safe-area-inset-bottom,0px)" }}>

        {/* Salon count + cards strip */}
        <div className="px-4 pt-3">
          {/* Count row */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold" style={{ color: activeCat.color }}>
              {activeCat.emoji} {visible.length} salon{visible.length !== 1 ? "s" : ""}
              {city !== "all" ? ` · ${CITIES.find(c => c.key === city)!.label}` : ""}
              {query ? ` · "${query}"` : ""}
            </span>
            {freeCount > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-[10px] font-bold">{freeCount} open</span>
              </div>
            )}
          </div>

          {/* Cards */}
          {visible.length === 0 ? (
            <div className="h-16 flex items-center justify-center rounded-xl border border-white/5"
              style={{ background: "rgba(255,255,255,0.02)" }}>
              <p className="text-gray-600 text-xs">
                {query ? `No salons matching "${query}"` : `No ${cat !== "all" ? cat : ""} salons here yet`}
              </p>
            </div>
          ) : (
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
              {/* Smart suggestion — pinned first when all visible salons are full */}
              {suggestedSalon && (
                <SalonCard
                  key={`suggest-${suggestedSalon.id}`}
                  salon={suggestedSalon}
                  onPress={() => setLocation(`/salon/${suggestedSalon.id}`)}
                  tag={{ label: "⭐ Nearest Open", color: "#facc15" }}
                />
              )}
              {visible.map(s => <SalonCard key={s.id} salon={s} onPress={() => setLocation(`/salon/${s.id}`)} />)}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="px-4 mt-2">
          {user?.role === "salon_owner" ? (
            <button onClick={() => setLocation("/salon/dashboard")}
              className="w-full bg-gradient-to-r from-[#00B4FF] to-[#FF1F8E] active:scale-[0.97] text-black font-black text-base rounded-2xl py-3 transition-all">
              🏠 Manage My Salon
            </button>
          ) : user?.role === "professional" ? (
            <button onClick={() => setLocation("/pro/requests")}
              className="w-full bg-[#FF1F8E] active:scale-[0.97] text-black font-black text-base rounded-2xl py-3 transition-all">
              ✂️ See Nearby Requests
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setLocation("/request")}
                className="flex-1 active:scale-[0.97] text-black font-black text-base rounded-2xl py-3 transition-all flex items-center justify-center gap-1.5"
                style={{
                  background: activeCat.color === "#FF1F8E" ? "#FF1F8E" : "#00B4FF",
                  boxShadow: activeCat.color === "#FF1F8E" ? "0 0 18px rgba(255,31,142,0.4)" : "0 0 18px rgba(0,193,255,0.4)",
                }}>
                <Scissors size={15} />
                {cat === "barber" ? "Book Barber" : cat === "nails" ? "Book Nails" : cat === "hair" ? "Book Hair" : "Book Service"}
              </button>
              <button onClick={() => setLocation("/request-multi")}
                className="px-4 active:scale-[0.97] rounded-2xl border border-white/10 text-gray-400 font-bold text-sm"
                style={{ background: "rgba(255,255,255,0.04)" }}>
                Multi
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
