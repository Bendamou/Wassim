import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Scissors } from "lucide-react";
import { useAuth } from "@/lib/auth";
import "leaflet/dist/leaflet.css";

const CASABLANCA = [33.5731, -7.5898] as [number, number];

export default function Home() {
  const [, setLocation] = useLocation();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    let L: any;
    import("leaflet").then((leaflet) => {
      L = leaflet.default;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, {
        center: CASABLANCA,
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(map);

      const customIcon = L.divIcon({
        html: `<div style="width:44px;height:44px;background:linear-gradient(135deg,#00C1FF,#FF00FF);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(0,193,255,0.6);border:3px solid rgba(255,255,255,0.3)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="none">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
          </svg>
        </div>`,
        className: "",
        iconSize: [44, 44],
        iconAnchor: [22, 44],
      });

      L.marker(CASABLANCA, { icon: customIcon }).addTo(map);

      const proPositions: [number, number][] = [
        [33.5811, -7.5998],
        [33.5651, -7.5798],
        [33.5731, -7.6098],
        [33.5631, -7.5698],
        [33.5851, -7.5698],
      ];

      proPositions.forEach((pos) => {
        const proIcon = L.divIcon({
          html: `<div style="width:32px;height:32px;background:#1a1a1a;border:2px solid #00C1FF;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px rgba(0,193,255,0.4)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#00C1FF">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>`,
          className: "",
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });
        L.marker(pos, { icon: proIcon }).addTo(map);
      });

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#0A0A0A]">
      {/* Map — 80% */}
      <div ref={mapRef} className="absolute inset-0 z-0" style={{ bottom: "160px" }} />

      {/* Gradient overlay at top */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#0A0A0A]/80 to-transparent z-10 pointer-events-none" />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 pt-safe-top pt-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00C1FF] to-[#FF00FF] flex items-center justify-center shadow-[0_0_15px_rgba(0,193,255,0.5)]">
            <Scissors size={18} className="text-white" />
          </div>
          <span className="text-white font-black text-xl">WASSEM</span>
        </div>
        <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5">
          <span className="text-[#00C1FF] text-xs font-bold">📍 Casablanca</span>
        </div>
      </div>

      {/* Pulse ring on map center */}
      <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-10" style={{ bottom: "calc(160px + 45%)" }}>
        <div className="w-24 h-24 rounded-full border-2 border-[#00C1FF]/30 animate-ping" />
      </div>

      {/* Bottom Panel — 20% (160px) */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-[#0A0A0A] border-t border-white/5" style={{ height: "160px" }}>
        <div className="flex flex-col items-center justify-center h-full px-5 gap-3">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <div className="w-2 h-2 rounded-full bg-[#00C1FF] animate-pulse" />
            <span className="font-medium">5 barbers nearby</span>
          </div>
          <button
            onClick={() => setLocation(user?.role === "professional" ? "/pro/requests" : "/request")}
            className="w-full max-w-sm bg-[#00C1FF] hover:bg-[#00b0e8] active:scale-[0.97] text-black font-black text-xl rounded-2xl py-5 transition-all shadow-[0_0_30px_rgba(0,193,255,0.5)] flex items-center justify-center gap-2"
          >
            {user?.role === "professional" ? (
              <>✂️ See Nearby Requests</>
            ) : (
              <>💈 Request Service</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
