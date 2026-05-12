import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Scissors, Navigation, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth";
import "leaflet/dist/leaflet.css";

const CASABLANCA: [number, number] = [33.5731, -7.5898];

type Salon = {
  id: number; name: string; address: string; lat: number; lng: number;
  free_chairs: number; total_chairs: number; header_image: string;
  categories: string; is_verified: boolean;
};

type FlashOffer = { id: number; salon_id: number; title: string; discount_pct: number; is_active: boolean };

const CATEGORIES = [
  { key: "all",      label: "All",      emoji: "🔍", gender: "all",   color: "#a855f7" },
  { key: "barber",   label: "Barber",   emoji: "💈", gender: "men",   color: "#00C1FF" },
  { key: "hair",     label: "Hair",     emoji: "✂️", gender: "men",   color: "#00C1FF" },
  { key: "nails",    label: "Nails",    emoji: "💅", gender: "women", color: "#FF00FF" },
  { key: "skincare", label: "Skincare", emoji: "🧴", gender: "women", color: "#FF00FF" },
  { key: "massage",  label: "Massage",  emoji: "💆", gender: "women", color: "#FF00FF" },
  { key: "spa",      label: "Spa",      emoji: "🧖", gender: "women", color: "#FF00FF" },
] as const;

type CatKey = (typeof CATEGORIES)[number]["key"];

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
  const [salons, setSalons] = useState<Salon[]>([]);
  const [flashOffers, setFlashOffers] = useState<FlashOffer[]>([]);
  const [geoGranted, setGeoGranted] = useState(false);
  const [nearbyCount, setNearbyCount] = useState(0);
  const [freeSalons, setFreeSalons] = useState(0);

  // Load salons + flash offers
  useEffect(() => {
    fetch("/api/salons").then(r => r.json()).then((data: Salon[]) => {
      setSalons(data);
      setNearbyCount(data.length);
      setFreeSalons(data.filter(s => Number(s.free_chairs) > 0).length);
    }).catch(() => {});
    fetch("/api/flash-offers/active").then(r => r.json()).then((data: FlashOffer[]) => {
      setFlashOffers(Array.isArray(data) ? data : []);
    }).catch(() => {});
  }, []);

  const getActiveSalons = useCallback((cat: CatKey, salonList: Salon[]) => {
    if (cat === "all") return salonList;
    return salonList.filter(s => s.categories?.split(",").includes(cat));
  }, []);

  const renderMarkers = useCallback((L: any, map: any, salonList: Salon[], offers: FlashOffer[], cat: CatKey, navigate: (path: string) => void) => {
    // Remove existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const visible = getActiveSalons(cat, salonList);
    const catDef = CATEGORIES.find(c => c.key === cat);

    visible.forEach(salon => {
      if (!salon.lat || !salon.lng) return;
      const free = Number(salon.free_chairs);
      const hasFree = free > 0;
      const activeOffer = offers.find(o => o.salon_id === salon.id && o.is_active);
      const isVerified = salon.is_verified;
      const markerColor = catDef?.gender === "women" ? "#FF00FF" : "#00C1FF";

      const badge = activeOffer
        ? `<div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:#FFDD00;color:#000;font-weight:900;font-size:9px;padding:2px 5px;border-radius:10px;white-space:nowrap;box-shadow:0 0 8px rgba(255,221,0,0.8)">⚡ -${activeOffer.discount_pct}%</div>`
        : hasFree
        ? `<div style="position:absolute;top:-8px;right:-4px;background:#4ade80;color:#000;font-weight:900;font-size:9px;padding:1px 4px;border-radius:10px">${free}</div>`
        : "";

      const glowColor = activeOffer ? "rgba(255,221,0,0.5)"
        : hasFree ? "rgba(74,222,128,0.5)"
        : `${markerColor}33`;
      const borderColor = activeOffer ? "#FFDD00" : hasFree ? "#4ade80" : markerColor;

      const icon = L.divIcon({
        html: `<div style="position:relative;width:48px;height:48px">
          ${hasFree || activeOffer ? `<div style="position:absolute;inset:0;background:${glowColor};border-radius:50%;animation:ping 1.5s ease-out infinite;pointer-events:none"></div>` : ""}
          <div style="width:48px;height:48px;background:#0D0D0D;border:2.5px solid ${borderColor};border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 16px ${glowColor};position:relative">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="${borderColor}">
              <path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3z"/>
            </svg>
            ${isVerified ? `<div style="position:absolute;bottom:-2px;right:-2px;width:14px;height:14px;background:#00C1FF;border-radius:50%;border:2px solid #0A0A0A;display:flex;align-items:center;justify-content:center;font-size:8px">✓</div>` : ""}
          </div>
          ${badge}
        </div>`,
        className: "",
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });

      const marker = L.marker([salon.lat, salon.lng], { icon })
        .addTo(map)
        .on("click", () => navigate(`/salon/${salon.id}`));

      markersRef.current.push(marker);
    });
  }, [getActiveSalons]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    let map: any;

    import("leaflet").then(leaflet => {
      const L = leaflet.default;
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      map = L.map(mapRef.current!, {
        center: CASABLANCA, zoom: 13,
        zoomControl: false, attributionControl: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);
      mapInstanceRef.current = map;

      // Geolocation
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(pos => {
          const { latitude, longitude } = pos.coords;
          setGeoGranted(true);
          map.setView([latitude, longitude], 14);
          const userIcon = L.divIcon({
            html: `<div style="width:40px;height:40px;background:linear-gradient(135deg,#00C1FF,#FF00FF);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(0,193,255,0.6);border:2px solid rgba(255,255,255,0.4)">
              <div style="width:12px;height:12px;background:white;border-radius:50%"></div>
            </div>`,
            className: "", iconSize: [40, 40], iconAnchor: [20, 20],
          });
          L.marker([latitude, longitude], { icon: userIcon }).addTo(map);
        }, () => {});
      }

      (window as any).__wassemMap = { L, map, renderMarkers, setLocation };
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

  // Re-render markers whenever salons, offers, or category changes
  useEffect(() => {
    const wm = (window as any).__wassemMap;
    if (wm && salons.length > 0) {
      wm.renderMarkers(wm.L, wm.map, salons, flashOffers, activeCategory, setLocation);
    }
  }, [salons, flashOffers, activeCategory, renderMarkers]);

  const isPro = user?.role === "professional";
  const isSalonOwner = user?.role === "salon_owner";
  const activeCatDef = CATEGORIES.find(c => c.key === activeCategory);
  const visibleSalons = getActiveSalons(activeCategory, salons);
  const activeFlashCount = flashOffers.filter(o => o.is_active).length;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#0A0A0A]">
      {/* Map */}
      <div ref={mapRef} className="absolute inset-0 z-0" style={{ bottom: "216px" }} />

      {/* Top gradient */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0A0A0A]/95 to-transparent z-10 pointer-events-none" />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-12">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00C1FF] to-[#FF00FF] flex items-center justify-center shadow-[0_0_15px_rgba(0,193,255,0.5)]">
              <Scissors size={18} className="text-white" />
            </div>
            <span className="text-white font-black text-xl">WASSEM</span>
          </div>
          <div className="flex items-center gap-2">
            {activeFlashCount > 0 && (
              <div className="flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/40 rounded-full px-2.5 py-1">
                <Zap size={11} className="text-yellow-400" />
                <span className="text-yellow-400 text-[10px] font-bold">{activeFlashCount} deals</span>
              </div>
            )}
            {freeSalons > 0 && (
              <div className="flex items-center gap-1 bg-green-500/20 border border-green-500/40 rounded-full px-2.5 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-[10px] font-bold">{freeSalons} open</span>
              </div>
            )}
            <div className="bg-black/60 backdrop-blur border border-white/10 rounded-full px-2.5 py-1 flex items-center gap-1">
              <Navigation size={10} className={geoGranted ? "text-[#00C1FF]" : "text-gray-600"} />
              <span className="text-gray-400 text-[10px] font-bold">{geoGranted ? "Near you" : "Casablanca"}</span>
            </div>
          </div>
        </div>

        {/* Category Ribbon */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.key;
            const isMen = cat.gender === "men";
            const isWomen = cat.gender === "women";
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

      {/* Bottom Panel */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-[#0A0A0A] border-t border-white/5" style={{ height: "216px" }}>
        <div className="flex flex-col items-center justify-center h-full px-5 gap-3">
          {/* Category + status */}
          <div className="flex items-center gap-3 text-xs">
            <span className="font-bold" style={{ color: activeCatDef?.color ?? "#888" }}>
              {activeCatDef?.emoji} {visibleSalons.length} {activeCatDef?.label !== "All" ? activeCatDef?.label : ""} salon{visibleSalons.length !== 1 ? "s" : ""} nearby
            </span>
            {freeSalons > 0 && activeCategory === "all" && (
              <>
                <span className="text-gray-700">·</span>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-400 font-bold">{freeSalons} with free spots</span>
                </div>
              </>
            )}
          </div>

          {/* CTA */}
          {isSalonOwner ? (
            <button
              onClick={() => setLocation("/salon/dashboard")}
              className="w-full max-w-sm bg-gradient-to-r from-[#00C1FF] to-[#FF00FF] active:scale-[0.97] text-black font-black text-lg rounded-2xl py-4 transition-all shadow-[0_0_25px_rgba(0,193,255,0.4)] flex items-center justify-center gap-2"
            >
              🏠 Manage My Salon
            </button>
          ) : isPro ? (
            <button
              onClick={() => setLocation("/pro/requests")}
              className="w-full max-w-sm bg-[#FF00FF] active:scale-[0.97] text-black font-black text-lg rounded-2xl py-4 transition-all shadow-[0_0_25px_rgba(255,0,255,0.4)] flex items-center justify-center gap-2"
            >
              ✂️ See Nearby Requests
            </button>
          ) : (
            <button
              onClick={() => setLocation("/request")}
              className="w-full max-w-sm active:scale-[0.97] text-black font-black text-lg rounded-2xl py-4 transition-all flex items-center justify-center gap-2"
              style={{
                background: activeCatDef?.gender === "women" ? "#FF00FF" : "#00C1FF",
                boxShadow: activeCatDef?.gender === "women"
                  ? "0 0 25px rgba(255,0,255,0.5)"
                  : "0 0 25px rgba(0,193,255,0.5)",
              }}
            >
              {activeCatDef?.gender === "women" ? "💅 Book Beauty Service" : "💈 Request Service"}
            </button>
          )}

          {/* Multi-book hint */}
          {!isSalonOwner && !isPro && (
            <button
              onClick={() => setLocation("/request-multi")}
              className="text-gray-600 text-xs hover:text-gray-400 transition-colors"
            >
              Or <span className="underline">book multiple services</span> at once →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
