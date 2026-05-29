import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import {
  ArrowLeft, Star, ShoppingCart, Clock, Scissors, Package,
  MessageSquare, CheckCircle, Radio, CreditCard, X, Lock,
  Users, Zap, AlertCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const API = "/api";

type Chair = { id: number; name: string; status: "available" | "occupied" };
type Service = { id: number; name: string; description: string; price: number; duration_mins: number };
type Product = { id: number; name: string; description: string; price: number; photo_url: string; stock: number };
type Review = { id: number; client_name: string; client_avatar: string; rating: number; comment: string; photo_url: string; created_at: string };
type Salon = {
  id: number; name: string; description: string; address: string; lat: number; lng: number;
  header_image: string; owner_name: string; owner_avatar: string;
  free_chairs: number; total_chairs: number; is_live: boolean;
  avg_service_price: number;
  chairs: Chair[]; services: Service[]; products: Product[];
  reviews: Review[]; activeClaims: any[];
};

type ClaimResult = {
  id: number; salon_name: string; queue_position: number;
  deposit_amount: number; card_last4: string; expires_at: string;
};

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
  const [step, setStep] = useState<"form" | "processing" | "done">("form");
  const [cardLast4, setCardLast4] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState(""); // display only (masked)
  const [error, setError] = useState("");
  const depositAmount = 20;
  const lowestPrice = salon.services.length > 0
    ? Math.min(...salon.services.map(s => s.price))
    : salon.avg_service_price ?? 80;

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

    // Simulate 1.5s processing
    await new Promise(r => setTimeout(r, 1500));

    const res = await fetch(`${API}/salons/${salon.id}/claim-chair`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ card_last4: cardLast4, card_holder: cardHolder.trim(), deposit_amount: depositAmount }),
    });

    if (!res.ok) {
      const err = await res.json();
      setError(err.message ?? "Failed to claim chair");
      setStep("form");
      return;
    }

    const result = await res.json();
    onSuccess(result);
    setStep("done");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg rounded-t-3xl overflow-hidden"
        style={{ background: "linear-gradient(180deg,#0f0f0f,#0A0A0A)", border: "1px solid rgba(255,255,255,0.08)" }}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {step === "done" ? (
          <div className="px-6 pb-10 pt-4 text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(74,222,128,0.3)]">
              <CheckCircle size={40} className="text-green-400" />
            </div>
            <h2 className="text-white font-black text-2xl mb-1">You're in the queue!</h2>
            <p className="text-gray-500 text-sm mb-6">
              Head to <span className="text-white font-bold">{salon.name}</span> — your chair is being held
            </p>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Deposit charged</span>
                <span className="text-green-400 font-black">{depositAmount} MAD</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Card</span>
                <span className="text-white font-bold">•••• {cardLast4}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Expires in</span>
                <span className="text-yellow-400 font-bold">30 minutes</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full bg-[#00f2ff] text-black font-black rounded-2xl py-4 shadow-[0_0_20px_rgba(0,193,255,0.4)]"
            >
              Got it — I'm on my way!
            </button>
          </div>
        ) : (
          <div className="px-6 pb-10 pt-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-white font-black text-xl">Claim a Chair</h2>
                <p className="text-gray-500 text-sm mt-0.5">{salon.name} · {salon.free_chairs} open now</p>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center mt-0.5">
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            {/* No-show lock info */}
            <div className="rounded-2xl border border-[#00f2ff]/25 bg-[#00f2ff]/5 p-3.5 mb-5">
              <div className="flex items-start gap-3">
                <Lock size={16} className="text-[#00f2ff] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[#00f2ff] font-bold text-sm">No-Show Lock</p>
                  <p className="text-gray-500 text-xs leading-relaxed mt-0.5">
                    A <span className="text-white font-bold">{depositAmount} MAD deposit</span> holds your chair and is credited toward your service ({lowestPrice}+ MAD). No-shows forfeit the deposit.
                  </p>
                </div>
              </div>
            </div>

            {/* Card form */}
            <div className="space-y-3">
              <div>
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1.5 block">
                  Card Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cardNumber}
                    onChange={e => handleCardNumberChange(e.target.value)}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white text-sm outline-none focus:border-[#00f2ff] placeholder:text-gray-700 font-mono tracking-wider"
                  />
                  <CreditCard size={16} className="absolute left-3.5 top-3.5 text-gray-600" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1.5 block">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={e => setCardHolder(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-sm outline-none focus:border-[#00f2ff] placeholder:text-gray-700"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1.5 block">
                    Expiry / CVV
                  </label>
                  <input
                    type="text"
                    placeholder="12/28 · 123"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-sm outline-none focus:border-white/20 placeholder:text-gray-700"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={step === "processing"}
              className="mt-5 w-full rounded-2xl py-4 font-black text-lg transition-all flex items-center justify-center gap-2"
              style={{
                background: step === "processing" ? "rgba(0,193,255,0.3)" : "linear-gradient(135deg,#00f2ff,#0099cc)",
                boxShadow: step === "processing" ? "none" : "0 0 25px rgba(0,193,255,0.35)",
                color: step === "processing" ? "#00f2ff" : "#000",
              }}
            >
              {step === "processing" ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-[#00f2ff] border-t-transparent animate-spin" />
                  Processing payment…
                </>
              ) : (
                <>
                  <Lock size={18} />
                  Secure My Chair · {depositAmount} MAD
                </>
              )}
            </button>

            <p className="text-center text-gray-700 text-xs mt-3">
              🔒 Mock payment — no real charge will be made
            </p>
          </div>
        )}
      </div>
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

  if (!salon) {
    return (
      <div className="min-h-[100dvh] bg-[#1a0b2e] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#00f2ff] border-t-transparent animate-spin" />
      </div>
    );
  }

  const freeChairs = Number(salon.free_chairs);
  const avgRating = salon.reviews.length
    ? (salon.reviews.reduce((s, r) => s + r.rating, 0) / salon.reviews.length).toFixed(1)
    : "–";
  const headerGradients = [
    "from-[#00f2ff]/40 via-[#0A0A0A]/60 to-[#0A0A0A]",
    "from-[#ff007f]/40 via-[#0A0A0A]/60 to-[#0A0A0A]",
    "from-purple-600/40 via-[#0A0A0A]/60 to-[#0A0A0A]",
  ];
  const grad = headerGradients[salon.id % headerGradients.length];
  const queueCount = salon.activeClaims?.length ?? 0;
  const isClient = user?.role === "client";

  return (
    <div className="min-h-[100dvh] bg-[#1a0b2e] pb-36">
      {/* Cinematic Header */}
      <div className="relative h-72 overflow-hidden">
        {salon.header_image ? (
          <img src={salon.header_image} alt={salon.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#00f2ff]/20 via-[#0A0A0A] to-[#ff007f]/20 flex items-center justify-center">
            <Scissors size={80} className="text-white/5" />
          </div>
        )}
        <div className={`absolute inset-0 bg-gradient-to-b ${grad}`} />

        <button
          onClick={() => history.back()}
          className="absolute top-12 left-4 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>

        {cartCount > 0 && (
          <div className="absolute top-12 right-4 z-10 flex items-center gap-2 bg-[#ff007f] rounded-full px-3 py-2">
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
                  <Users size={12} className="text-[#00f2ff]" />
                  <span className="text-[#00f2ff] text-sm font-bold">{queueCount} waiting</span>
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
                  <p className="text-[#00f2ff] font-black text-xl">#{claimResult.queue_position}</p>
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
                background: "linear-gradient(135deg,#00f2ff,#0070FF)",
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

      {/* Tabs */}
      <div className="flex border-b border-white/8 px-4">
        {(["services", "products", "reviews"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-bold capitalize transition-colors border-b-2 ${
              tab === t ? "border-[#00f2ff] text-[#00f2ff]" : "border-transparent text-gray-500"
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
                <span className="text-[#00f2ff] font-black text-lg">{s.price} MAD</span>
                {salon.is_live && isClient && !claimResult && freeChairs > 0 && (
                  <button
                    onClick={() => setShowClaimModal(true)}
                    className="bg-[#00f2ff]/20 border border-[#00f2ff]/40 text-[#00f2ff] font-bold text-xs px-3 py-1.5 rounded-xl"
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
                  <div className="w-full h-32 bg-gradient-to-br from-[#ff007f]/10 to-[#00f2ff]/10 flex items-center justify-center">
                    <Package size={32} className="text-white/20" />
                  </div>
                )}
                <div className="p-3">
                  <p className="text-white font-bold text-sm">{p.name}</p>
                  {p.description && <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{p.description}</p>}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[#ff007f] font-black text-sm">{p.price} MAD</span>
                    <button
                      onClick={() => addToCart(p.id)}
                      className="w-8 h-8 rounded-xl bg-[#ff007f]/15 border border-[#ff007f]/30 flex items-center justify-center"
                    >
                      <span className="text-[#ff007f] font-black text-lg leading-none">+</span>
                    </button>
                  </div>
                  {cart[p.id] > 0 && <div className="mt-1.5 text-xs text-[#ff007f] font-bold">{cart[p.id]} in cart</div>}
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
                className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#00f2ff] resize-none placeholder:text-gray-600"
              />
              <button
                onClick={submitReview}
                disabled={posting || !reviewComment.trim()}
                className="mt-2 w-full bg-[#00f2ff] disabled:opacity-40 text-black font-black rounded-xl py-3 text-sm"
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
