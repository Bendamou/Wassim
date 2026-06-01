import { useEffect, useRef, useState } from "react";
import { useListJobs, getListJobsQueryKey, useListMyBids, getListMyBidsQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { MapPin, Clock, ChevronRight, Zap, RefreshCw, Navigation, Map, List, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "leaflet/dist/leaflet.css";

const CASABLANCA: [number, number] = [33.5731, -7.5898];

const SERVICE_EMOJI: Record<string, string> = {
  haircut: "💇", beard: "🧔", nails: "💅", full_grooming: "✨",
};
const SERVICE_LABEL: Record<string, string> = {
  haircut: "Haircut", beard: "Beard Trim", nails: "Nails", full_grooming: "Full Package",
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371, r = (d: number) => (d * Math.PI) / 180;
  const a = Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lng2 - lng1) / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function jobCoords(job: any): [number, number] {
  if (job.clientLat && job.clientLng) return [Number(job.clientLat), Number(job.clientLng)];
  const s = job.id;
  return [CASABLANCA[0] + (((s * 17) % 100) - 50) * 0.0011, CASABLANCA[1] + (((s * 31) % 100) - 50) * 0.0011];
}

export default function ProRequests() {
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [, setLocation] = useLocation();

  const { data: jobs = [], isLoading } = useListJobs({
    query: { queryKey: getListJobsQueryKey(), refetchInterval: 5000 },
  });
  const { data: myBids = [] } = useListMyBids({
    query: { queryKey: getListMyBidsQueryKey(), refetchInterval: 5000 },
  });
  const acceptedBids = myBids.filter((b: any) => b.status === "accepted");

  // ── Init Leaflet map ────────────────────────────────────────────────────────
  useEffect(() => {
    if (viewMode !== "map") return;
    if (!mapRef.current || mapInstanceRef.current) return;
    let map: any;

    import("leaflet").then(leaflet => {
      const L = leaflet.default;
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      map = L.map(mapRef.current!, {
        center: CASABLANCA, zoom: 13, zoomControl: false, attributionControl: false,
      });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);
      mapInstanceRef.current = map;

      map.on("click", () => setSelectedJob(null));

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(pos => {
          const { latitude: lat, longitude: lng } = pos.coords;
          setUserPos({ lat, lng });
          map.setView([lat, lng], 14);
          const userIcon = L.divIcon({
            html: `<div style="position:relative;width:44px;height:44px">
              <div style="position:absolute;inset:0;background:rgba(155,48,255,0.3);border-radius:50%;animation:ping 2s ease-out infinite"></div>
              <div style="width:44px;height:44px;background:linear-gradient(135deg,#FF1F8E,#9B30FF);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(155,48,255,0.6);border:2px solid rgba(255,255,255,0.35)">
                <div style="width:14px;height:14px;background:white;border-radius:50%"></div>
              </div>
            </div>`,
            className: "", iconSize: [44, 44], iconAnchor: [22, 22],
          });
          L.marker([lat, lng], { icon: userIcon }).addTo(map);
        }, () => {});
      }
    });

    return () => {
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    };
  }, [viewMode]);

  // ── Render job markers ───────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || viewMode !== "map" || jobs.length === 0) return;

    import("leaflet").then(leaflet => {
      const L = leaflet.default;
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      jobs.forEach((job: any) => {
        const [lat, lng] = jobCoords(job);
        const bids = job.bidsCount || 0;

        const icon = L.divIcon({
          html: `<div style="position:relative;width:54px;height:54px">
            <div style="position:absolute;inset:0;background:rgba(255,31,142,0.22);border-radius:50%;animation:ping 1.8s ease-out infinite;pointer-events:none"></div>
            <div style="width:54px;height:54px;background:#130028;border:2.5px solid #FF1F8E;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(255,31,142,0.5);position:relative;font-size:22px">
              ${SERVICE_EMOJI[job.service] || "✂️"}
            </div>
            ${bids === 0
              ? `<div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:#4ade80;color:#000;font-weight:900;font-size:8px;padding:2px 6px;border-radius:10px;white-space:nowrap;box-shadow:0 0 8px rgba(74,222,128,0.5)">⚡ NEW</div>`
              : `<div style="position:absolute;top:-8px;right:-4px;background:#FF1F8E;color:#000;font-weight:900;font-size:9px;padding:2px 5px;border-radius:10px">${bids}</div>`
            }
          </div>`,
          className: "", iconSize: [54, 54], iconAnchor: [27, 27],
        });

        const marker = L.marker([lat, lng], { icon }).addTo(map).on("click", (e: any) => {
          e.originalEvent.stopPropagation();
          setSelectedJob(job);
          map.setView([lat, lng], 15, { animate: true });
        });
        markersRef.current.push(marker);
      });
    });
  }, [jobs, viewMode]);

  // Destroy map when switching to list
  useEffect(() => {
    if (viewMode === "list" && mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
  }, [viewMode]);

  return (
    <div className="min-h-[100dvh] bg-[#090013] flex flex-col">

      {/* ── Header ── */}
      <div className="px-5 pt-safe-top pt-5 pb-3 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-white font-black text-2xl">Nearby Requests</h1>
              <div className="flex items-center gap-1 bg-[#FF1F8E]/10 border border-[#FF1F8E]/20 rounded-full px-2 py-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF1F8E] animate-pulse" />
                <span className="text-[#FF1F8E] text-xs font-bold">LIVE</span>
              </div>
            </div>
            <p className="text-gray-500 text-sm mt-0.5">{jobs.length} open request{jobs.length !== 1 ? "s" : ""} right now</p>
          </div>
          {isLoading && <RefreshCw size={18} className="text-gray-600 animate-spin" />}
        </div>

        {/* Map / List toggle */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          {(["list", "map"] as const).map(mode => (
            <button key={mode} onClick={() => { setViewMode(mode); setSelectedJob(null); }}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all"
              style={viewMode === mode
                ? { background: "linear-gradient(135deg,#FF1F8E,#9B30FF)", color: "#fff", boxShadow: "0 0 12px rgba(255,31,142,0.3)" }
                : { color: "#6b7280" }}>
              {mode === "list" ? <><List size={14} /> List</> : <><Map size={14} /> Map</>}
            </button>
          ))}
        </div>
      </div>

      {/* ── Active accepted jobs banner ── */}
      {acceptedBids.length > 0 && (
        <div className="px-5 pt-3 pb-1 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-green-400">Active Job</p>
          {acceptedBids.map((bid: any) => (
            <button key={bid.id} onClick={() => setLocation(`/tracking/${bid.jobId}`)}
              className="w-full bg-green-500/10 border border-green-500/30 rounded-2xl p-4 flex items-center justify-between text-left">
              <div>
                <p className="text-white font-black">Job #{bid.jobId}</p>
                <p className="text-green-400 text-sm font-semibold mt-0.5">✅ Bid accepted · {bid.price} MAD</p>
              </div>
              <div className="flex items-center gap-2 bg-green-500 rounded-xl px-4 py-2.5">
                <Navigation size={16} className="text-white" />
                <span className="text-white font-black text-sm">Track</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {viewMode === "list" && (
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3 pb-28">
          {jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-[#FF1F8E]/10 border border-[#FF1F8E]/20 flex items-center justify-center mb-6">
                <Zap size={32} className="text-[#FF1F8E]" />
              </div>
              <p className="text-white font-black text-2xl mb-2">No requests yet</p>
              <p className="text-gray-500 max-w-xs">Clients are being notified. Check back in a moment.</p>
            </div>
          ) : (
            jobs.map((job: any) => (
              <button key={job.id} onClick={() => setLocation(`/pro/bid/${job.id}`)}
                className="w-full bg-white/5 hover:bg-white/8 border border-white/10 hover:border-[#FF1F8E]/50 rounded-3xl p-5 text-left transition-all active:scale-[0.98] group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-14 h-14 rounded-2xl bg-[#FF1F8E]/10 border border-[#FF1F8E]/20 flex items-center justify-center text-2xl flex-shrink-0">
                      {SERVICE_EMOJI[job.service] || "✂️"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-black text-lg">{SERVICE_LABEL[job.service] || job.service}</p>
                      <div className="flex flex-wrap gap-x-3 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1"><MapPin size={12} />{job.location}</span>
                        {job.scheduledTime && (
                          <span className="flex items-center gap-1"><Clock size={12} />{new Date(job.scheduledTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        )}
                      </div>
                      {userPos && (() => {
                        const [jLat, jLng] = jobCoords(job);
                        const km = haversineKm(userPos.lat, userPos.lng, jLat, jLng);
                        return <p className="text-xs text-[#00B4FF] font-bold mt-1">📍 {km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`}</p>;
                      })()}
                      {(job.bidsCount || 0) > 0
                        ? <p className="text-xs text-[#FF1F8E] font-bold mt-1">{job.bidsCount} barber{job.bidsCount !== 1 ? "s" : ""} already bid</p>
                        : <p className="text-xs text-green-400 font-bold mt-1">⚡ Be the first!</p>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end justify-between gap-3">
                    <div>
                      <p className="text-4xl font-black text-white">{job.budget}</p>
                      <p className="text-gray-500 text-sm font-bold">MAD</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-[#FF1F8E]/10 group-hover:bg-[#FF1F8E] flex items-center justify-center transition-colors">
                      <ChevronRight size={18} className="text-[#FF1F8E] group-hover:text-black" />
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* ── MAP VIEW ── */}
      {viewMode === "map" && (
        <div className="flex-1 relative">
          <div ref={mapRef} className="absolute inset-0" />

          {/* Jobs count pill */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 bg-black/70 backdrop-blur-md border border-white/10 rounded-full px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-[#FF1F8E] animate-pulse" />
            <span className="text-white text-xs font-bold">{jobs.length} requests on map</span>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 right-4 z-[1000] bg-black/70 backdrop-blur-md border border-white/10 rounded-2xl p-3 space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#FF1F8E] to-[#9B30FF]" />
              <span className="text-gray-300 text-xs font-bold">You</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-[#FF1F8E] bg-[#130028]" />
              <span className="text-gray-300 text-xs font-bold">Job request</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="text-gray-300 text-xs font-bold">No bids yet</span>
            </div>
          </div>

          {/* Selected job slide-up card */}
          <AnimatePresence>
            {selectedJob && (
              <motion.div
                initial={{ y: 200, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 200, opacity: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="absolute bottom-0 left-0 right-0 z-[1001] p-4"
              >
                <div className="rounded-3xl overflow-hidden"
                  style={{ background: "#130028", border: "1.5px solid rgba(255,31,142,0.35)", boxShadow: "0 -8px 40px rgba(255,31,142,0.2)" }}>
                  {/* Close */}
                  <div className="flex items-center justify-between px-5 pt-4 pb-2">
                    <div className="w-10 h-1 rounded-full bg-white/20 mx-auto" />
                    <button onClick={() => setSelectedJob(null)}
                      className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                      <X size={14} className="text-gray-400" />
                    </button>
                  </div>

                  <div className="px-5 pb-5">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 rounded-2xl bg-[#FF1F8E]/10 border border-[#FF1F8E]/25 flex items-center justify-center text-3xl flex-shrink-0">
                        {SERVICE_EMOJI[selectedJob.service] || "✂️"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-black text-xl leading-tight">
                          {SERVICE_LABEL[selectedJob.service] || selectedJob.service}
                        </p>
                        <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                          <MapPin size={12} />{selectedJob.location}
                        </p>
                        {userPos && (() => {
                          const [jLat, jLng] = jobCoords(selectedJob);
                          const km = haversineKm(userPos.lat, userPos.lng, jLat, jLng);
                          return (
                            <p className="text-[#00B4FF] text-xs font-bold mt-0.5">
                              📍 {km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`}
                            </p>
                          );
                        })()}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-4xl font-black text-white">{selectedJob.budget}</p>
                        <p className="text-gray-500 text-sm font-bold">MAD</p>
                      </div>
                    </div>

                    {/* Status row */}
                    <div className="flex items-center gap-3 mb-4">
                      {(selectedJob.bidsCount || 0) === 0
                        ? <span className="bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-black px-3 py-1 rounded-full">⚡ Be the first!</span>
                        : <span className="bg-[#FF1F8E]/10 border border-[#FF1F8E]/20 text-[#FF1F8E] text-xs font-black px-3 py-1 rounded-full">{selectedJob.bidsCount} bids placed</span>
                      }
                      {selectedJob.scheduledTime && (
                        <span className="text-gray-500 text-xs flex items-center gap-1">
                          <Clock size={11} />{new Date(selectedJob.scheduledTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>

                    {/* Navigate + Bid CTAs */}
                    <div className="flex gap-3">
                      <a href={`https://www.google.com/maps/dir/?api=1&destination=${jobCoords(selectedJob).join(",")}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-white/8 border border-white/15 rounded-2xl px-4 py-3.5 text-white font-bold text-sm">
                        <Navigation size={16} className="text-[#00B4FF]" />
                        Navigate
                      </a>
                      <button onClick={() => setLocation(`/pro/bid/${selectedJob.id}`)}
                        className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-3.5 text-white font-black text-base"
                        style={{ background: "linear-gradient(135deg,#FF1F8E,#9B30FF)", boxShadow: "0 0 20px rgba(255,31,142,0.35)" }}>
                        Place Bid <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
