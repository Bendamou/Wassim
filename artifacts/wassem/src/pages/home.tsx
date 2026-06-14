import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Scissors, Navigation, Zap, X, MapPin, Star, Users, Radio, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import "leaflet/dist/leaflet.css";

// ── City definitions ──────────────────────────────────────────────────────────
const CITIES = [
  { key: "all",     label: "All Cities", lat: 34.80, lng: -2.11, zoom: 9 },
  { key: "oujda",   label: "🌆 Oujda",  lat: 34.6814, lng: -1.9086, zoom: 13 },
  { key: "berkane", label: "🏘️ Berkane", lat: 34.9200, lng: -2.3200, zoom: 13 },
] as const;
type CityKey = (typeof CITIES)[number]["key"];

const DEFAULT_CENTER: [number, number] = [34.6814, -1.9086]; // Oujda
const DEFAULT_ZOOM = 12;
const POLL_INTERVAL_MS = 20_000;
const BANNER_TTL_MS = 8_000;

// ── Haversine distance in km ───────────────────────────────────────────────
function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDist(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

// ── Types ──────────────────────────────────────────────────────────────────
type Salon = {
  id: number; name: string; address: string; lat: number; lng: number;
  free_chairs: number; total_chairs: number; header_image: string;
  categories: string; is_verified: boolean; is_live: boolean;
  avg_service_price?: number; owner_name?: string;
};

type FlashOffer = {
  id: number; salon_id: number; title: string; discount_pct: number;
  is_active: boolean; salon_name?: string; lat?: number; lng?: number;
};

type BannerData = FlashOffer & { distKm: number };

const CATEGORIES = [
  { key: "all",      label: "All",      emoji: "🔍", gender: "all",   color: "#a855f7" },
  { key: "barber",   label: "Barber",   emoji: "💈", gender: "men",   color: "#00B4FF" },
  { key: "hair",     label: "Hair",     emoji: "✂️", gender: "men",   color: "#00B4FF" },
  { key: "nails",    label: "Nails",    emoji: "💅", gender: "women", color: "#FF1F8E" },
  { key: "skincare", label: "Skincare", emoji: "🧴", gender: "women", color: "#FF1F8E" },
  { key: "massage",  label: "Massage",  emoji: "💆", gender: "women", color: "#FF1F8E" },
  { key: "spa",      label: "Spa",      emoji: "🧖", gender: "women", color: "#FF1F8E" },
] as const;
type CatKey = (typeof CATEGORIES)[number]["key"];

// ── Flash Offer Banner ─────────────────────────────────────────────────────
function FlashBanner({
  offer, onDismiss, onView,
}: { offer: BannerData; onDismiss: () => void; onView: () => void }) {
  const [progress, setProgress] = useState(100);
  const startRef = useRef(Date.now());
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.max(0, 100 - (elapsed / BANNER_TTL_MS) * 100);
      setProgress(pct);
      if (pct > 0) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    const timer = setTimeout(onDismiss, BANNER_TTL_MS);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearTimeout(timer);
    };
  }, [onDismiss]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-yellow-400/50 shadow-[0_0_40px_rgba(255,221,0,0.25)]"
      style={{ background: "linear-gradient(135deg,#1a1500,#0f0c00)" }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%,rgba(255,221,0,0.12),transparent 70%)" }} />
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
              <p className="text-yellow-300 text-[10px] font-black uppercase tracking-widest leading-none">⚡ Flash Offer Nearby</p>
              <p className="text-white font-black text-base leading-tight mt-0.5">{offer.salon_name ?? `Salon #${offer.salon_id}`}</p>
            </div>
          </div>
          <button onClick={onDismiss} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <X size={14} className="text-gray-400" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-3 gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-yellow-400 text-black font-black text-sm px-2.5 py-1 rounded-lg shadow-[0_0_10px_rgba(255,221,0,0.5)]">
              -{offer.discount_pct}%
            </div>
            <p className="text-gray-300 text-sm font-bold">{offer.title}</p>
          </div>
          <div className="flex items-center gap-1 bg-white/8 border border-white/10 rounded-full px-2.5 py-1 flex-shrink-0">
            <MapPin size={10} className="text-yellow-400" />
            <span className="text-yellow-300 text-[10px] font-bold">{formatDist(offer.distKm)}</span>
          </div>
        </div>
        <button onClick={onView} className="w-full mt-3 bg-yellow-400 active:scale-[0.97] text-black font-black text-sm rounded-xl py-2.5 transition-transform shadow-[0_0_16px_rgba(255,221,0,0.4)]">
          View Deal →
        </button>
      </div>
      <div className="h-1 bg-white/5">
        <div className="h-full bg-yellow-400 transition-none" style={{ width: `${progress}%`, boxShadow: "0 0 6px rgba(255,221,0,0.7)" }} />
      </div>
    </div>
  );
}

// ── Salon Card (bottom strip) ──────────────────────────────────────────────
function SalonCard({ salon, onPress }: { salon: Salon; onPress: () => void }) {
  const free = Number(salon.free_chairs);
  return (
    <button
      onClick={onPress}
      className="flex-shrink-0 w-52 rounded-2xl overflow-hidden border transition-all active:scale-[0.97] text-left"
      style={{ background: "#130028", borderColor: salon.is_live && free > 0 ? "rgba(0,180,255,0.4)" : "rgba(255,255,255,0.07)" }}
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            {salon.is_live && free > 0 && (
              <div className="inline-flex items-center gap-1 mb-1 bg-[#00B4FF]/15 border border-[#00B4FF]/30 rounded-full px-1.5 py-0.5">
                <Radio size={8} className="text-[#00B4FF]" />
                <span className="text-[#00B4FF] text-[9px] font-bold">LIVE</span>
              </div>
            )}
            <p className="text-white font-black text-sm leading-tight line-clamp-1">{salon.name}</p>
          </div>
          <ChevronRight size={14} className="text-gray-600 flex-shrink-0 mt-0.5" />
        </div>
        {salon.address && (
          <div className="flex items-center gap-1 mb-2">
            <MapPin size={9} className="text-gray-600 flex-shrink-0" />
            <span className="text-gray-500 text-[10px] truncate">{salon.address}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          {free > 0 ? (
            <div className="flex items-center gap-1 bg-[#00B4FF]/10 border border-[#00B4FF]/20 rounded-full px-1.5 py-0.5">
              <Users size={9} className="text-[#00B4FF]" />
              <span className="text-[#00B4FF] text-[9px] font-bold">{free} free</span>
            </div>
          ) : (
            <span className="text-gray-600 text-[10px]">No spots</span>
          )}
          {salon.avg_service_price && (
            <span className="text-gray-500 text-[10px] ml-auto">{salon.avg_service_price} MAD</span>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Home Page ──────────────────────────────────────────────────────────────
export default function Home() {
  const [, setLocation] = useLocation();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const { user } = useAuth();

  const defaultCat: CatKey =
    user?.gender_pref === "men" ? "barber"
    : user?.gender_pref === "women" ? "nails"
    : "all";

  const [activeCategory, setActiveCategory] = useState<CatKey>(defaultCat);
  const [activeCity, setActiveCity] = useState<CityKey>("all");
  const [salons, setSalons] = useState<Salon[]>([]);
  const [flashOffers, setFlashOffers] = useState<FlashOffer[]>([]);
  const [geoGranted, setGeoGranted] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [freeSalons, setFreeSalons] = useState(0);
  const [liveSalons, setLiveSalons] = useState(0);

  // Banner state
  const [bannerOffer, setBannerOffer] = useState<BannerData | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);
  const seenOfferIdsRef = useRef<Set<number>>(new Set());
  const prevOfferIdsRef = useRef<Set<number>>(new Set());

  // Load salons once
  useEffect(() => {
    fetch("/api/salons").then(r => r.json()).then((data: Salon[]) => {
      setSalons(data);
      setFreeSalons(data.filter(s => Number(s.free_chairs) > 0).length);
      setLiveSalons(data.filter(s => s.is_live && Number(s.free_chairs) > 0).length);
    }).catch(() => {});
  }, []);

  // Fetch flash offers and detect NEW ones within 2 km
  const fetchAndCheckOffers = useCallback(async () => {
    try {
      const offers: FlashOffer[] = await fetch("/api/flash-offers/active").then(r => r.json());
      if (!Array.isArray(offers)) return;
      setFlashOffers(offers);

      const currentIds = new Set(offers.map(o => o.id));
      const newOffers = offers.filter(
        o => !prevOfferIdsRef.current.has(o.id) && !seenOfferIdsRef.current.has(o.id)
      );
      prevOfferIdsRef.current = currentIds;

      if (newOffers.length === 0 || bannerOffer) return;

      let chosen: BannerData | null = null;
      const loc = userLocation ?? { lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] };
      for (const offer of newOffers) {
        if (!offer.lat || !offer.lng) continue;
        const distKm = haversine(loc.lat, loc.lng, Number(offer.lat), Number(offer.lng));
        if (distKm <= 50 && (!chosen || distKm < chosen.distKm)) {
          chosen = { ...offer, distKm };
        }
      }

      if (chosen) {
        seenOfferIdsRef.current.add(chosen.id);
        setBannerOffer(chosen);
        setTimeout(() => setBannerVisible(true), 50);
      }
    } catch { /* silent */ }
  }, [userLocation, bannerOffer]);

  useEffect(() => {
    fetchAndCheckOffers();
    const id = setInterval(fetchAndCheckOffers, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchAndCheckOffers]);

  const dismissBanner = useCallback(() => {
    setBannerVisible(false);
    setTimeout(() => setBannerOffer(null), 400);
  }, []);

  // ── City filter → pan map ─────────────────────────────────────────────────
  useEffect(() => {
    const wm = (window as any).__wassemMap;
    if (!wm) return;
    const city = CITIES.find(c => c.key === activeCity);
    if (city) wm.map.setView([city.lat, city.lng], city.zoom, { animate: true });
  }, [activeCity]);

  // ── Map markers ───────────────────────────────────────────────────────────
  const renderMarkers = useCallback((L: any, map: any, salonList: Salon[], offers: FlashOffer[], cat: CatKey) => {
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const visible = cat === "all" ? salonList : salonList.filter(s => s.categories?.split(",").includes(cat));
    const catDef = CATEGORIES.find(c => c.key === cat);

    visible.forEach(salon => {
      if (!salon.lat || !salon.lng) return;
      const free = Number(salon.free_chairs);
      const hasFree = free > 0;
      const activeOffer = offers.find(o => o.salon_id === salon.id && o.is_active);
      const isLiveShop = salon.is_live && hasFree;
      const markerColor = catDef?.gender === "women" ? "#FF1F8E" : "#00B4FF";
      const glowColor = activeOffer ? "rgba(255,221,0,0.5)" : isLiveShop ? "rgba(0,193,255,0.6)" : hasFree ? "rgba(74,222,128,0.4)" : `${markerColor}33`;
      const borderColor = activeOffer ? "#FFDD00" : isLiveShop ? "#00B4FF" : hasFree ? "#4ade80" : markerColor;

      const badge = activeOffer
        ? `<div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#FFDD00;color:#000;font-weight:900;font-size:9px;padding:2px 5px;border-radius:10px;white-space:nowrap;box-shadow:0 0 8px rgba(255,221,0,0.8)">⚡ -${activeOffer.discount_pct}%</div>`
        : isLiveShop
        ? `<div style="position:absolute;top:-14px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#00B4FF,#00ff88);color:#000;font-weight:900;font-size:8px;padding:2px 6px;border-radius:10px;white-space:nowrap;box-shadow:0 0 10px rgba(0,193,255,0.8)">● LIVE · ${free}</div>`
        : hasFree
        ? `<div style="position:absolute;top:-8px;right:-4px;background:#4ade80;color:#000;font-weight:900;font-size:9px;padding:1px 4px;border-radius:10px">${free}</div>`
        : "";

      const icon = L.divIcon({
        html: `<div style="position:relative;width:48px;height:48px">
          ${hasFree || activeOffer ? `<div style="position:absolute;inset:0;background:${glowColor};border-radius:50%;animation:ping 1.5s ease-out infinite;pointer-events:none"></div>` : ""}
          <div style="width:48px;height:48px;background:#0D0D0D;border:2.5px solid ${borderColor};border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 16px ${glowColor};position:relative">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="${borderColor}"><path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3z"/></svg>
            ${salon.is_verified ? `<div style="position:absolute;bottom:-2px;right:-2px;width:14px;height:14px;background:#00B4FF;border-radius:50%;border:2px solid #0A0A0A;display:flex;align-items:center;justify-content:center;font-size:8px">✓</div>` : ""}
          </div>
          ${badge}
        </div>`,
        className: "", iconSize: [48, 48], iconAnchor: [24, 24],
      });

      const marker = L.marker([salon.lat, salon.lng], { icon })
        .addTo(map)
        .on("click", () => setLocation(`/salon/${salon.id}`));
      markersRef.current.push(marker);
    });
  }, [setLocation]);

  // ── Leaflet init ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    let map: any;

    import("leaflet").then(leaflet => {
      const L = leaflet.default;
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      map = L.map(mapRef.current!, {
        center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, zoomControl: false, attributionControl: false,
      });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);
      mapInstanceRef.current = map;
      (window as any).__wassemMap = { L, map };

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(pos => {
          const { latitude: lat, longitude: lng } = pos.coords;
          setGeoGranted(true);
          setUserLocation({ lat, lng });
          map.setView([lat, lng], 14);
          const userIcon = L.divIcon({
            html: `<div style="width:40px;height:40px;background:linear-gradient(135deg,#00B4FF,#FF1F8E);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(0,193,255,0.6);border:2px solid rgba(255,255,255,0.4)"><div style="width:12px;height:12px;background:white;border-radius:50%"></div></div>`,
            className: "", iconSize: [40, 40], iconAnchor: [20, 20],
          });
          L.marker([lat, lng], { icon: userIcon }).addTo(map);
        }, () => {});
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        delete (window as any).__wassemMap;
        markersRef.current = [];
      }
    };
  }, []);

  // Re-render markers on category / salon / offer changes
  useEffect(() => {
    const wm = (window as any).__wassemMap;
    if (wm && salons.length > 0) {
      renderMarkers(wm.L, wm.map, salons, flashOffers, activeCategory);
    }
  }, [salons, flashOffers, activeCategory, renderMarkers]);

  const isPro = user?.role === "professional";
  const isSalonOwner = user?.role === "salon_owner";

  useEffect(() => {
    if (!user) return;
    if (user.role === "professional") setLocation("/pro/requests");
    else if (user.role === "salon_owner") setLocation("/salon/dashboard");
  }, [user, setLocation]);

  if (user && user.role !== "client") return null;

  const activeCatDef = CATEGORIES.find(c => c.key === activeCategory);

  // Filter by category first, then by city
  const byCat = activeCategory === "all" ? salons : salons.filter(s => s.categories?.split(",").includes(activeCategory));
  const visibleSalons = activeCity === "all"
    ? byCat
    : byCat.filter(s => {
        const addr = (s.address ?? "").toLowerCase();
        return addr.includes(activeCity);
      });

  const activeFlashCount = flashOffers.filter(o => o.is_active).length;

  // Sort: live + free first, then others
  const sortedVisible = [...visibleSalons].sort((a, b) => {
    const aScore = (a.is_live ? 2 : 0) + (Number(a.free_chairs) > 0 ? 1 : 0);
    const bScore = (b.is_live ? 2 : 0) + (Number(b.free_chairs) > 0 ? 1 : 0);
    return bScore - aScore;
  });

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#090013]">
      {/* Map */}
      <div ref={mapRef} className="absolute inset-0 z-0" style={{ bottom: "260px" }} />

      {/* Top gradient */}
      <div className="absolute top-0 left-0 right-0 h-36 bg-gradient-to-b from-[#0A0A0A]/95 to-transparent z-10 pointer-events-none" />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-12">
        {/* Logo row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00B4FF] to-[#FF1F8E] flex items-center justify-center shadow-[0_0_15px_rgba(0,193,255,0.5)] overflow-hidden">
              <img src="/tawoss-logo.png" alt="Tawoss" className="w-7 h-7 object-contain" />
            </div>
            <span className="text-white font-black text-xl">TAWOSS</span>
          </div>
          <div className="flex items-center gap-2">
            {activeFlashCount > 0 && (
              <div className="flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/40 rounded-full px-2.5 py-1">
                <Zap size={11} className="text-yellow-400" />
                <span className="text-yellow-400 text-[10px] font-bold">{activeFlashCount} deals</span>
              </div>
            )}
            {liveSalons > 0 && (
              <div className="flex items-center gap-1 bg-[#00B4FF]/15 border border-[#00B4FF]/40 rounded-full px-2.5 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00B4FF] animate-pulse" />
                <span className="text-[#00B4FF] text-[10px] font-bold">{liveSalons} live</span>
              </div>
            )}
            <div className="bg-black/60 backdrop-blur border border-white/10 rounded-full px-2.5 py-1 flex items-center gap-1">
              <Navigation size={10} className={geoGranted ? "text-[#00B4FF]" : "text-gray-600"} />
              <span className="text-gray-400 text-[10px] font-bold">{geoGranted ? "Near you" : "Morocco"}</span>
            </div>
          </div>
        </div>

        {/* City filter pills */}
        <div className="flex gap-2 mb-2.5">
          {CITIES.map(city => {
            const isActive = activeCity === city.key;
            return (
              <button
                key={city.key}
                onClick={() => setActiveCity(city.key)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-black transition-all"
                style={{
                  background: isActive ? "rgba(155,48,255,0.25)" : "rgba(255,255,255,0.05)",
                  border: `1.5px solid ${isActive ? "#9B30FF" : "rgba(255,255,255,0.1)"}`,
                  color: isActive ? "#c084fc" : "#555",
                  boxShadow: isActive ? "0 0 12px rgba(155,48,255,0.35)" : "none",
                }}
              >
                {city.label}
              </button>
            );
          })}
        </div>

        {/* Category ribbon */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all"
                style={{
                  background: isActive ? `${cat.color}25` : "rgba(255,255,255,0.05)",
                  borderColor: isActive ? cat.color : "rgba(255,255,255,0.1)",
                  color: isActive ? cat.color : "#666",
                  boxShadow: isActive ? `0 0 10px ${cat.color}40` : "none",
                }}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Flash Offer Banner */}
      {bannerOffer && (
        <div
          className="absolute left-4 right-4 z-30 transition-all duration-500 ease-out"
          style={{
            bottom: bannerVisible ? "272px" : "200px",
            opacity: bannerVisible ? 1 : 0,
            transform: bannerVisible ? "translateY(0) scale(1)" : "translateY(40px) scale(0.95)",
          }}
        >
          <FlashBanner
            offer={bannerOffer}
            onDismiss={dismissBanner}
            onView={() => { dismissBanner(); setLocation(`/salon/${bannerOffer.salon_id}`); }}
          />
        </div>
      )}

      {/* ── Bottom Panel ─────────────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-[#090013] border-t border-white/5" style={{ height: "260px" }}>

        {/* Salon cards strip */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold" style={{ color: activeCatDef?.color ?? "#888" }}>
              {activeCatDef?.emoji} {sortedVisible.length} salon{sortedVisible.length !== 1 ? "s" : ""}
              {activeCity !== "all" ? ` in ${CITIES.find(c => c.key === activeCity)?.label.replace(/[^a-zA-Z ]/g, "").trim()}` : " nearby"}
            </span>
            {freeSalons > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-[10px] font-bold">{freeSalons} with free spots</span>
              </div>
            )}
          </div>

          {sortedVisible.length === 0 ? (
            <div className="flex items-center justify-center h-16 rounded-xl border border-white/5"
              style={{ background: "rgba(255,255,255,0.02)" }}>
              <p className="text-gray-600 text-sm">No salons found for this filter</p>
            </div>
          ) : (
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
              {sortedVisible.map(salon => (
                <SalonCard key={salon.id} salon={salon} onPress={() => setLocation(`/salon/${salon.id}`)} />
              ))}
            </div>
          )}
        </div>

        {/* CTA button */}
        <div className="px-4">
          {isSalonOwner ? (
            <button
              onClick={() => setLocation("/salon/dashboard")}
              className="w-full bg-gradient-to-r from-[#00B4FF] to-[#FF1F8E] active:scale-[0.97] text-black font-black text-base rounded-2xl py-3.5 transition-all shadow-[0_0_25px_rgba(0,193,255,0.4)] flex items-center justify-center gap-2"
            >
              🏠 Manage My Salon
            </button>
          ) : isPro ? (
            <button
              onClick={() => setLocation("/pro/requests")}
              className="w-full bg-[#FF1F8E] active:scale-[0.97] text-black font-black text-base rounded-2xl py-3.5 transition-all shadow-[0_0_25px_rgba(255,0,255,0.4)] flex items-center justify-center gap-2"
            >
              ✂️ See Nearby Requests
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setLocation("/request")}
                className="flex-1 active:scale-[0.97] text-black font-black text-base rounded-2xl py-3.5 transition-all flex items-center justify-center gap-2"
                style={{
                  background: activeCatDef?.gender === "women" ? "#FF1F8E" : "#00B4FF",
                  boxShadow: activeCatDef?.gender === "women" ? "0 0 20px rgba(255,0,255,0.4)" : "0 0 20px rgba(0,193,255,0.4)",
                }}
              >
                {activeCatDef?.gender === "women" ? "💅 Book Beauty" : "💈 Request Service"}
              </button>
              <button
                onClick={() => setLocation("/request-multi")}
                className="px-4 active:scale-[0.97] rounded-2xl border border-white/10 text-gray-400 font-bold text-sm transition-all"
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                Multi
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
