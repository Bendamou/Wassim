import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Heart, MapPin, Users, Scissors, Star, Radio, Trash2, Compass } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useFavorites, fetchFavoriteSalons } from "@/hooks/use-favorites";
import { useToast } from "@/hooks/use-toast";

type FavSalon = {
  id: number; name: string; address?: string; city?: string;
  is_live?: boolean; free_chairs?: number; total_chairs?: number;
  rating?: number; owner_name?: string; categories?: string;
};

const FILTERS = [
  { key: "all",       label: "All" },
  { key: "mens",      label: "Men's" },
  { key: "womens",    label: "Women's" },
  { key: "available", label: "Available Now" },
] as const;
type Filter = (typeof FILTERS)[number]["key"];

export default function FavoritesPage() {
  const [, setLocation] = useLocation();
  const { token } = useAuth();
  const { toggle } = useFavorites();
  const { toast } = useToast();

  const [salons, setSalons] = useState<FavSalon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchFavoriteSalons(token);
      setSalons(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token]);

  const handleRemove = async (salon: FavSalon) => {
    await toggle(salon.id);
    setSalons(prev => prev.filter(s => s.id !== salon.id));
    toast({ title: `Removed ${salon.name} from favorites` });
  };

  const filtered = salons.filter(s => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!s.name?.toLowerCase().includes(q) && !s.address?.toLowerCase().includes(q)) return false;
    }
    if (filter === "available" && !((s.free_chairs ?? 0) > 0 || s.is_live)) return false;
    if (filter === "mens" && s.categories?.includes("nails")) return false;
    if (filter === "womens" && !s.categories?.includes("nails") && !s.categories?.includes("skincare")) return false;
    return true;
  });

  return (
    <div className="min-h-[100dvh] bg-[#090013] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#090013]/95 backdrop-blur-xl border-b border-white/5 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,31,142,0.15)", border: "1px solid rgba(255,31,142,0.3)" }}>
            <Heart size={18} className="text-[#FF1F8E] fill-[#FF1F8E]" />
          </div>
          <h1 className="text-white font-black text-xl">My Favorites</h1>
          {salons.length > 0 && (
            <span className="ml-auto text-xs font-bold text-gray-500">{salons.length} salon{salons.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by name or address..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-[#FF1F8E]/50 mb-3"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        />

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{
                background: filter === f.key ? "rgba(255,31,142,0.15)" : "rgba(255,255,255,0.05)",
                border: `1.5px solid ${filter === f.key ? "#FF1F8E" : "rgba(255,255,255,0.08)"}`,
                color: filter === f.key ? "#FF1F8E" : "#6b7280",
                boxShadow: filter === f.key ? "0 0 10px rgba(255,31,142,0.2)" : "none",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center pt-20">
            <div className="w-8 h-8 rounded-full border-2 border-[#FF1F8E] border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 pt-20 px-8 text-center">
            <div className="text-6xl">❤️</div>
            <h2 className="text-white font-black text-xl">
              {salons.length === 0 ? "No favorites yet" : "No matches"}
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              {salons.length === 0
                ? "Tap the ❤️ on any salon to save it here for quick booking."
                : "Try a different search or filter."}
            </p>
            {salons.length === 0 && (
              <button
                onClick={() => setLocation("/")}
                className="mt-2 px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all active:scale-[0.97]"
                style={{ background: "#FF1F8E", color: "#000", boxShadow: "0 0 20px rgba(255,31,142,0.4)" }}
              >
                <Compass size={16} />Browse Salons
              </button>
            )}
          </div>
        ) : (
          filtered.map(salon => (
            <div
              key={salon.id}
              className="rounded-2xl border overflow-hidden transition-all"
              style={{ background: "#130028", borderColor: "rgba(255,255,255,0.07)" }}
            >
              {/* Top section */}
              <div className="p-4 flex items-start gap-3">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-xl"
                  style={{ background: "rgba(155,48,255,0.15)", border: "1px solid rgba(155,48,255,0.3)", color: "#9B30FF" }}>
                  {salon.name?.[0]?.toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      {salon.is_live && (
                        <div className="inline-flex items-center gap-1 mb-1 bg-green-500/15 border border-green-500/40 rounded-full px-2 py-0.5">
                          <Radio size={9} className="text-green-400" />
                          <span className="text-green-400 text-[10px] font-bold">LIVE</span>
                        </div>
                      )}
                      <p className="text-white font-black text-base leading-tight">{salon.name}</p>
                      {salon.address && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin size={10} className="text-gray-500 flex-shrink-0" />
                          <span className="text-gray-500 text-xs truncate">{salon.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Remove heart */}
                    <button
                      onClick={() => handleRemove(salon)}
                      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
                      style={{ background: "rgba(255,31,142,0.12)", border: "1px solid rgba(255,31,142,0.25)" }}
                    >
                      <Heart size={14} className="text-[#FF1F8E] fill-[#FF1F8E]" />
                    </button>
                  </div>

                  {/* Badges row */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {(salon.free_chairs ?? 0) > 0 && (
                      <div className="flex items-center gap-1 bg-[#00B4FF]/10 border border-[#00B4FF]/25 rounded-full px-2 py-0.5">
                        <Users size={10} className="text-[#00B4FF]" />
                        <span className="text-[#00B4FF] text-[10px] font-bold">{salon.free_chairs} free</span>
                      </div>
                    )}
                    {!!salon.rating && salon.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star size={10} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-yellow-400 text-[10px] font-bold">{Number(salon.rating).toFixed(1)}</span>
                      </div>
                    )}
                    {salon.total_chairs && (
                      <span className="text-gray-600 text-[10px]">{salon.total_chairs} chairs</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex border-t border-white/5">
                <button
                  onClick={() => setLocation(`/salon/${salon.id}`)}
                  className="flex-1 py-3 flex items-center justify-center gap-1.5 font-black text-sm transition-all active:scale-[0.97]"
                  style={{ background: "rgba(0,180,255,0.08)", color: "#00B4FF" }}
                >
                  <Scissors size={14} />
                  Book Now
                </button>
                <div className="w-px bg-white/5" />
                <button
                  onClick={() => setLocation(`/?salon=${salon.id}`)}
                  className="flex-1 py-3 flex items-center justify-center gap-1.5 font-bold text-sm text-gray-500 transition-all active:scale-[0.97] hover:text-gray-300"
                >
                  <MapPin size={14} />
                  View on Map
                </button>
                <div className="w-px bg-white/5" />
                <button
                  onClick={() => handleRemove(salon)}
                  className="px-4 py-3 flex items-center justify-center text-red-500/70 transition-all active:scale-[0.97] hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
