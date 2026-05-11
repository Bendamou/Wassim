import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Scissors, Navigation } from "lucide-react";
import { useAuth } from "@/lib/auth";
import "leaflet/dist/leaflet.css";

const CASABLANCA: [number, number] = [33.5731, -7.5898];

type Salon = {
  id: number; name: string; address: string; lat: number; lng: number;
  free_chairs: number; total_chairs: number; header_image: string;
};

export default function Home() {
  const [, setLocation] = useLocation();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const { user } = useAuth();
  const [salons, setSalons] = useState<Salon[]>([]);
  const [nearbyCount, setNearbyCount] = useState(0);
  const [freeSalons, setFreeSalons] = useState(0);
  const [geoGranted, setGeoGranted] = useState(false);

  // Fetch salons
  useEffect(() => {
    fetch("/api/salons")
      .then(r => r.json())
      .then((data: Salon[]) => {
        setSalons(data);
        setNearbyCount(data.length);
        setFreeSalons(data.filter(s => Number(s.free_chairs) > 0).length);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    let map: any;

    import("leaflet").then((leaflet) => {
      const L = leaflet.default;

      delete (L.Icon.Default.prototype as any)._getIconUrl;

      map = L.map(mapRef.current!, {
        center: CASABLANCA,
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Try geolocation
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setGeoGranted(true);
            map.setView([latitude, longitude], 14);

            // User location pin
            const userIcon = L.divIcon({
              html: `<div style="width:44px;height:44px;background:linear-gradient(135deg,#00C1FF,#FF00FF);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 24px rgba(0,193,255,0.7);border:3px solid rgba(255,255,255,0.4)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
                </svg>
              </div>`,
              className: "",
              iconSize: [44, 44],
              iconAnchor: [22, 22],
            });
            L.marker([latitude, longitude], { icon: userIcon }).addTo(map)
              .bindPopup("<b style='color:#00C1FF'>You are here</b>");
          },
          () => {
            // Geolocation denied — use Casablanca default
          }
        );
      }

      // Add salon markers
      const renderSalonMarkers = (salonList: Salon[]) => {
        salonList.forEach((salon) => {
          if (!salon.lat || !salon.lng) return;
          const free = Number(salon.free_chairs);
          const hasFree = free > 0;

          const salonIcon = L.divIcon({
            html: hasFree
              ? `<div style="position:relative;width:52px;height:52px">
                  <div style="position:absolute;inset:0;background:rgba(74,222,128,0.15);border-radius:50%;animation:ping 1.5s ease-out infinite;"></div>
                  <div style="width:52px;height:52px;background:#0A0A0A;border:3px solid #4ade80;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(74,222,128,0.7)">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#4ade80">
                      <path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3z"/>
                    </svg>
                  </div>
                  <div style="position:absolute;top:-6px;right:-6px;background:#4ade80;color:#0A0A0A;font-weight:900;font-size:10px;padding:2px 5px;border-radius:20px;font-family:sans-serif">${free} free</div>
                </div>`
              : `<div style="width:40px;height:40px;background:#0A0A0A;border:2px solid rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#555">
                    <path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3z"/>
                  </svg>
                </div>`,
            className: "",
            iconSize: hasFree ? [52, 52] : [40, 40],
            iconAnchor: hasFree ? [26, 26] : [20, 20],
          });

          L.marker([salon.lat, salon.lng], { icon: salonIcon })
            .addTo(map)
            .bindPopup(`
              <div style="font-family:sans-serif;min-width:160px">
                <b style="color:${hasFree ? '#4ade80' : '#aaa'};font-size:14px">${salon.name}</b>
                <p style="color:#888;font-size:11px;margin:2px 0">${salon.address || ''}</p>
                ${hasFree
                  ? `<p style="color:#4ade80;font-size:12px;font-weight:700">${free} chair${free > 1 ? 's' : ''} free now!</p>`
                  : `<p style="color:#666;font-size:12px">All chairs occupied</p>`}
              </div>
            `)
            .on("click", () => setLocation(`/salon/${salon.id}`));
        });
      };

      // Render with current salons (they may be loaded by now)
      (window as any).__renderSalonMarkers = renderSalonMarkers;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        delete (window as any).__renderSalonMarkers;
      }
    };
  }, []);

  // Render salon markers whenever salons are loaded
  useEffect(() => {
    if (salons.length > 0 && (window as any).__renderSalonMarkers && mapInstanceRef.current) {
      (window as any).__renderSalonMarkers(salons);
    }
  }, [salons]);

  const isPro = user?.role === "professional";
  const isSalonOwner = user?.role === "salon_owner";

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#0A0A0A]">
      {/* Map */}
      <div ref={mapRef} className="absolute inset-0 z-0" style={{ bottom: "160px" }} />

      {/* Top gradient */}
      <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-[#0A0A0A]/90 to-transparent z-10 pointer-events-none" />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 pt-12">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00C1FF] to-[#FF00FF] flex items-center justify-center shadow-[0_0_15px_rgba(0,193,255,0.5)]">
            <Scissors size={18} className="text-white" />
          </div>
          <span className="text-white font-black text-xl">WASSEM</span>
        </div>
        <div className="flex items-center gap-2">
          {freeSalons > 0 && (
            <div className="flex items-center gap-1.5 bg-green-500/20 border border-green-500/40 rounded-full px-3 py-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-xs font-bold">{freeSalons} salons open</span>
            </div>
          )}
          <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 flex items-center gap-1.5">
            <Navigation size={12} className={geoGranted ? "text-[#00C1FF]" : "text-gray-500"} />
            <span className="text-gray-300 text-xs font-bold">
              {geoGranted ? "Near you" : "Casablanca"}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Panel */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-[#0A0A0A] border-t border-white/5" style={{ height: "160px" }}>
        <div className="flex flex-col items-center justify-center h-full px-5 gap-3">
          {/* Status row */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#00C1FF] animate-pulse" />
              <span className="text-gray-400 text-xs font-medium">{nearbyCount} salons nearby</span>
            </div>
            {freeSalons > 0 && (
              <>
                <span className="text-gray-700">·</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-400 text-xs font-bold">{freeSalons} with free spots</span>
                </div>
              </>
            )}
          </div>

          {/* CTA Button */}
          {isSalonOwner ? (
            <button
              onClick={() => setLocation("/salon/dashboard")}
              className="w-full max-w-sm bg-gradient-to-r from-[#00C1FF] to-[#FF00FF] active:scale-[0.97] text-black font-black text-xl rounded-2xl py-5 transition-all shadow-[0_0_30px_rgba(0,193,255,0.4)] flex items-center justify-center gap-2"
            >
              🏠 Manage My Salon
            </button>
          ) : isPro ? (
            <button
              onClick={() => setLocation("/pro/requests")}
              className="w-full max-w-sm bg-[#FF00FF] hover:bg-[#e000e0] active:scale-[0.97] text-black font-black text-xl rounded-2xl py-5 transition-all shadow-[0_0_30px_rgba(255,0,255,0.4)] flex items-center justify-center gap-2"
            >
              ✂️ See Nearby Requests
            </button>
          ) : (
            <button
              onClick={() => setLocation("/request")}
              className="w-full max-w-sm bg-[#00C1FF] hover:bg-[#00b0e8] active:scale-[0.97] text-black font-black text-xl rounded-2xl py-5 transition-all shadow-[0_0_30px_rgba(0,193,255,0.5)] flex items-center justify-center gap-2"
            >
              💈 Request Service
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
