import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Star, ShoppingCart, Clock, Scissors, Package, MessageSquare, CheckCircle } from "lucide-react";
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
  free_chairs: number; total_chairs: number;
  chairs: Chair[]; services: Service[]; products: Product[]; reviews: Review[];
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

export default function SalonProfile() {
  const { id } = useParams<{ id: string }>();
  const [, back] = useLocation();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [tab, setTab] = useState<"services" | "products" | "reviews">("services");
  const [cart, setCart] = useState<Record<number, number>>({});
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [hoverStar, setHoverStar] = useState(0);

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
      <div className="min-h-[100dvh] bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#00C1FF] border-t-transparent animate-spin" />
      </div>
    );
  }

  const avgRating = salon.reviews.length
    ? (salon.reviews.reduce((s, r) => s + r.rating, 0) / salon.reviews.length).toFixed(1)
    : "–";

  const headerGradients = [
    "from-[#00C1FF]/40 via-[#0A0A0A]/60 to-[#0A0A0A]",
    "from-[#FF00FF]/40 via-[#0A0A0A]/60 to-[#0A0A0A]",
    "from-purple-600/40 via-[#0A0A0A]/60 to-[#0A0A0A]",
  ];
  const grad = headerGradients[salon.id % headerGradients.length];

  return (
    <div className="min-h-[100dvh] bg-[#0A0A0A] pb-24">
      {/* Cinematic Header */}
      <div className="relative h-72 overflow-hidden">
        {salon.header_image ? (
          <img src={salon.header_image} alt={salon.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#00C1FF]/20 via-[#0A0A0A] to-[#FF00FF]/20">
            <div className="absolute inset-0 flex items-center justify-center">
              <Scissors size={80} className="text-white/5" />
            </div>
          </div>
        )}
        {/* Dark gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-b ${grad}`} />
        {/* Back button */}
        <button
          onClick={() => history.back()}
          className="absolute top-12 left-4 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        {/* Cart */}
        {cartCount > 0 && (
          <div className="absolute top-12 right-4 z-10 flex items-center gap-2 bg-[#FF00FF] rounded-full px-3 py-2">
            <ShoppingCart size={16} className="text-black" />
            <span className="text-black font-black text-sm">{cartCount} · {cartTotal} MAD</span>
          </div>
        )}
        {/* Salon info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          {Number(salon.free_chairs) > 0 && (
            <div className="inline-flex items-center gap-1.5 bg-green-500/20 border border-green-500/40 rounded-full px-3 py-1 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-xs font-bold">{salon.free_chairs} chairs free now</span>
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
            <span className="text-gray-400 text-sm">{salon.total_chairs} chairs total</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 px-4 mt-1">
        {(["services", "products", "reviews"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-bold capitalize transition-colors border-b-2 ${
              tab === t ? "border-[#00C1FF] text-[#00C1FF]" : "border-transparent text-gray-500"
            }`}
          >
            {t === "services" && <Scissors size={14} className="inline mr-1" />}
            {t === "products" && <Package size={14} className="inline mr-1" />}
            {t === "reviews" && <MessageSquare size={14} className="inline mr-1" />}
            {t}
          </button>
        ))}
      </div>

      {/* Services Tab */}
      {tab === "services" && (
        <div className="px-4 py-4 space-y-3">
          {salon.services.length === 0 && (
            <p className="text-gray-600 text-center py-8">No services listed yet.</p>
          )}
          {salon.services.map(s => (
            <div key={s.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex-1">
                <p className="text-white font-bold">{s.name}</p>
                {s.description && <p className="text-gray-500 text-sm mt-0.5">{s.description}</p>}
                <div className="flex items-center gap-2 mt-1.5">
                  <Clock size={12} className="text-gray-600" />
                  <span className="text-gray-500 text-xs">{s.duration_mins} min</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 ml-4">
                <span className="text-[#00C1FF] font-black text-lg">{s.price} MAD</span>
                <button className="bg-[#00C1FF] hover:bg-[#00a8e0] text-black font-bold text-xs px-3 py-1.5 rounded-xl transition-colors shadow-[0_0_12px_rgba(0,193,255,0.3)]">
                  Book
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Products Tab */}
      {tab === "products" && (
        <div className="px-4 py-4 space-y-3">
          {salon.products.length === 0 && (
            <p className="text-gray-600 text-center py-8">No products listed yet.</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            {salon.products.map(p => (
              <div key={p.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                {p.photo_url ? (
                  <img src={p.photo_url} alt={p.name} className="w-full h-32 object-cover" />
                ) : (
                  <div className="w-full h-32 bg-gradient-to-br from-[#FF00FF]/10 to-[#00C1FF]/10 flex items-center justify-center">
                    <Package size={32} className="text-white/20" />
                  </div>
                )}
                <div className="p-3">
                  <p className="text-white font-bold text-sm leading-tight">{p.name}</p>
                  {p.description && <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{p.description}</p>}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[#FF00FF] font-black text-sm">{p.price} MAD</span>
                    <button
                      onClick={() => addToCart(p.id)}
                      className="w-8 h-8 rounded-xl bg-[#FF00FF]/20 border border-[#FF00FF]/40 flex items-center justify-center hover:bg-[#FF00FF]/40 transition-colors"
                    >
                      <span className="text-[#FF00FF] font-black text-lg leading-none">+</span>
                    </button>
                  </div>
                  {cart[p.id] > 0 && (
                    <div className="mt-1.5 text-xs text-[#FF00FF] font-bold">{cart[p.id]} in cart</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews Tab */}
      {tab === "reviews" && (
        <div className="px-4 py-4 space-y-4">
          {/* Write review */}
          {user?.role === "client" && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-white font-bold mb-3">Leave a review</p>
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map(i => (
                  <button
                    key={i}
                    onMouseEnter={() => setHoverStar(i)}
                    onMouseLeave={() => setHoverStar(0)}
                    onClick={() => setReviewRating(i)}
                  >
                    <Star
                      size={28}
                      className={i <= (hoverStar || reviewRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-700"}
                    />
                  </button>
                ))}
              </div>
              <textarea
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                placeholder="Share your experience..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#00C1FF] resize-none placeholder:text-gray-600"
              />
              <button
                onClick={submitReview}
                disabled={posting || !reviewComment.trim()}
                className="mt-2 w-full bg-[#00C1FF] disabled:opacity-40 text-black font-black rounded-xl py-3 text-sm transition-all"
              >
                {posting ? "Posting..." : "Post Review"}
              </button>
            </div>
          )}

          {salon.reviews.length === 0 && (
            <p className="text-gray-600 text-center py-8">No reviews yet. Be the first!</p>
          )}

          {salon.reviews.map(r => (
            <div key={r.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
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
                <span className="text-gray-600 text-xs">
                  {new Date(r.created_at).toLocaleDateString("fr-MA")}
                </span>
              </div>
              {r.comment && <p className="text-gray-400 text-sm">{r.comment}</p>}
              {r.photo_url && (
                <img src={r.photo_url} alt="Review" className="mt-2 rounded-xl w-full h-40 object-cover" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
