import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useListMyBids, getListMyBidsQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { VerifiedBadge } from "@/components/verified-badge";
import { Edit3, X, Check, Star, Briefcase, Plus, Camera } from "lucide-react";

const API = "/api";

const PRO_CATEGORIES = [
  { id: "barber",       emoji: "💈", label: "Barber",           sub: "Men's cuts, fades, beard" },
  { id: "hair_stylist", emoji: "✂️", label: "Hair Stylist",      sub: "Cut, color, extensions" },
  { id: "nail_tech",   emoji: "💅", label: "Nail Technician",   sub: "Manicure, pedicure, gel" },
  { id: "esthetician", emoji: "🧖", label: "Esthetician",       sub: "Facials, waxing, skin" },
  { id: "makeup",      emoji: "💄", label: "Makeup Artist",     sub: "Bridal, events, lashes" },
  { id: "massage",     emoji: "💆", label: "Massage Therapist", sub: "Swedish, deep tissue" },
];

const PRO_SERVICES: Record<string, string[]> = {
  barber:       ["Men's Haircut", "Fade", "Beard Trim", "Beard Styling", "Hot Towel Shave", "Hair Coloring", "Line Up"],
  hair_stylist: ["Cut & Style", "Blowout", "Balayage", "Extensions", "Keratin Treatment", "Braids & Twists", "Highlights"],
  nail_tech:    ["Manicure", "Pedicure", "Gel Nails", "Acrylic Nails", "Nail Art", "SNS Dipping", "Paraffin Wax"],
  esthetician:  ["Classic Facial", "Men's Facial", "Microdermabrasion", "Threading", "Eyebrow Waxing", "Chemical Peel", "Hydra Facial"],
  makeup:       ["Bridal Makeup", "Event Makeup", "Lash Extensions", "Brow Lamination", "Airbrush", "HD Brows"],
  massage:      ["Swedish Massage", "Deep Tissue", "Hot Stone", "Reflexology", "Sports Massage", "Couples Massage"],
};

export default function ProfessionalProfile() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const { data: bids, isLoading } = useListMyBids({ query: { queryKey: getListMyBidsQueryKey() } });

  const [editMode, setEditMode] = useState(false);
  const [fullUser, setFullUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [bioText, setBioText] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [portfolioPhotos, setPortfolioPhotos] = useState<string[]>([]);
  const [photoInput, setPhotoInput] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(u => {
        if (!u) return;
        setFullUser(u);
        let bioData: any = {};
        try { bioData = JSON.parse(u.bio ?? "{}"); } catch {}
        setBioText(bioData.bio_text ?? "");
        setSelectedServices(bioData.services ?? []);
        let portfolio: string[] = [];
        try { portfolio = JSON.parse(u.portfolio ?? "[]"); } catch {}
        setPortfolioPhotos(portfolio);
      });
  }, [token]);

  const activeUser = fullUser ?? user;
  let bioData: any = {};
  try { bioData = JSON.parse(activeUser?.bio ?? "{}"); } catch {}

  const category = PRO_CATEGORIES.find(c => c.id === bioData.category);
  const categoryServices = PRO_SERVICES[bioData.category ?? ""] ?? [];

  const acceptedBids = bids?.filter(b => b.status === "accepted").length || 0;
  const totalBids = bids?.length || 0;
  const successRate = totalBids > 0 ? Math.round((acceptedBids / totalBids) * 100) : 0;

  const toggleService = (svc: string) =>
    setSelectedServices(prev => prev.includes(svc) ? prev.filter(s => s !== svc) : [...prev, svc]);

  const addPhoto = () => {
    if (photoInput.trim()) { setPortfolioPhotos(prev => [...prev, photoInput.trim()]); setPhotoInput(""); }
  };

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`${API}/auth/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          bio: JSON.stringify({ category: bioData.category, services: selectedServices, bio_text: bioText }),
          portfolio: JSON.stringify(portfolioPhotos),
        }),
      });
      const u = await (await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })).json();
      setFullUser(u);
      toast({ title: "Profile updated!" });
      setEditMode(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">My Profile</h1>
          <p className="text-gray-500 text-sm mt-0.5">Your professional trust profile</p>
        </div>
        <button onClick={() => setEditMode(v => !v)}
          className="w-10 h-10 rounded-xl flex items-center justify-center border transition-all"
          style={{
            background: editMode ? "rgba(255,31,142,0.15)" : "rgba(255,255,255,0.05)",
            borderColor: editMode ? "#FF1F8E" : "rgba(255,255,255,0.12)",
          }}>
          {editMode ? <X size={18} style={{ color: "#FF1F8E" }} /> : <Edit3 size={18} className="text-gray-400" />}
        </button>
      </div>

      {/* Hero card */}
      <div className="rounded-3xl overflow-hidden border border-white/8"
        style={{ background: "linear-gradient(135deg,#130028,#090013)" }}>
        <div className="h-20" style={{
          background: "linear-gradient(90deg,rgba(255,31,142,0.25),rgba(155,48,255,0.15),rgba(0,180,255,0.10))"
        }} />
        <div className="px-5 pb-5 -mt-10">
          <div className="flex items-end gap-4 mb-4">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-black text-3xl border-4 border-[#090013] flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#FF1F8E,#9B30FF)" }}>
              {activeUser?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-white">{activeUser?.name}</h2>
                {activeUser?.isVerified && <VerifiedBadge size="md" />}
              </div>
              {category && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-lg">{category.emoji}</span>
                  <span className="text-[#FF1F8E] font-bold text-sm">{category.label}</span>
                </div>
              )}
            </div>
          </div>

          {!editMode && bioData.bio_text && (
            <p className="text-gray-400 text-sm leading-relaxed mb-3">{bioData.bio_text}</p>
          )}

          {!editMode && (bioData.services ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {(bioData.services as string[]).map((svc: string) => (
                <span key={svc} className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: "rgba(255,31,142,0.12)", color: "#FF1F8E", border: "1px solid rgba(255,31,142,0.25)" }}>
                  {svc}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── EDIT MODE ── */}
      {editMode && (
        <div className="rounded-2xl border border-[#FF1F8E]/30 overflow-hidden"
          style={{ background: "rgba(255,31,142,0.04)" }}>
          <div className="p-4 border-b border-white/8">
            <p className="text-white font-black text-sm uppercase tracking-widest">Edit Profile</p>
          </div>
          <div className="p-4 space-y-5">

            {/* Bio text */}
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wider font-bold block mb-2">About You</label>
              <textarea value={bioText} onChange={e => setBioText(e.target.value)} rows={3}
                placeholder="Years of experience, your style, specialties…"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#FF1F8E] placeholder:text-gray-700 resize-none" />
            </div>

            {/* Services multi-select */}
            {categoryServices.length > 0 && (
              <div>
                <label className="text-gray-400 text-xs uppercase tracking-wider font-bold block mb-2">Services You Offer</label>
                <div className="flex flex-wrap gap-2">
                  {categoryServices.map(svc => {
                    const sel = selectedServices.includes(svc);
                    return (
                      <button key={svc} onClick={() => toggleService(svc)}
                        className="px-3 py-1.5 rounded-full border text-xs font-bold transition-all flex items-center gap-1"
                        style={{
                          background: sel ? "rgba(255,31,142,0.15)" : "rgba(255,255,255,0.04)",
                          borderColor: sel ? "#FF1F8E" : "rgba(255,255,255,0.12)",
                          color: sel ? "#FF1F8E" : "#6b7280",
                        }}>
                        {sel && <Check size={10} />}
                        {svc}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Portfolio photos */}
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wider font-bold block mb-1">Portfolio / Proof of Work</label>
              <p className="text-gray-600 text-xs mb-2">Paste image URLs — before/after shots, client results</p>
              <div className="flex gap-2 mb-3">
                <input type="url" value={photoInput} onChange={e => setPhotoInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addPhoto()}
                  placeholder="https://..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#FF1F8E] placeholder:text-gray-700" />
                <button onClick={addPhoto} disabled={!photoInput.trim()}
                  className="px-4 py-2.5 rounded-xl font-black text-sm disabled:opacity-40 flex items-center gap-1.5"
                  style={{ background: "#FF1F8E", color: "#000" }}>
                  <Plus size={14} />Add
                </button>
              </div>
              {portfolioPhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {portfolioPhotos.map((url, i) => (
                    <div key={i} className="relative rounded-xl overflow-hidden aspect-square group">
                      <img src={url} alt="" className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/200x200/130028/FF1F8E?text=Photo"; }} />
                      <button onClick={() => setPortfolioPhotos(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.2)" }}>
                        <X size={12} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save / Cancel */}
            <div className="flex gap-2 pt-1">
              <button onClick={save} disabled={saving}
                className="flex-1 py-3.5 rounded-xl font-black text-sm disabled:opacity-50"
                style={{ background: "#FF1F8E", color: "#000", boxShadow: "0 0 16px rgba(255,31,142,0.35)" }}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button onClick={() => setEditMode(false)}
                className="px-5 py-3.5 rounded-xl font-black text-sm border border-white/12 text-gray-400">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio grid (view mode) */}
      {!editMode && portfolioPhotos.length > 0 && (
        <div>
          <h2 className="text-white font-black text-base mb-3">Portfolio</h2>
          <div className="grid grid-cols-3 gap-2">
            {portfolioPhotos.map((url, i) => (
              <div key={i} className="rounded-xl overflow-hidden aspect-square">
                <img src={url} alt="" className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/200x200/130028/FF1F8E?text=Photo"; }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Bids", value: totalBids, color: "text-white" },
          { label: "Won", value: acceptedBids, color: "text-[#FF1F8E]" },
          { label: "Win Rate", value: `${successRate}%`, color: "text-[#9B30FF]" },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl border border-white/8 bg-white/4 p-4 text-center">
            <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-gray-600 text-xs mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Rating */}
      {activeUser?.rating > 0 && (
        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4 flex items-center gap-3">
          <Star size={20} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />
          <div>
            <p className="text-white font-black">{activeUser.rating.toFixed(1)} average rating</p>
            <p className="text-gray-600 text-xs">Based on completed jobs</p>
          </div>
        </div>
      )}

      {/* Recent Bids */}
      <div>
        <h2 className="text-white font-black text-base mb-3">Recent Bids</h2>
        {isLoading ? (
          <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
        ) : bids && bids.length > 0 ? (
          <div className="space-y-2">
            {bids.slice(0, 6).map(bid => (
              <div key={bid.id} className="rounded-2xl border border-white/8 bg-white/4 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${bid.status === "accepted" ? "bg-green-400" : bid.status === "rejected" ? "bg-red-400" : "bg-[#FF1F8E]"}`} />
                  <div>
                    <p className="text-white font-bold text-sm">Job #{bid.jobId}</p>
                    <p className="text-gray-600 text-xs capitalize">{bid.status}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-black text-sm">{bid.price} MAD</p>
                  {bid.estimatedArrival && <p className="text-gray-600 text-xs">{bid.estimatedArrival}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center border border-dashed border-white/10 rounded-2xl">
            <Briefcase className="text-gray-700 mx-auto mb-2" size={28} />
            <p className="text-gray-600 text-sm">No bids yet. Start bidding on jobs!</p>
          </div>
        )}
      </div>
    </div>
  );
}
