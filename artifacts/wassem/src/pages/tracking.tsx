import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import {
  useGetAppConfig,
  useGetJobTracking,
  getGetJobTrackingQueryKey,
  useUpdateJobLocation,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";

declare global {
  interface Window {
    __mapsReady?: () => void;
    google: any;
  }
}

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#111118" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0A0A0A" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#666" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1c1c2e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#0A0A0A" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#27273f" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#0A0A0A" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#06060f" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#2a2a2a" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "labels.text.fill", stylers: [{ color: "#444" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#141420" }] },
];

export default function TrackingPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const id = parseInt(jobId, 10);
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const clientMarker = useRef<any>(null);
  const proMarker = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);
  const mutateFnRef = useRef<((data: { id: number; data: { lat: number; lng: number } }) => void) | null>(null);

  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);

  const { data: config } = useGetAppConfig();
  const { data: tracking } = useGetJobTracking(id, {
    query: { enabled: !!id && !isNaN(id), refetchInterval: 3000, queryKey: getGetJobTrackingQueryKey(id) },
  });
  const updateLocation = useUpdateJobLocation();

  // Keep a ref to the latest mutate so geolocation callback can call it safely
  useEffect(() => {
    mutateFnRef.current = (args) => updateLocation.mutate(args);
  });

  // Load Google Maps script once the API key arrives
  useEffect(() => {
    const apiKey = config?.googleMapsApiKey;
    if (!apiKey) return;
    if (window.google?.maps) {
      setMapsLoaded(true);
      return;
    }
    window.__mapsReady = () => setMapsLoaded(true);
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=__mapsReady`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    return () => {
      try { document.head.removeChild(script); } catch { /* already removed */ }
      delete window.__mapsReady;
    };
  }, [config?.googleMapsApiKey]);

  // Initialize map once the script is loaded
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || mapInitialized) return;
    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: 33.5731, lng: -7.5898 },
      zoom: 14,
      styles: DARK_MAP_STYLE,
      disableDefaultUI: true,
      zoomControl: true,
    });
    setMapInitialized(true);
  }, [mapsLoaded, mapInitialized]);

  // Watch own GPS and push to API
  useEffect(() => {
    if (!mapsLoaded || !id || isNaN(id)) return;
    if (!navigator.geolocation) {
      setGeoError("Geolocation not supported on this device.");
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        mutateFnRef.current?.({
          id,
          data: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        });
      },
      () => {
        setGeoError("Location access denied. Enable location to appear on the map.");
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [mapsLoaded, id]);

  // Update map markers whenever tracking data changes
  useEffect(() => {
    if (!mapInitialized || !mapInstance.current || !tracking) return;
    const map = mapInstance.current;
    const G = window.google.maps;
    const bounds = new G.LatLngBounds();
    let hasClient = false;
    let hasPro = false;

    if (tracking.clientLat != null && tracking.clientLng != null) {
      hasClient = true;
      const pos = { lat: tracking.clientLat, lng: tracking.clientLng };
      bounds.extend(pos);
      if (clientMarker.current) {
        clientMarker.current.setPosition(pos);
      } else {
        clientMarker.current = new G.Marker({
          position: pos,
          map,
          title: tracking.clientName ?? "Client",
          icon: {
            path: G.SymbolPath.CIRCLE,
            scale: 14,
            fillColor: "#00f2ff",
            fillOpacity: 1,
            strokeColor: "#0A0A0A",
            strokeWeight: 3,
          },
          zIndex: 2,
        });
      }
    }

    if (tracking.proLat != null && tracking.proLng != null) {
      hasPro = true;
      const pos = { lat: tracking.proLat, lng: tracking.proLng };
      bounds.extend(pos);
      if (proMarker.current) {
        proMarker.current.setPosition(pos);
      } else {
        proMarker.current = new G.Marker({
          position: pos,
          map,
          title: tracking.professionalName ?? "Barber",
          icon: {
            path: G.SymbolPath.CIRCLE,
            scale: 14,
            fillColor: "#ff007f",
            fillOpacity: 1,
            strokeColor: "#0A0A0A",
            strokeWeight: 3,
          },
          zIndex: 2,
        });
      }
    }

    if (hasClient && hasPro) {
      map.fitBounds(bounds, 80);
    } else if (hasClient || hasPro) {
      map.setCenter(bounds.getCenter());
      map.setZoom(15);
    }
  }, [tracking, mapInitialized]);

  const isClient = user?.role === "client";

  const myHasPos = isClient
    ? tracking?.clientLat != null
    : tracking?.proLat != null;
  const otherHasPos = isClient
    ? tracking?.proLat != null
    : tracking?.clientLat != null;

  const otherName = isClient
    ? (tracking?.professionalName ?? "Barber")
    : (tracking?.clientName ?? "Client");

  return (
    <div className="min-h-[100dvh] bg-[#36013F] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 pt-safe-top pt-5 pb-4 border-b border-white/5 bg-[#36013F] z-10 relative">
        <button
          onClick={() => setLocation("/")}
          className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white flex-shrink-0"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-black text-xl">Live Tracking</h1>
          <p className="text-gray-500 text-sm truncate">
            {isClient ? "Your barber is on the way" : "Navigate to your client"}
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1.5 flex-shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 text-xs font-bold">LIVE</span>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative min-h-0">
        <div ref={mapRef} className="absolute inset-0" />

        {/* Loading overlay */}
        {!mapsLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#36013F]">
            <div className="w-12 h-12 border-2 border-[#00f2ff] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-500 text-sm">Loading map…</p>
          </div>
        )}

        {/* Legend overlay */}
        {mapsLoaded && (
          <div className="absolute top-4 left-4 right-4 flex justify-center pointer-events-none">
            <div className="bg-black/70 backdrop-blur-sm border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-5">
              <span className="flex items-center gap-2 text-sm font-bold text-[#00f2ff]">
                <span className="w-3 h-3 rounded-full bg-[#00f2ff] inline-block" />
                Client
              </span>
              <span className="w-px h-4 bg-white/20" />
              <span className="flex items-center gap-2 text-sm font-bold text-[#ff007f]">
                <span className="w-3 h-3 rounded-full bg-[#ff007f] inline-block" />
                Barber
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom status panel */}
      <div className="bg-[#36013F] border-t border-white/5 px-5 pt-4 pb-safe-bottom pb-6 space-y-3 flex-shrink-0">
        {geoError && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl px-4 py-3 flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <p className="text-yellow-300 text-sm">{geoError}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {/* You */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${isClient ? "bg-[#00f2ff] shadow-[0_0_6px_#00f2ff]" : "bg-[#ff007f] shadow-[0_0_6px_#ff007f]"}`} />
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">You</span>
            </div>
            <p className="text-white font-bold text-sm truncate">{user?.name ?? "You"}</p>
            <p className={`text-xs mt-1 font-semibold ${myHasPos ? "text-green-400" : "text-gray-500"}`}>
              {myHasPos ? "📍 Sharing location" : "⏳ Acquiring GPS…"}
            </p>
          </div>

          {/* Other party */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${isClient ? "bg-[#ff007f] shadow-[0_0_6px_#ff007f]" : "bg-[#00f2ff] shadow-[0_0_6px_#00f2ff]"}`} />
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                {isClient ? "Barber" : "Client"}
              </span>
            </div>
            <p className="text-white font-bold text-sm truncate">{otherName}</p>
            <p className={`text-xs mt-1 font-semibold ${otherHasPos ? "text-green-400" : "text-gray-500"}`}>
              {otherHasPos ? "📍 Live location" : "⏳ Not sharing yet"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
