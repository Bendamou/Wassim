import { useState, useEffect, useCallback } from "react";
import { Scissors, Plus, ToggleLeft, ToggleRight, TrendingUp, Users, Star, Package } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const API = "/api";

type Chair = { id: number; name: string; status: "available" | "occupied" };
type Salon = {
  id: number; name: string; description: string; address: string;
  free_chairs: number; total_chairs: number;
  chairs: Chair[]; services: any[]; products: any[]; reviews: any[];
};

export default function SalonDashboard() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [newChairName, setNewChairName] = useState("");
  const [addingChair, setAddingChair] = useState(false);
  const [showAddChair, setShowAddChair] = useState(false);

  const loadSalons = useCallback(async () => {
    const res = await fetch(`${API}/salons`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return;
    const all: Salon[] = await res.json();
    setSalons(all);
    // Find the salon owned by this user (owner_id check via detail)
    // We load detail for the first salon we find linked to owner
    if (all.length > 0 && !salon) {
      const detail = await fetch(`${API}/salons/${all[0].id}`).then(r => r.json());
      setSalon(detail);
    }
  }, [token]);

  useEffect(() => {
    loadSalons().finally(() => setLoading(false));
  }, [loadSalons]);

  const toggleChair = async (chairId: number) => {
    if (!salon) return;
    setTogglingId(chairId);
    try {
      const res = await fetch(`${API}/salons/${salon.id}/chairs/${chairId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const updated = await res.json();
        setSalon(prev => prev ? {
          ...prev,
          chairs: prev.chairs.map(c => c.id === chairId ? updated : c),
          free_chairs: prev.chairs.filter(c => c.id === chairId
            ? updated.status === "available"
            : c.status === "available").length,
        } : prev);
      }
    } finally {
      setTogglingId(null);
    }
  };

  const addChair = async () => {
    if (!salon || !newChairName.trim()) return;
    setAddingChair(true);
    try {
      const res = await fetch(`${API}/salons/${salon.id}/chairs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newChairName.trim() }),
      });
      if (res.ok) {
        const chair = await res.json();
        setSalon(prev => prev ? { ...prev, chairs: [...prev.chairs, chair] } : prev);
        setNewChairName("");
        setShowAddChair(false);
        toast({ title: "Chair added!" });
      }
    } finally {
      setAddingChair(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#00C1FF] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-[100dvh] bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#00C1FF] to-[#FF00FF] flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(0,193,255,0.4)]">
          <Scissors size={36} className="text-white" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">No salon yet</h2>
        <p className="text-gray-500 text-sm mb-6">Your salon profile will appear here once set up by admin.</p>
      </div>
    );
  }

  const freeChairs = salon.chairs.filter(c => c.status === "available").length;
  const avgRating = salon.reviews?.length
    ? (salon.reviews.reduce((s: number, r: any) => s + r.rating, 0) / salon.reviews.length).toFixed(1)
    : "–";

  return (
    <div className="min-h-[100dvh] bg-[#0A0A0A] pb-28">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#00C1FF]/10 to-transparent pt-14 pb-6 px-5">
        <p className="text-[#00C1FF] text-xs font-bold uppercase tracking-widest mb-1">Salon Dashboard</p>
        <h1 className="text-3xl font-black text-white">{salon.name}</h1>
        <p className="text-gray-500 text-sm mt-1">{salon.address}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 px-4 mb-6">
        {[
          { label: "Free", value: freeChairs, icon: ToggleRight, color: "text-green-400" },
          { label: "Chairs", value: salon.chairs.length, icon: Users, color: "text-[#00C1FF]" },
          { label: "Rating", value: avgRating, icon: Star, color: "text-yellow-400" },
          { label: "Products", value: salon.products?.length ?? 0, icon: Package, color: "text-[#FF00FF]" },
        ].map(stat => (
          <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col items-center">
            <stat.icon size={18} className={stat.color} />
            <span className={`text-xl font-black mt-1 ${stat.color}`}>{stat.value}</span>
            <span className="text-gray-600 text-[10px] font-bold">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Live vacancy banner */}
      <div className={`mx-4 mb-5 rounded-2xl px-4 py-3 border flex items-center gap-3 ${
        freeChairs > 0
          ? "bg-green-500/10 border-green-500/30"
          : "bg-white/5 border-white/10"
      }`}>
        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${freeChairs > 0 ? "bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" : "bg-gray-600"}`} />
        <div>
          <p className={`font-black text-sm ${freeChairs > 0 ? "text-green-400" : "text-gray-500"}`}>
            {freeChairs > 0 ? `${freeChairs} ${freeChairs === 1 ? "chair" : "chairs"} available now` : "All chairs occupied"}
          </p>
          <p className="text-gray-600 text-xs">Visible on the map to nearby clients</p>
        </div>
      </div>

      {/* Chair Management */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white font-black text-lg">Chair Management</p>
          <button
            onClick={() => setShowAddChair(v => !v)}
            className="w-9 h-9 rounded-xl bg-[#00C1FF]/20 border border-[#00C1FF]/40 flex items-center justify-center"
          >
            <Plus size={18} className="text-[#00C1FF]" />
          </button>
        </div>

        {showAddChair && (
          <div className="mb-3 flex gap-2">
            <input
              value={newChairName}
              onChange={e => setNewChairName(e.target.value)}
              placeholder="e.g. Chair A, VIP Chair"
              onKeyDown={e => e.key === "Enter" && addChair()}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#00C1FF] placeholder:text-gray-600"
            />
            <button
              onClick={addChair}
              disabled={addingChair || !newChairName.trim()}
              className="bg-[#00C1FF] disabled:opacity-40 text-black font-black text-sm px-4 rounded-xl"
            >
              Add
            </button>
          </div>
        )}

        <div className="space-y-2">
          {salon.chairs.length === 0 && (
            <p className="text-gray-600 text-sm text-center py-4">No chairs yet. Add your first chair above.</p>
          )}
          {salon.chairs.map(chair => {
            const isAvailable = chair.status === "available";
            const isToggling = togglingId === chair.id;
            return (
              <div
                key={chair.id}
                className={`flex items-center justify-between rounded-2xl px-4 py-3 border transition-all ${
                  isAvailable
                    ? "bg-green-500/10 border-green-500/30 shadow-[0_0_12px_rgba(74,222,128,0.1)]"
                    : "bg-white/5 border-white/10"
                }`}
              >
                <div>
                  <p className="text-white font-bold">{chair.name}</p>
                  <p className={`text-xs font-bold ${isAvailable ? "text-green-400" : "text-gray-500"}`}>
                    {isAvailable ? "✓ Available Now" : "● Occupied"}
                  </p>
                </div>
                <button
                  onClick={() => toggleChair(chair.id)}
                  disabled={isToggling}
                  className="transition-opacity disabled:opacity-50"
                >
                  {isAvailable
                    ? <ToggleRight size={36} className="text-green-400" />
                    : <ToggleLeft size={36} className="text-gray-600" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Services summary */}
      <div className="px-4">
        <p className="text-white font-black text-lg mb-3">Services ({salon.services?.length ?? 0})</p>
        <div className="space-y-2">
          {(salon.services ?? []).slice(0, 3).map((s: any) => (
            <div key={s.id} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 flex justify-between items-center">
              <span className="text-white text-sm font-bold">{s.name}</span>
              <span className="text-[#00C1FF] font-black text-sm">{s.price} MAD</span>
            </div>
          ))}
          {(salon.services?.length ?? 0) === 0 && (
            <p className="text-gray-600 text-sm text-center py-3">No services added yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
