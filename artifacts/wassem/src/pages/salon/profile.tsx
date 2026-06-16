import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import {
  ArrowLeft, Star, ShoppingCart, Clock, Scissors, Package,
  MessageSquare, CheckCircle, Radio, CreditCard, X, Lock,
  Users, Zap, AlertCircle, MapPin, Navigation, Heart, ChevronLeft, ChevronRight,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useFavorites } from "@/hooks/use-favorites";

const API = "/api";

type Chair = { id: number; name: string; status: "available" | "occupied" };
type Service = { id: number; name: string; description: string; price: number; duration_mins: number };
type Product = { id: number; name: string; description: string; price: number; photo_url: string; stock: number };
type Review = { id: number; client_name: string; client_avatar: string; rating: number; comment: string; photo_url: string; created_at: string };
type Salon = {
  id: number; name: string; description: string; address: string; lat: number; lng: number;
  header_image: string; photos: string | null; owner_name: string; owner_avatar: string;
  free_chairs: number; total_chairs: number; is_live: boolean;
  avg_service_price: number;
  chairs: Chair[]; services: Service[]; products: Product[];
  reviews: Review[]; activeClaims: any[];
};

type ClaimResult = {
  id: number; salon_name: string; queue_position: number;
  deposit_amount: number; card_last4: string; expires_at: string;
};

// ── Photo Gallery Carousel ─────────────────────────────────────────────────
function PhotoCarousel({
  photos,
  alt,
  onOpenLightbox,
}: {
  photos: string[];
  alt: string;
  onOpenLightbox: (idx: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  const startX = useRef(0);
  const dragging = useRef(false);

  const prev = useCallback(() => setIdx(i => (i - 1 + photos.length) % photos.length), [photos.length]);
  const next = useCallback(() => setIdx(i => (i + 1) % photos.length), [photos.length]);

  const onPointerDown = (e: React.PointerEvent) => { startX.current = e.clientX; dragging.current = true; };
  const onPointerUp   = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 40) dx < 0 ? next() : prev();
  };

  return (
    <div
      className="relative w-full h-full select-none cursor-pointer overflow-hidden"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onClick={() => onOpenLightbox(idx)}
    >
      {photos.map((url, i) => (
        <img
          key={url}
          src={`${url}?w=800&h=576&fit=crop&q=80`}
          alt={`${alt} ${i + 1}`}
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-400"
          style={{ opacity: i === idx ? 1 : 0 }}
          loading={i === 0 ? "eager" : "lazy"}
        />
      ))}

      {/* Arrows — only show if >1 photo */}
      {photos.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); prev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center"
          >
            <ChevronLeft size={16} className="text-white" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); next(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center"
          >
            <ChevronRight size={16} className="text-white" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setIdx(i); }}
                className="rounded-full transition-all"
                style={{
                  width: i === idx ? 20 : 6,
                  height: 6,
                  background: i === idx ? "#fff" : "rgba(255,255,255,0.4)",
                }}
              />
            ))}
          </div>

          {/* Counter pill */}
          <div className="absolute top-3 right-3 z-10 bg-black/60 backdrop-blur rounded-full px-2 py-0.5 text-white text-[10px] font-bold">
            {idx + 1} / {photos.length}
          </div>
        </>
      )}
    </div>
  );
}

// ── Full-screen Lightbox ───────────────────────────────────────────────────
function Lightbox({ photos, initialIdx, onClose }: { photos: string[]; initialIdx: number; onClose: () => void }) {
  const [idx, setIdx] = useState(initialIdx);
  const startX = useRef(0);

  const prev = () => setIdx(i => (i - 1 + photos.length) % photos.length);
  const next = () => setIdx(i => (i + 1) % photos.length);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[200] bg-black flex items-center justify-center"
      onPointerDown={e => { startX.current = e.clientX; }}
      onPointerUp={e => {
        const dx = e.clientX - startX.current;
        if (Math.abs(dx) > 40) dx < 0 ? next() : prev();
      }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center"
      >
        <X size={20} className="text-white" />
      </button>

      {/* Image */}
      <img
        src={`${photos[idx]}?w=1600&h=1200&fit=crop&q=90`}
        alt={`Photo ${idx + 1}`}
        className="max-w-full max-h-full object-contain"
        draggable={false}
      />

      {/* Arrows */}
      {photos.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
            <ChevronLeft size={22} className="text-white" />
          </button>
          <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
            <ChevronRight size={22} className="text-white" />
          </button>
        </>
      )}

      {/* Counter */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
        {photos.map((_, i) => (
          <div key={i} onClick={() => setIdx(i)} className="rounded-full cursor-pointer transition-all"
            style={{ width: i === idx ? 24 : 7, height: 7, background: i === idx ? "#fff" : "rgba(255,255,255,0.35)" }} />
        ))}
      </div>
    </div>
  );
}

function StarRow({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size} className={i <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-700"} />
      ))}
    </div>
  );
}

// ── Mock Payment / Claim Modal ─────────────────────────────────────────────
function ClaimModal({
  salon,
  onClose,
  onSuccess,
  token,
  userId,
}: {
  salon: Salon;
  onClose: () => void;
  onSuccess: (result: ClaimResult) => void;
  token: string;
  userId: number;
}) {
  const [step, setStep] = useState<"pick" | "form" | "processing" | "done">(
    salon.services.length > 0 ? "pick" : "form"
  );
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [cardLast4, setCardLast4] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [error, setError] = useState("");
  const [claimData, setClaimData] = useState<ClaimResult | null>(null);
  const [enRoute, setEnRoute] = useState(false);
  const [sendingRoute, setSendingRoute] = useState(false);
  const miniMapRef = useRef<HTMLDivElement>(null);
  const miniMapInstanceRef = useRef<any>(null);
  const depositAmount = 20;

  useEffect(() => {
    if (step !== "done") return;
    const el = miniMapRef.current;
    if (!el || miniMapInstanceRef.current) return;
    import("leaflet").then(leaflet => {
      const L = leaflet.default;
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      const map = L.map(el, {
        center: [salon.lat, salon.lng] as [number, number],
        zoom: 14, zoomControl: false, attributionControl: false,
        dragging: false, scrollWheelZoom: false, doubleClickZoom: false,
      });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);
      const salonIcon = L.divIcon({
        html: `<div style="width:22px;height:22px;background:#00B4FF;border-radius:50%;border:3px solid #fff;box-shadow:0 0 12px rgba(0,180,255,0.8)"></div>`,
        className: "", iconSize: [22, 22], iconAnchor: [11, 11],
      });
      L.marker([salon.lat, salon.lng], { icon: salonIcon }).addTo(map);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          const clientPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          const clientIcon = L.divIcon({
            html: `<div style="width:16px;height:16px;background:#FF1F8E;border-radius:50%;border:3px solid #fff;box-shadow:0 0 8px rgba(255,31,142,0.8)"></div>`,
            className: "", iconSize: [16, 16], iconAnchor: [8, 8],
          });
          L.marker(clientPos, { icon: clientIcon }).addTo(map);
          L.polyline([clientPos, [salon.lat, salon.lng]], {
            color: "#00B4FF", weight: 2.5, dashArray: "6,9", opacity: 0.85,
          }).addTo(map);
          map.fitBounds(L.latLngBounds([clientPos, [salon.lat, salon.lng]]), { padding: [28, 28] });
        }, () => { map.setView([salon.lat, salon.lng], 15); });
      }
      miniMapInstanceRef.current = map;
    });
    return () => {
      if (miniMapInstanceRef.current) { miniMapInstanceRef.current.remove(); miniMapInstanceRef.current = null; }
    };
  }, [step, salon.lat, salon.lng]);

  const handleCardNumberChange = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 16);
    const formatted = digits.replace(/(.{4})/g, "$1 ").trim();
    setCardNumber(formatted);
    if (digits.length >= 4) setCardLast4(digits.slice(-4));
  };

  const handleSubmit = async () => {
    if (cardLast4.length !== 4) { setError("Enter a valid card number"); return; }
    if (!cardHolder.trim()) { setError("Enter cardholder name"); return; }
    setError("");
    setStep("processing");
    // Capture client location so barber can see distance + navigate
    let clientLat: number | null = null;
    let clientLng: number | null = null;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000, maximumAge: 60000 }));
      clientLat = pos.coords.latitude;
      clientLng = pos.coords.longitude;
    } catch { /* location optional */ }
    await new Promise(r => setTimeout(r, 900));
    const res = await fetch(`${API}/salons/${salon.id}/claim-chair`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        card_last4: cardLast4, card_holder: cardHolder.trim(),
        deposit_amount: depositAmount, service_name: selectedService?.name ?? null,
        client_lat: clientLat, client_lng: clientLng,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      setError(err.message ?? "Failed to claim chair");
      setStep("form");
      return;
    }
    const result = await res.json();
    setClaimData(result);
    onSuccess(result);
    setStep("done");
  };

  const sendEnRoute = async () => {
    if (!claimData || enRoute || sendingRoute) return;
    setSendingRoute(true);
    try {
      await fetch(`${API}/claims/${claimData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "en_route" }),
      });
      setEnRoute(true);
    } finally { setSendingRoute(false); }
  };

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${salon.lat},${salon.lng}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg rounded-t-3xl overflow-hidden"
        style={{ background: "linear-gradient(180deg,#0D0020,#090013)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* ── STEP: PICK SERVICE ── */}
        {step === "pick" && (
          <div className="px-6 pb-8 pt-3 max-h-[72vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-white font-black text-xl">Pick a Service</h2>
                <p className="text-gray-500 text-sm mt-0.5">{salon.name} · Walk-in booking</p>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center">
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            <div className="space-y-2 mb-4">
              {salon.services.map(svc => {
                const isSel = selectedService?.id === svc.id;
                return (
                  <button key={svc.id} onClick={() => setSelectedService(svc)}
                    className="w-full text-left rounded-2xl p-4 border transition-all"
                    style={{
                      background: isSel ? "rgba(0,180,255,0.08)" : "rgba(255,255,255,0.04)",
                      borderColor: isSel ? "rgba(0,180,255,0.55)" : "rgba(255,255,255,0.08)",
                      boxShadow: isSel ? "0 0 14px rgba(0,180,255,0.15)" : "none",
                    }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm">{svc.name}</p>
                        {svc.description && <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{svc.description}</p>}
                        <div className="flex items-center gap-1 mt-1.5 text-gray-600 text-xs">
                          <Clock size={10} /><span>{svc.duration_mins} min</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[#00B4FF] font-black text-xl">{svc.price}</p>
                        <p className="text-gray-600 text-xs">MAD</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <button onClick={() => setStep("form")} disabled={!selectedService}
              className="w-full rounded-2xl py-4 font-black text-base transition-all active:scale-[0.97] disabled:opacity-30"
              style={{
                background: selectedService ? "linear-gradient(135deg,#00B4FF,#0070FF)" : "rgba(255,255,255,0.06)",
                color: selectedService ? "#000" : "#555",
                boxShadow: selectedService ? "0 0 22px rgba(0,193,255,0.4)" : "none",
              }}>
              {selectedService ? `Book ${selectedService.name} — ${selectedService.price} MAD` : "Select a service to continue"}
            </button>
            <button onClick={() => setStep("form")}
              className="w-full mt-2 text-center text-gray-600 text-xs py-2 hover:text-gray-400 transition-colors">
              Skip — just hold a chair →
            </button>
          </div>
        )}

        {/* ── STEP: PROCESSING ── */}
        {step === "processing" && (
          <div className="px-6 pb-14 pt-8 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full border-4 border-[#00B4FF] border-t-transparent animate-spin" />
            <p className="text-gray-400 text-sm">Processing payment...</p>
          </div>
        )}

        {/* ── STEP: FORM ── */}
        {step === "form" && (
          <div className="px-6 pb-10 pt-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-white font-black text-xl">Claim a Chair</h2>
                <p className="text-gray-500 text-sm mt-0.5">{salon.name} · {salon.free_chairs} open now</p>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center mt-0.5">
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            {selectedService && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl border border-[#00B4FF]/30 bg-[#00B4FF]/8">
                <Scissors size={13} className="text-[#00B4FF] flex-shrink-0" />
                <span className="text-[#00B4FF] text-sm font-bold flex-1">{selectedService.name}</span>
                <span className="text-gray-500 text-xs">{selectedService.price} MAD · {selectedService.duration_mins}min</span>
              </div>
            )}
            <div className="rounded-2xl border border-[#00B4FF]/25 bg-[#00B4FF]/5 p-3.5 mb-5">
              <div className="flex items-start gap-3">
                <Lock size={16} className="text-[#00B4FF] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[#00B4FF] font-bold text-sm">No-Show Lock</p>
                  <p className="text-gray-500 text-xs leading-relaxed mt-0.5">
                    A <span className="text-white font-bold">{depositAmount} MAD deposit</span> holds your chair and is credited toward your service. No-shows forfeit the deposit.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1.5 block">Card Number</label>
                <div className="relative">
                  <CreditCard size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input value={cardNumber} onChange={e => handleCardNumberChange(e.target.value)}
                    placeholder="1234 5678 9012 3456" inputMode="numeric" maxLength={19}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm outline-none focus:border-[#00B4FF] placeholder:text-gray-700 font-mono tracking-wider" />
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1.5 block">Cardholder Name</label>
                <input value={cardHolder} onChange={e => setCardHolder(e.target.value)}
                  placeholder="Your name on card"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#00B4FF] placeholder:text-gray-700" />
              </div>
            </div>
            {error && <div className="mt-3 flex items-center gap-2 text-red-400 text-sm"><AlertCircle size={14} /><span>{error}</span></div>}
            <button onClick={handleSubmit}
              className="w-full mt-5 rounded-2xl py-4 font-black text-base flex items-center justify-center gap-2 active:scale-[0.97] transition-all"
              style={{ background: "linear-gradient(135deg,#9B30FF,#00B4FF)", color: "#000", boxShadow: "0 0 22px rgba(0,193,255,0.4)" }}>
              <Lock size={16} />Pay {depositAmount} MAD · Secure My Chair
            </button>
          </div>
        )}

        {/* ── STEP: DONE ── */}
        {step === "done" && claimData && (
          <div className="px-6 pb-8 pt-4">
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3 shadow-[0_0_25px_rgba(74,222,128,0.3)]">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              <h2 className="text-white font-black text-xl">#{claimData.queue_position} in queue!</h2>
              <p className="text-gray-500 text-sm mt-0.5">Head to <span className="text-white font-bold">{salon.name}</span></p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 mb-4 space-y-2">
              {selectedService && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Service</span>
                  <span className="text-[#00B4FF] font-bold">{selectedService.name}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Deposit</span>
                <span className="text-green-400 font-black">{depositAmount} MAD</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Card</span>
                <span className="text-white font-bold">•••• {cardLast4}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Hold expires</span>
                <span className="text-yellow-400 font-bold">30 minutes</span>
              </div>
            </div>

            {/* Mini-map: your location → salon */}
            <div className="rounded-2xl overflow-hidden mb-4 border border-white/10" style={{ height: "150px" }}>
              <div ref={miniMapRef} className="w-full h-full" />
            </div>

            <div className="flex gap-2 mb-3">
              <button onClick={sendEnRoute} disabled={enRoute || sendingRoute}
                className="flex-1 rounded-2xl py-3.5 font-black text-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.97]"
                style={{
                  background: enRoute ? "rgba(74,222,128,0.12)" : "linear-gradient(135deg,#FF1F8E,#cc0066)",
                  border: enRoute ? "1px solid rgba(74,222,128,0.4)" : "none",
                  color: enRoute ? "#4ade80" : "#fff",
                  boxShadow: enRoute ? "none" : "0 0 16px rgba(255,31,142,0.4)",
                  opacity: sendingRoute ? 0.7 : 1,
                }}>
                {enRoute ? <><CheckCircle size={14} /> Barber notified!</> : <>🏃 I'm on my way!</>}
              </button>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                className="flex-1 rounded-2xl py-3.5 font-black text-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.97]"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}>
                <Navigation size={14} className="text-[#00B4FF]" />Directions
              </a>
            </div>
            <button onClick={onClose}
              className="w-full py-3 rounded-2xl text-gray-500 text-sm font-bold border border-white/8 hover:border-white/20 transition-colors">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 2D Interactive Chair Map ───────────────────────────────────────────────
function ChairMap({
  chairs, claims, isLive, canClaim, onClaimClick,
}: {
  chairs: Chair[];
  claims: any[];
  isLive: boolean;
  canClaim: boolean;
  onClaimClick: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  const cols = Math.min(chairs.length, Math.ceil(Math.sqrt(chairs.length * 1.5)));
  const rows = Math.ceil(chairs.length / cols);
  const cellW = 100 / cols;
  const cellH = 72;
  const svgH = rows * cellH + 28;

  const claimedNames = new Set(claims.map(c => c.chair_name));

  return (
    <div className="px-3 pb-4">
      <svg
        viewBox={`0 0 100 ${svgH}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full"
        style={{ height: `${svgH * 3.5}px`, maxHeight: "260px" }}
      >
        {/* Room floor */}
        <rect x="0" y="0" width="100" height={svgH} fill="rgba(0,0,0,0.3)" rx="2" />
        {/* Mirror wall at top */}
        <rect x="2" y="2" width="96" height="3" fill="#00B4FF" fillOpacity="0.15" rx="1" />
        <text x="50" y="5.5" textAnchor="middle" fontSize="3" fill="#00B4FF" fillOpacity="0.6" fontFamily="monospace">MIRROR WALL</text>

        {chairs.map((chair, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const cx = col * cellW + cellW / 2;
          const cy = 14 + row * cellH + cellH / 2 - 6;

          const isClaimed = claimedNames.has(chair.name);
          const isOpen = chair.status === "available";
          const isSelected = selected === chair.id;

          const color = isClaimed ? "#00B4FF"
            : isOpen ? "#4ade80"
            : "#FF1F8E";

          const glowR = isClaimed ? "rgba(0,180,255,0.25)" : isOpen ? "rgba(74,222,128,0.20)" : "rgba(255,31,142,0.10)";

          return (
            <g key={chair.id}
              style={{ cursor: canClaim && isOpen && !isClaimed ? "pointer" : "default" }}
              onClick={() => {
                if (canClaim && isOpen && !isClaimed) { onClaimClick(); return; }
                if (isSelected) { setSelected(null); return; }
                setSelected(chair.id);
              }}>
              {/* Glow halo */}
              {(isOpen || isClaimed) && (
                <ellipse cx={cx} cy={cy + 7} rx={cellW * 0.34} ry={3} fill={glowR} />
              )}
              {/* Chair back */}
              <rect
                x={cx - cellW * 0.18}
                y={cy - 7}
                width={cellW * 0.36}
                height={5}
                rx={1.5}
                fill={color}
                fillOpacity={isSelected ? 1 : 0.85}
                stroke={isSelected ? "#fff" : "none"}
                strokeWidth={0.5}
              />
              {/* Chair seat */}
              <rect
                x={cx - cellW * 0.22}
                y={cy - 2}
                width={cellW * 0.44}
                height={9}
                rx={2}
                fill={color}
                fillOpacity={isSelected ? 0.9 : 0.55}
                stroke={isSelected ? "#fff" : color}
                strokeWidth={isSelected ? 0.5 : 0.3}
                strokeOpacity={0.6}
              />
              {/* Footrest */}
              <rect
                x={cx - cellW * 0.14}
                y={cy + 8}
                width={cellW * 0.28}
                height={2.5}
                rx={1}
                fill={color}
                fillOpacity={0.3}
              />
              {/* Status dot */}
              <circle cx={cx} cy={cy - 10} r={2} fill={color}
                style={isOpen ? { filter: `drop-shadow(0 0 2px ${color})` } : {}} />

              {/* Label */}
              <text
                x={cx} y={cy + 18}
                textAnchor="middle"
                fontSize="2.8"
                fill={isSelected ? "#fff" : color}
                fillOpacity={isSelected ? 1 : 0.9}
                fontFamily="monospace"
                fontWeight="bold"
              >
                {chair.name.length > 8 ? chair.name.slice(0, 8) : chair.name}
              </text>
              <text
                x={cx} y={cy + 22.5}
                textAnchor="middle"
                fontSize="2.3"
                fill={color}
                fillOpacity={0.7}
                fontFamily="monospace"
              >
                {isClaimed ? "claimed" : isOpen ? "open" : "busy"}
              </text>

              {/* Selected tooltip */}
              {isSelected && (
                <g>
                  <rect x={cx - 12} y={cy - 22} width={24} height={10} rx={2}
                    fill="#1a1a2e" stroke={color} strokeWidth={0.4} />
                  <text x={cx} y={cy - 17.5} textAnchor="middle" fontSize="2.8"
                    fill="#fff" fontFamily="monospace" fontWeight="bold">
                    {chair.name}
                  </text>
                  <text x={cx} y={cy - 14} textAnchor="middle" fontSize="2.3"
                    fill={color} fontFamily="monospace">
                    {isClaimed ? "● Client en route" : isOpen ? (canClaim ? "● Tap to claim" : "● Available") : "✗ Not available"}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Legend bar at bottom */}
        {isLive && (
          <text x="50" y={svgH - 2} textAnchor="middle" fontSize="2.5"
            fill="#4ade80" fillOpacity="0.7" fontFamily="monospace">
            ● Salon is LIVE
          </text>
        )}
      </svg>

      {/* Claim CTA when a free chair is selected */}
      {selected !== null && (() => {
        const ch = chairs.find(c => c.id === selected);
        if (!ch) return null;
        const isClaimed = claimedNames.has(ch.name);
        const isFree = ch.status === "available" && !isClaimed;
        if (!isFree) return null;
        if (canClaim) {
          return (
            <button
              onClick={onClaimClick}
              className="w-full mt-2 rounded-xl py-3 font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
              style={{ background: "linear-gradient(135deg,#9B30FF,#00B4FF)", color: "#000" }}
            >
              Claim {ch.name} · Walk In Now
            </button>
          );
        }
        return (
          <div className="mt-2 rounded-xl py-3 px-4 text-center border border-white/10"
            style={{ background: "rgba(255,255,255,0.04)" }}>
            <p className="text-gray-400 text-xs font-bold">
              {isLive ? "Log in as a client to claim this chair" : "Walk-ins open when this salon goes Live 🟢"}
            </p>
          </div>
        );
      })()}
    </div>
  );
}

// ── Main Profile Page ──────────────────────────────────────────────────────
export default function SalonProfile() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [tab, setTab] = useState<"services" | "products" | "reviews">("services");
  const [cart, setCart] = useState<Record<number, number>>({});
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [hoverStar, setHoverStar] = useState(0);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimResult, setClaimResult] = useState<ClaimResult | null>(null);
  const [toggling, setToggling] = useState(false);
  const { isFavorite, toggle: toggleFav } = useFavorites();

  const handleFavoriteToggle = async () => {
    if (!user || toggling) return;
    setToggling(true);
    try {
      const result = await toggleFav(Number(id));
      toast({ title: result === "added" ? "❤️ Saved to favorites" : "Removed from favorites" });
    } finally {
      setToggling(false);
    }
  };

  useEffect(() => {
    fetch(`${API}/salons/${id}`)
      .then(r => r.json())
      .then(setSalon)
      .catch(() => {});
  }, [id]);

  const addToCart = (productId: number) => {
    setCart(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
    toast({ title: "Added to cart" });
  };

  const cartTotal = Object.entries(cart).reduce((sum, [pid, qty]) => {
    const p = salon?.products.find(p => p.id === Number(pid));
    return sum + (p?.price ?? 0) * qty;
  }, 0);
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const submitReview = async () => {
    if (!user) return;
    setPosting(true);
    try {
      const res = await fetch(`${API}/salons/${id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment }),
      });
      if (res.ok) {
        const review = await res.json();
        setSalon(prev => prev ? { ...prev, reviews: [review, ...prev.reviews] } : prev);
        setReviewComment("");
        setReviewRating(5);
        toast({ title: "Review posted!" });
      }
    } finally {
      setPosting(false);
    }
  };

  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  if (!salon) {
    return (
      <div className="min-h-[100dvh] bg-[#090013] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#00B4FF] border-t-transparent animate-spin" />
      </div>
    );
  }

  const freeChairs = Number(salon.free_chairs);
  const avgRating = salon.reviews.length
    ? (salon.reviews.reduce((s, r) => s + r.rating, 0) / salon.reviews.length).toFixed(1)
    : "–";
  const headerGradients = [
    "from-[#00B4FF]/40 via-[#0A0A0A]/60 to-[#0A0A0A]",
    "from-[#FF1F8E]/40 via-[#0A0A0A]/60 to-[#0A0A0A]",
    "from-purple-600/40 via-[#0A0A0A]/60 to-[#0A0A0A]",
  ];
  const grad = headerGradients[salon.id % headerGradients.length];
  const queueCount = salon.activeClaims?.length ?? 0;
  const isClient = user?.role === "client";

  // ── Parse photos JSON array ────────────────────────────────────────────
  const salonPhotos: string[] = (() => {
    try {
      const arr = JSON.parse(salon.photos ?? "[]");
      return Array.isArray(arr) && arr.length ? arr : salon.header_image ? [salon.header_image] : [];
    } catch {
      return salon.header_image ? [salon.header_image] : [];
    }
  })();

  return (
    <div className="min-h-[100dvh] bg-[#090013] pb-36">
      {/* ── Full-screen Lightbox ── */}
      {lightboxIdx !== null && (
        <Lightbox
          photos={salonPhotos}
          initialIdx={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}

      {/* Cinematic Header */}
      <div className="relative h-72 overflow-hidden">
        {salonPhotos.length > 0 ? (
          <PhotoCarousel
            photos={salonPhotos}
            alt={salon.name}
            onOpenLightbox={idx => setLightboxIdx(idx)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#00B4FF]/20 via-[#0A0A0A] to-[#FF1F8E]/20 flex items-center justify-center">
            <Scissors size={80} className="text-white/5" />
          </div>
        )}
        <div className={`absolute inset-0 bg-gradient-to-b ${grad} pointer-events-none`} />

        <button
          onClick={() => history.back()}
          className="absolute top-12 left-4 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>

        {/* Heart / Favorite button */}
        {user && (
          <button
            onClick={handleFavoriteToggle}
            disabled={toggling}
            className="absolute top-12 z-10 w-10 h-10 rounded-full backdrop-blur flex items-center justify-center transition-all active:scale-90"
            style={{
              right: cartCount > 0 ? "calc(4rem + 12px)" : "1rem",
              background: isFavorite(Number(id)) ? "rgba(255,31,142,0.25)" : "rgba(0,0,0,0.5)",
              border: isFavorite(Number(id)) ? "1.5px solid rgba(255,31,142,0.6)" : "1.5px solid transparent",
              boxShadow: isFavorite(Number(id)) ? "0 0 12px rgba(255,31,142,0.35)" : "none",
            }}
          >
            <Heart
              size={18}
              style={{ color: isFavorite(Number(id)) ? "#FF1F8E" : "rgba(255,255,255,0.8)" }}
              className={isFavorite(Number(id)) ? "fill-[#FF1F8E]" : ""}
            />
          </button>
        )}

        {cartCount > 0 && (
          <div className="absolute top-12 right-4 z-10 flex items-center gap-2 bg-[#FF1F8E] rounded-full px-3 py-2">
            <ShoppingCart size={16} className="text-black" />
            <span className="text-black font-black text-sm">{cartCount} · {cartTotal} MAD</span>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-5">
          {/* Live badge */}
          {salon.is_live && freeChairs > 0 && (
            <div className="inline-flex items-center gap-1.5 bg-green-500/20 border border-green-500/50 rounded-full px-3 py-1 mb-2 shadow-[0_0_12px_rgba(74,222,128,0.3)]">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <Radio size={11} className="text-green-400" />
              <span className="text-green-400 text-xs font-bold">LIVE · {freeChairs} chair{freeChairs !== 1 ? "s" : ""} open</span>
            </div>
          )}
          {salon.is_live && freeChairs === 0 && (
            <div className="inline-flex items-center gap-1.5 bg-red-500/15 border border-red-500/30 rounded-full px-3 py-1 mb-2">
              <span className="text-red-400 text-xs font-bold">All chairs full right now</span>
            </div>
          )}

          <h1 className="text-3xl font-black text-white">{salon.name}</h1>
          <p className="text-gray-400 text-sm mt-0.5">{salon.address}</p>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1">
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
              <span className="text-white font-bold text-sm">{avgRating}</span>
              <span className="text-gray-500 text-xs">({salon.reviews.length})</span>
            </div>
            <span className="text-gray-600">·</span>
            <span className="text-gray-400 text-sm">{salon.total_chairs} chairs</span>
            {queueCount > 0 && (
              <>
                <span className="text-gray-600">·</span>
                <div className="flex items-center gap-1">
                  <Users size={12} className="text-[#00B4FF]" />
                  <span className="text-[#00B4FF] text-sm font-bold">{queueCount} waiting</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── WALK-IN CTA ── */}
      {salon.is_live && isClient && (
        <div className="px-4 py-4">
          {claimResult ? (
            /* Already claimed */
            <div className="rounded-2xl border border-green-500/50 bg-green-500/8 p-4 shadow-[0_0_20px_rgba(74,222,128,0.15)]">
              <div className="flex items-center gap-3">
                <CheckCircle size={24} className="text-green-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-green-400 font-black">Your chair is held! 🎉</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Deposit: {claimResult.deposit_amount} MAD · Card •••• {claimResult.card_last4}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white text-xs font-bold">Queue</p>
                  <p className="text-[#00B4FF] font-black text-xl">#{claimResult.queue_position}</p>
                </div>
              </div>
              <p className="text-gray-600 text-xs mt-2 text-center">
                Head over within 30 minutes to keep your spot
              </p>
            </div>
          ) : freeChairs > 0 ? (
            /* Claim button */
            <button
              onClick={() => setShowClaimModal(true)}
              className="w-full rounded-2xl py-4 font-black text-xl flex items-center justify-center gap-3 transition-all active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg,#9B30FF,#00B4FF)",
                boxShadow: "0 0 30px rgba(0,193,255,0.45)",
                color: "#000",
              }}
            >
              <Zap size={22} className="fill-black" />
              Walk In Now · {freeChairs} Chair{freeChairs !== 1 ? "s" : ""} Free
            </button>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/3 p-4 text-center">
              <p className="text-gray-500 font-bold text-sm">All chairs occupied right now</p>
              <p className="text-gray-600 text-xs mt-1">Check back soon or browse services below</p>
            </div>
          )}
        </div>
      )}

      {/* ── 2D INTERACTIVE CHAIR MAP ── */}
      {salon.chairs.length > 0 && user?.role !== "salon_owner" && (
        <div className="px-4 py-4">
          <div className="rounded-2xl border overflow-hidden"
            style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full animate-pulse"
                  style={{ background: salon.is_live ? "#4ade80" : "#374151",
                    boxShadow: salon.is_live ? "0 0 6px #4ade80" : "none" }} />
                <p className="text-white font-black text-sm">Floor Plan</p>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm inline-block" style={{ background: "#4ade80" }} />Open
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm inline-block" style={{ background: "#FF1F8E" }} />Busy
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm inline-block" style={{ background: "#00B4FF" }} />Claimed
                </span>
              </div>
            </div>
            <ChairMap
              chairs={salon.chairs}
              claims={salon.activeClaims ?? []}
              isLive={salon.is_live}
              canClaim={!!(isClient && salon.is_live && !claimResult)}
              onClaimClick={() => setShowClaimModal(true)}
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-white/8 px-4">
        {(["services", "products", "reviews"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-bold capitalize transition-colors border-b-2 ${
              tab === t ? "border-[#00B4FF] text-[#00B4FF]" : "border-transparent text-gray-500"
            }`}
          >
            {t === "services" && <Scissors size={14} className="inline mr-1" />}
            {t === "products" && <Package size={14} className="inline mr-1" />}
            {t === "reviews" && <MessageSquare size={14} className="inline mr-1" />}
            {t}
          </button>
        ))}
      </div>

      {/* Services */}
      {tab === "services" && (
        <div className="px-4 py-4 space-y-3">
          {salon.services.length === 0 && (
            <p className="text-gray-600 text-center py-8">No services listed yet.</p>
          )}
          {salon.services.map(s => (
            <div key={s.id} className="bg-white/5 border border-white/8 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex-1">
                <p className="text-white font-bold">{s.name}</p>
                {s.description && <p className="text-gray-500 text-sm mt-0.5">{s.description}</p>}
                <div className="flex items-center gap-2 mt-1.5">
                  <Clock size={12} className="text-gray-600" />
                  <span className="text-gray-500 text-xs">{s.duration_mins} min</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 ml-4">
                <span className="text-[#00B4FF] font-black text-lg">{s.price} MAD</span>
                {salon.is_live && isClient && !claimResult && freeChairs > 0 && (
                  <button
                    onClick={() => setShowClaimModal(true)}
                    className="bg-[#00B4FF]/20 border border-[#00B4FF]/40 text-[#00B4FF] font-bold text-xs px-3 py-1.5 rounded-xl"
                  >
                    Walk In
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Products */}
      {tab === "products" && (
        <div className="px-4 py-4 space-y-3">
          {salon.products.length === 0 && (
            <p className="text-gray-600 text-center py-8">No products listed yet.</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            {salon.products.map(p => (
              <div key={p.id} className="bg-white/5 border border-white/8 rounded-2xl overflow-hidden">
                {p.photo_url ? (
                  <img src={p.photo_url} alt={p.name} className="w-full h-32 object-cover" />
                ) : (
                  <div className="w-full h-32 bg-gradient-to-br from-[#FF1F8E]/10 to-[#00B4FF]/10 flex items-center justify-center">
                    <Package size={32} className="text-white/20" />
                  </div>
                )}
                <div className="p-3">
                  <p className="text-white font-bold text-sm">{p.name}</p>
                  {p.description && <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{p.description}</p>}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[#FF1F8E] font-black text-sm">{p.price} MAD</span>
                    <button
                      onClick={() => addToCart(p.id)}
                      className="w-8 h-8 rounded-xl bg-[#FF1F8E]/15 border border-[#FF1F8E]/30 flex items-center justify-center"
                    >
                      <span className="text-[#FF1F8E] font-black text-lg leading-none">+</span>
                    </button>
                  </div>
                  {cart[p.id] > 0 && <div className="mt-1.5 text-xs text-[#FF1F8E] font-bold">{cart[p.id]} in cart</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      {tab === "reviews" && (
        <div className="px-4 py-4 space-y-4">
          {user?.role === "client" && (
            <div className="bg-white/5 border border-white/8 rounded-2xl p-4">
              <p className="text-white font-bold mb-3">Leave a review</p>
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map(i => (
                  <button key={i} onMouseEnter={() => setHoverStar(i)} onMouseLeave={() => setHoverStar(0)} onClick={() => setReviewRating(i)}>
                    <Star size={28} className={i <= (hoverStar || reviewRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-700"} />
                  </button>
                ))}
              </div>
              <textarea
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                placeholder="Share your experience..."
                rows={3}
                className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#00B4FF] resize-none placeholder:text-gray-600"
              />
              <button
                onClick={submitReview}
                disabled={posting || !reviewComment.trim()}
                className="mt-2 w-full bg-[#00B4FF] disabled:opacity-40 text-black font-black rounded-xl py-3 text-sm"
              >
                {posting ? "Posting..." : "Post Review"}
              </button>
            </div>
          )}
          {salon.reviews.length === 0 && <p className="text-gray-600 text-center py-8">No reviews yet.</p>}
          {salon.reviews.map(r => (
            <div key={r.id} className="bg-white/5 border border-white/8 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <img
                  src={r.client_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.client_name)}&background=1a1a2e&color=00C1FF&bold=true&size=64`}
                  alt={r.client_name}
                  className="w-9 h-9 rounded-full"
                />
                <div className="flex-1">
                  <p className="text-white font-bold text-sm">{r.client_name}</p>
                  <StarRow rating={r.rating} />
                </div>
                <span className="text-gray-600 text-xs">{new Date(r.created_at).toLocaleDateString("fr-MA")}</span>
              </div>
              {r.comment && <p className="text-gray-400 text-sm">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Claim Modal */}
      {showClaimModal && token && user && (
        <ClaimModal
          salon={salon}
          onClose={() => setShowClaimModal(false)}
          onSuccess={result => {
            setClaimResult(result);
            setShowClaimModal(false);
            toast({ title: "Chair claimed! 🎉", description: `Head to ${salon.name} within 30 minutes` });
          }}
          token={token}
          userId={user.id}
        />
      )}
    </div>
  );
}
