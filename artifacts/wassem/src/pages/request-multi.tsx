import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Check, Scissors, Clock, ChevronRight, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const API = "/api";

type Service = {
  id: number; name: string; description: string; price: number;
  duration_mins: number; category: string; salon_id: number; salon_name?: string;
};

type Salon = { id: number; name: string; is_verified: boolean; rating: number; services: Service[] };

const CAT_COLORS: Record<string, string> = {
  barber: "#00f2ff", hair: "#00f2ff",
  nails: "#ff007f", skincare: "#ff007f", massage: "#ff007f", spa: "#ff007f",
};
const CAT_EMOJI: Record<string, string> = {
  barber: "💈", hair: "✂️", nails: "💅", skincare: "🧴", massage: "💆", spa: "🧖",
};

export default function RequestMulti() {
  const [, setLocation] = useLocation();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [salons, setSalons] = useState<Salon[]>([]);
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"salon" | "services" | "confirm">("salon");

  useEffect(() => {
    fetch(`${API}/salons`).then(r => r.json()).then(async (list: any[]) => {
      const details = await Promise.all(
        list.slice(0, 6).map(s => fetch(`${API}/salons/${s.id}`).then(r => r.json()))
      );
      setSalons(details);
      setLoading(false);
    });
  }, []);

  const toggleService = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectedServices = selectedSalon?.services.filter(s => selected.has(s.id)) ?? [];
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration_mins, 0);

  const handleSubmit = async () => {
    if (!user || !selectedSalon || selected.size === 0) return;
    setSubmitting(true);
    try {
      const serviceNames = selectedServices.map(s => s.name).join(" + ");
      const res = await fetch(`${API}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          service: "full_grooming",
          budget: totalPrice,
          location: `{"lat":${33.5731},"lng":${-7.5898},"address":"${selectedSalon.name}"}`,
          scheduledTime: null,
        }),
      });
      if (res.ok) {
        const job = await res.json();
        toast({ title: `Booked: ${serviceNames}`, description: `${totalPrice} MAD · ${totalDuration} min` });
        setLocation(`/match/${job.id}`);
      } else {
        toast({ title: "Failed to submit", variant: "destructive" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#36013F] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#00f2ff] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#36013F] pb-32">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#ff007f]/10 to-transparent pt-12 pb-5 px-5">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => step === "salon" ? setLocation("/") : setStep(step === "services" ? "salon" : "services")}
            className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div>
            <p className="text-[#ff007f] text-xs font-bold uppercase tracking-widest">Multi-Book</p>
            <h1 className="text-2xl font-black text-white">
              {step === "salon" ? "Choose a Salon" : step === "services" ? "Pick Your Services" : "Review & Book"}
            </h1>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mt-3 ml-12">
          {["salon", "services", "confirm"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                step === s ? "bg-[#ff007f] text-black" :
                ["salon","services","confirm"].indexOf(step) > i ? "bg-[#ff007f]/30 text-[#ff007f]" : "bg-white/10 text-gray-600"
              }`}>
                {["salon","services","confirm"].indexOf(step) > i ? <Check size={12} /> : i + 1}
              </div>
              {i < 2 && <div className={`h-0.5 w-8 ${["salon","services","confirm"].indexOf(step) > i ? "bg-[#ff007f]/40" : "bg-white/10"}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Step: Choose Salon */}
      {step === "salon" && (
        <div className="px-4 space-y-3">
          {salons.map(salon => (
            <button
              key={salon.id}
              onClick={() => { setSelectedSalon(salon); setSelected(new Set()); setStep("services"); }}
              className="w-full bg-white/5 border border-white/10 hover:border-[#ff007f]/50 rounded-2xl p-4 text-left transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-bold">{salon.name}</p>
                    {salon.is_verified && (
                      <div className="flex items-center gap-0.5 bg-[#00f2ff]/20 border border-[#00f2ff]/40 rounded-full px-1.5 py-0.5">
                        <Check size={9} className="text-[#00f2ff]" />
                        <span className="text-[#00f2ff] text-[9px] font-bold">Verified</span>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm">{salon.services?.length ?? 0} services available</p>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {[...new Set(salon.services?.map(s => s.category) ?? [])].map(cat => (
                      <span key={cat} className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                        style={{ color: CAT_COLORS[cat] ?? "#888", borderColor: `${CAT_COLORS[cat] ?? "#888"}40`, background: `${CAT_COLORS[cat] ?? "#888"}10` }}>
                        {CAT_EMOJI[cat] ?? "•"} {cat}
                      </span>
                    ))}
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-600" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Step: Pick Services */}
      {step === "services" && selectedSalon && (
        <div className="px-4">
          <p className="text-gray-500 text-sm mb-4 px-1">
            Select multiple services to book together at <span className="text-white font-bold">{selectedSalon.name}</span>
          </p>

          {/* Group by category */}
          {[...new Set(selectedSalon.services.map(s => s.category))].map(cat => (
            <div key={cat} className="mb-5">
              <p className="text-xs font-bold uppercase tracking-widest mb-2 px-1"
                style={{ color: CAT_COLORS[cat] ?? "#888" }}>
                {CAT_EMOJI[cat]} {cat}
              </p>
              <div className="space-y-2">
                {selectedSalon.services.filter(s => s.category === cat).map(s => {
                  const isSelected = selected.has(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleService(s.id)}
                      className="w-full flex items-center gap-3 rounded-2xl p-4 border transition-all text-left"
                      style={{
                        background: isSelected ? `${CAT_COLORS[cat] ?? "#888"}12` : "rgba(255,255,255,0.04)",
                        borderColor: isSelected ? CAT_COLORS[cat] ?? "#888" : "rgba(255,255,255,0.1)",
                      }}
                    >
                      <div className="w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all"
                        style={{
                          background: isSelected ? CAT_COLORS[cat] ?? "#888" : "transparent",
                          borderColor: isSelected ? CAT_COLORS[cat] ?? "#888" : "#444",
                        }}>
                        {isSelected && <Check size={13} className="text-black" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-bold text-sm">{s.name}</p>
                        {s.description && <p className="text-gray-500 text-xs">{s.description}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          <Clock size={10} className="text-gray-600" />
                          <span className="text-gray-600 text-xs">{s.duration_mins} min</span>
                        </div>
                      </div>
                      <span className="font-black text-sm" style={{ color: CAT_COLORS[cat] ?? "#888" }}>
                        {s.price} MAD
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {selected.size > 0 && (
            <button
              onClick={() => setStep("confirm")}
              className="w-full bg-[#ff007f] text-black font-black text-lg rounded-2xl py-4 shadow-[0_0_25px_rgba(255,0,255,0.4)] flex items-center justify-center gap-2 mt-2"
            >
              {selected.size} service{selected.size > 1 ? "s" : ""} · {totalPrice} MAD <ChevronRight size={20} />
            </button>
          )}
        </div>
      )}

      {/* Step: Confirm */}
      {step === "confirm" && selectedSalon && (
        <div className="px-4 space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-white font-black text-lg mb-4">Your Booking Summary</p>
            <div className="space-y-3">
              {selectedServices.map(s => (
                <div key={s.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{CAT_EMOJI[s.category] ?? "•"}</span>
                    <span className="text-white text-sm font-bold">{s.name}</span>
                    <span className="text-gray-600 text-xs">· {s.duration_mins}min</span>
                  </div>
                  <span className="font-bold text-sm" style={{ color: CAT_COLORS[s.category] ?? "#888" }}>
                    {s.price} MAD
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 mt-4 pt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-400 text-sm">Total</span>
                <span className="text-[#ff007f] font-black text-xl">{totalPrice} MAD</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-xs">Duration</span>
                <span className="text-gray-400 text-sm">{totalDuration} min</span>
              </div>
            </div>
          </div>

          <div className="bg-[#ff007f]/10 border border-[#ff007f]/30 rounded-2xl p-4 flex items-center gap-3">
            <Zap size={18} className="text-[#ff007f] flex-shrink-0" />
            <p className="text-gray-300 text-sm">
              This is an <span className="text-[#ff007f] font-bold">Urgent Request</span> — ghost professionals near <span className="font-bold text-white">{selectedSalon.name}</span> will start bidding immediately.
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-[#ff007f] disabled:opacity-50 text-black font-black text-xl rounded-2xl py-5 shadow-[0_0_30px_rgba(255,0,255,0.5)] flex items-center justify-center gap-2"
          >
            {submitting ? "Submitting..." : "🚀 Send Urgent Request"}
          </button>
        </div>
      )}
    </div>
  );
}
