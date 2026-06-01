import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import {
  Phone, User, ChevronRight, ArrowLeft, MapPin, Building2, Check,
} from "lucide-react";

const API_BASE = "/api";

type Step =
  | "phone" | "name" | "role" | "pref"
  | "salon_info" | "salon_category"
  | "pro_category" | "pro_services";

// ── Professional catalogue ─────────────────────────────────────────────────
const PRO_CATEGORIES = [
  { id: "barber",       emoji: "💈", label: "Barber",            sub: "Men's cuts, fades, beard" },
  { id: "hair_stylist", emoji: "✂️", label: "Hair Stylist",       sub: "Cut, color, extensions" },
  { id: "nail_tech",   emoji: "💅", label: "Nail Technician",    sub: "Manicure, pedicure, gel" },
  { id: "esthetician", emoji: "🧖", label: "Esthetician",        sub: "Facials, waxing, skin" },
  { id: "makeup",      emoji: "💄", label: "Makeup Artist",      sub: "Bridal, events, lashes" },
  { id: "massage",     emoji: "💆", label: "Massage Therapist",  sub: "Swedish, deep tissue" },
];

const PRO_SERVICES: Record<string, string[]> = {
  barber:       ["Men's Haircut", "Fade", "Beard Trim", "Beard Styling", "Hot Towel Shave", "Hair Coloring", "Line Up"],
  hair_stylist: ["Cut & Style", "Blowout", "Balayage", "Extensions", "Keratin Treatment", "Braids & Twists", "Highlights"],
  nail_tech:    ["Manicure", "Pedicure", "Gel Nails", "Acrylic Nails", "Nail Art", "SNS Dipping", "Paraffin Wax"],
  esthetician:  ["Classic Facial", "Men's Facial", "Microdermabrasion", "Threading", "Eyebrow Waxing", "Chemical Peel", "Hydra Facial"],
  makeup:       ["Bridal Makeup", "Event Makeup", "Lash Extensions", "Brow Lamination", "Airbrush", "HD Brows"],
  massage:      ["Swedish Massage", "Deep Tissue", "Hot Stone", "Reflexology", "Sports Massage", "Couples Massage"],
};

// ── Salon category options ─────────────────────────────────────────────────
const SALON_CATS = [
  { id: "men",   emoji: "👨", label: "Men Only",     sub: "Barber shop, men's grooming" },
  { id: "women", emoji: "👩", label: "Women Only",   sub: "Beauty salon, spa, nails" },
  { id: "both",  emoji: "✨", label: "Men & Women",  sub: "Mixed salon, all services" },
];

export default function AuthPage() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [genderPref, setGenderPref] = useState<"men" | "women" | "all">("all");
  const [loading, setLoading] = useState(false);

  // Salon owner fields
  const [salonName, setSalonName] = useState("");
  const [salonCity, setSalonCity] = useState("");
  const [salonAddress, setSalonAddress] = useState("");
  const [salonPhone, setSalonPhone] = useState("");
  const [salonCat, setSalonCat] = useState<"men" | "women" | "both">("both");

  // Professional fields
  const [proCategory, setProCategory] = useState("");
  const [proServices, setProServices] = useState<string[]>([]);

  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, "");
    return digits.startsWith("0") ? `+212${digits.slice(1)}` : `+${digits}`;
  };

  // ── Login existing user ──
  const handlePhoneSubmit = async () => {
    if (phone.length < 8) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/phone-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formatPhone(phone) }),
      });
      if (res.ok) {
        const data = await res.json();
        login(data.user, data.token);
        if (data.user.role === "client") setLocation("/");
        else if (data.user.role === "salon_owner") setLocation("/salon/dashboard");
        else setLocation("/pro/requests");
      } else if (res.status === 404) {
        setStep("name");
      } else {
        toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ── Core register — returns { user, token } or null ──
  const registerUser = async (role: string, pref: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/phone-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formatPhone(phone), name, role, gender_pref: pref }),
      });
      if (res.ok) return await res.json() as { user: any; token: string };
      const err = await res.json();
      toast({ title: "Error", description: err.message || "Registration failed", variant: "destructive" });
      return null;
    } catch {
      toast({ title: "Network error", variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ── Role selection routing ──
  const handleRoleSelect = (role: "client" | "professional" | "salon_owner") => {
    if (role === "client") { setStep("pref"); return; }
    if (role === "professional") { setStep("pro_category"); return; }
    if (role === "salon_owner") { setStep("salon_info"); return; }
  };

  // ── Client register ──
  const handleClientRegister = async (pref: "men" | "women" | "all") => {
    setGenderPref(pref);
    const data = await registerUser("client", pref);
    if (!data) return;
    login(data.user, data.token);
    setLocation("/");
  };

  // ── Salon owner register ──
  const handleSalonRegister = async () => {
    if (!salonName.trim() || !salonCity.trim()) return;
    const data = await registerUser("salon_owner", "all");
    if (!data) return;
    // Create the salon
    try {
      await fetch(`${API_BASE}/salons`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.token}` },
        body: JSON.stringify({
          name: salonName.trim(),
          address: salonAddress.trim() ? `${salonAddress.trim()}, ${salonCity.trim()}` : salonCity.trim(),
          description: SALON_CATS.find(c => c.id === salonCat)?.label ?? "Men & Women",
        }),
      });
    } catch {
      /* non-fatal — owner can fill in salon from dashboard */
    }
    login(data.user, data.token);
    setLocation("/salon/dashboard");
  };

  // ── Professional register ──
  const handleProRegister = async () => {
    if (!proCategory || proServices.length === 0) return;
    const data = await registerUser("professional", "all");
    if (!data) return;
    // Save category + services to bio
    try {
      await fetch(`${API_BASE}/auth/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.token}` },
        body: JSON.stringify({
          bio: JSON.stringify({ category: proCategory, services: proServices }),
        }),
      });
    } catch { /* non-fatal */ }
    login(data.user, data.token);
    setLocation("/pro/requests");
  };

  const toggleService = (svc: string) =>
    setProServices(prev => prev.includes(svc) ? prev.filter(s => s !== svc) : [...prev, svc]);

  // ── Back navigation ──
  const handleBack = () => {
    const map: Partial<Record<Step, Step>> = {
      name: "phone", role: "name",
      pref: "role",
      salon_info: "role", salon_category: "salon_info",
      pro_category: "role", pro_services: "pro_category",
    };
    const prev = map[step];
    if (prev) setStep(prev); else setLocation("/");
  };

  // ── Step-progress dots ──
  const allSteps: Step[] = ["phone", "name", "role",
    "pref", "salon_info", "salon_category", "pro_category", "pro_services"];
  const currentIdx = allSteps.indexOf(step);

  return (
    <div className="min-h-[100dvh] bg-[#090013] flex flex-col items-center justify-start p-6 relative overflow-hidden overflow-y-auto">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#00B4FF]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-[#FF1F8E]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm z-10 py-6">
        {/* Logo */}
        <motion.div className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}>
          <motion.div className="inline-block mb-4"
            animate={{ y: [0, -6, 0], scale: [1, 1.03, 1] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-[#00B4FF] to-[#FF1F8E] shadow-[0_0_40px_rgba(0,193,255,0.4)]">
              <img src="/tawoss-logo.png" alt="Tawoss" className="w-12 h-12 object-contain"
                style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.4))" }} />
            </div>
          </motion.div>
          <h1 className="text-4xl font-black text-white tracking-tight">TAWOSS</h1>
          <p className="text-[#00B4FF] font-bold mt-1 text-sm">On-demand grooming</p>
        </motion.div>

        <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.28 }} className="space-y-5">

          {/* Back button (all steps except phone) */}
          {step !== "phone" && (
            <button onClick={handleBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={18} /> Back
            </button>
          )}

          {/* ── PHONE ── */}
          {step === "phone" && (
            <>
              <div>
                <p className="text-white text-2xl font-black mb-1">Your phone number</p>
                <p className="text-gray-500 text-sm">We'll find or create your account</p>
              </div>
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-4 focus-within:border-[#00B4FF] transition-colors">
                <Phone size={20} className="text-[#00B4FF] flex-shrink-0" />
                <input type="tel" placeholder="0612 345 678" value={phone}
                  onChange={e => setPhone(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handlePhoneSubmit()}
                  className="bg-transparent text-white text-xl font-bold flex-1 outline-none placeholder:text-gray-600" autoFocus />
              </div>
              <button onClick={handlePhoneSubmit} disabled={phone.length < 8 || loading}
                className="w-full bg-[#00B4FF] disabled:opacity-40 text-black font-black text-xl rounded-2xl py-5 flex items-center justify-center gap-2">
                {loading ? "…" : <>Continue <ChevronRight size={22} /></>}
              </button>
            </>
          )}

          {/* ── NAME ── */}
          {step === "name" && (
            <>
              <div>
                <p className="text-white text-2xl font-black mb-1">What's your name?</p>
                <p className="text-gray-500 text-sm">Just your first name is fine</p>
              </div>
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-4 focus-within:border-[#00B4FF] transition-colors">
                <User size={20} className="text-[#00B4FF] flex-shrink-0" />
                <input type="text" placeholder="Ahmed" value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && name.length >= 2 && setStep("role")}
                  className="bg-transparent text-white text-xl font-bold flex-1 outline-none placeholder:text-gray-600" autoFocus />
              </div>
              <button onClick={() => setStep("role")} disabled={name.length < 2}
                className="w-full bg-[#00B4FF] disabled:opacity-40 text-black font-black text-xl rounded-2xl py-5 flex items-center justify-center gap-2">
                Continue <ChevronRight size={22} />
              </button>
            </>
          )}

          {/* ── ROLE ── */}
          {step === "role" && (
            <>
              <div>
                <p className="text-white text-2xl font-black mb-1">I am a…</p>
                <p className="text-gray-500 text-sm">Choose how you want to use Tawoss</p>
              </div>
              <div className="space-y-3">
                {[
                  { role: "client" as const, emoji: "💈", label: "I need a service", sub: "Book grooming at your price", accent: "#00B4FF" },
                  { role: "professional" as const, emoji: "✂️", label: "Freelance pro / barber", sub: "Choose your services & take jobs", accent: "#FF1F8E" },
                  { role: "salon_owner" as const, emoji: "🏠", label: "I own a salon / spa", sub: "Register your shop, manage chairs", accent: "#9B30FF" },
                ].map(opt => (
                  <button key={opt.role} onClick={() => handleRoleSelect(opt.role)} disabled={loading}
                    className="w-full bg-white/5 border-2 border-white/10 text-left rounded-2xl p-5 transition-all group active:scale-[0.98]"
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = opt.accent; (e.currentTarget as HTMLElement).style.background = `${opt.accent}18`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.10)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}>
                    <div className="text-3xl mb-2">{opt.emoji}</div>
                    <p className="text-white text-xl font-black">{opt.label}</p>
                    <p className="text-gray-500 text-sm">{opt.sub}</p>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── CLIENT PREF ── */}
          {step === "pref" && (
            <>
              <div>
                <p className="text-white text-2xl font-black mb-1">Your grooming preference</p>
                <p className="text-gray-500 text-sm">We'll personalise your feed and map</p>
              </div>
              <div className="space-y-3">
                {[
                  { key: "men" as const, emoji: "💈", label: "Men's Grooming", sub: "Barbers, fades, beard care", accent: "#00B4FF" },
                  { key: "women" as const, emoji: "💅", label: "Women's Beauty", sub: "Nails, skincare, styling", accent: "#FF1F8E" },
                  { key: "all" as const, emoji: "✨", label: "All Services", sub: "Show me everything", accent: "#9B30FF" },
                ].map(opt => (
                  <button key={opt.key} onClick={() => handleClientRegister(opt.key)} disabled={loading}
                    className="w-full bg-white/5 border-2 border-white/10 text-left rounded-2xl p-5 transition-all active:scale-[0.98]"
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = opt.accent; (e.currentTarget as HTMLElement).style.background = `${opt.accent}18`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.10)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}>
                    <div className="text-3xl mb-2">{opt.emoji}</div>
                    <p className="text-white text-xl font-black">{opt.label}</p>
                    <p className="text-gray-500 text-sm">{opt.sub}</p>
                  </button>
                ))}
              </div>
              {loading && <p className="text-center text-gray-400 text-sm">Setting up your account…</p>}
            </>
          )}

          {/* ── SALON INFO ── */}
          {step === "salon_info" && (
            <>
              <div>
                <p className="text-white text-2xl font-black mb-1">Your salon details</p>
                <p className="text-gray-500 text-sm">Clients will see this on the map</p>
              </div>

              {/* Salon Name */}
              <div>
                <label className="text-gray-400 text-xs uppercase tracking-widest font-bold block mb-2">Salon / Spa Name *</label>
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-4 focus-within:border-[#9B30FF] transition-colors">
                  <Building2 size={18} className="text-[#9B30FF] flex-shrink-0" />
                  <input type="text" placeholder="Barber House Maarif" value={salonName}
                    onChange={e => setSalonName(e.target.value)}
                    className="bg-transparent text-white font-bold flex-1 outline-none placeholder:text-gray-600" autoFocus />
                </div>
              </div>

              {/* City */}
              <div>
                <label className="text-gray-400 text-xs uppercase tracking-widest font-bold block mb-2">City / Neighbourhood *</label>
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-4 focus-within:border-[#9B30FF] transition-colors">
                  <MapPin size={18} className="text-[#9B30FF] flex-shrink-0" />
                  <input type="text" placeholder="Casablanca, Maarif" value={salonCity}
                    onChange={e => setSalonCity(e.target.value)}
                    className="bg-transparent text-white font-bold flex-1 outline-none placeholder:text-gray-600" />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="text-gray-400 text-xs uppercase tracking-widest font-bold block mb-2">Street Address <span className="text-gray-600 normal-case">(optional)</span></label>
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-4 focus-within:border-[#9B30FF] transition-colors">
                  <MapPin size={18} className="text-gray-600 flex-shrink-0" />
                  <input type="text" placeholder="12 Rue Oum Rabie" value={salonAddress}
                    onChange={e => setSalonAddress(e.target.value)}
                    className="bg-transparent text-white font-bold flex-1 outline-none placeholder:text-gray-600" />
                </div>
              </div>

              {/* Salon phone */}
              <div>
                <label className="text-gray-400 text-xs uppercase tracking-widest font-bold block mb-2">Salon Phone <span className="text-gray-600 normal-case">(optional)</span></label>
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-4 focus-within:border-[#9B30FF] transition-colors">
                  <Phone size={18} className="text-gray-600 flex-shrink-0" />
                  <input type="tel" placeholder="0522 …" value={salonPhone}
                    onChange={e => setSalonPhone(e.target.value)}
                    className="bg-transparent text-white font-bold flex-1 outline-none placeholder:text-gray-600" />
                </div>
              </div>

              <button onClick={() => setStep("salon_category")}
                disabled={!salonName.trim() || !salonCity.trim()}
                className="w-full disabled:opacity-40 text-white font-black text-xl rounded-2xl py-5 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg,#9B30FF,#00B4FF)", boxShadow: "0 0 24px rgba(155,48,255,0.35)" }}>
                Continue <ChevronRight size={22} />
              </button>
            </>
          )}

          {/* ── SALON CATEGORY ── */}
          {step === "salon_category" && (
            <>
              <div>
                <p className="text-white text-2xl font-black mb-1">Who do you serve?</p>
                <p className="text-gray-500 text-sm">This helps clients find the right salon</p>
              </div>
              <div className="space-y-3">
                {SALON_CATS.map(cat => (
                  <button key={cat.id}
                    onClick={() => { setSalonCat(cat.id as "men" | "women" | "both"); }}
                    className="w-full border-2 rounded-2xl p-4 text-left transition-all flex items-center gap-4 active:scale-[0.98]"
                    style={{
                      background: salonCat === cat.id ? "rgba(155,48,255,0.15)" : "rgba(255,255,255,0.04)",
                      borderColor: salonCat === cat.id ? "#9B30FF" : "rgba(255,255,255,0.10)",
                      boxShadow: salonCat === cat.id ? "0 0 16px rgba(155,48,255,0.25)" : "none",
                    }}>
                    <span className="text-3xl">{cat.emoji}</span>
                    <div className="flex-1">
                      <p className="text-white font-black">{cat.label}</p>
                      <p className="text-gray-500 text-sm">{cat.sub}</p>
                    </div>
                    {salonCat === cat.id && <Check size={20} style={{ color: "#9B30FF" }} />}
                  </button>
                ))}
              </div>

              <button onClick={handleSalonRegister} disabled={loading}
                className="w-full disabled:opacity-40 text-white font-black text-xl rounded-2xl py-5 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg,#9B30FF,#00B4FF)", boxShadow: "0 0 24px rgba(155,48,255,0.35)" }}>
                {loading ? "Creating your account…" : <>Register Salon <ChevronRight size={22} /></>}
              </button>
            </>
          )}

          {/* ── PRO CATEGORY ── */}
          {step === "pro_category" && (
            <>
              <div>
                <p className="text-white text-2xl font-black mb-1">Your specialisation</p>
                <p className="text-gray-500 text-sm">What type of pro are you?</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {PRO_CATEGORIES.map(cat => (
                  <button key={cat.id}
                    onClick={() => { setProCategory(cat.id); setProServices([]); }}
                    className="rounded-2xl border-2 p-4 text-left transition-all active:scale-95"
                    style={{
                      background: proCategory === cat.id ? "rgba(255,31,142,0.15)" : "rgba(255,255,255,0.04)",
                      borderColor: proCategory === cat.id ? "#FF1F8E" : "rgba(255,255,255,0.10)",
                      boxShadow: proCategory === cat.id ? "0 0 16px rgba(255,31,142,0.25)" : "none",
                    }}>
                    <div className="text-3xl mb-2">{cat.emoji}</div>
                    <p className="text-white font-bold text-sm leading-tight">{cat.label}</p>
                    <p className="text-gray-500 text-[11px] mt-0.5">{cat.sub}</p>
                  </button>
                ))}
              </div>

              <button onClick={() => setStep("pro_services")} disabled={!proCategory}
                className="w-full disabled:opacity-40 text-black font-black text-xl rounded-2xl py-5 flex items-center justify-center gap-2"
                style={{ background: "#FF1F8E", boxShadow: "0 0 24px rgba(255,31,142,0.35)" }}>
                Continue <ChevronRight size={22} />
              </button>
            </>
          )}

          {/* ── PRO SERVICES ── */}
          {step === "pro_services" && (
            <>
              <div>
                <p className="text-white text-2xl font-black mb-1">Services you offer</p>
                <p className="text-gray-500 text-sm">Select all that apply — clients will see these</p>
              </div>

              {/* Services grid */}
              <div className="flex flex-wrap gap-2">
                {(PRO_SERVICES[proCategory] ?? []).map(svc => {
                  const sel = proServices.includes(svc);
                  return (
                    <button key={svc} onClick={() => toggleService(svc)}
                      className="px-4 py-2 rounded-full border-2 text-sm font-bold transition-all active:scale-95 flex items-center gap-1.5"
                      style={{
                        background: sel ? "rgba(255,31,142,0.18)" : "rgba(255,255,255,0.05)",
                        borderColor: sel ? "#FF1F8E" : "rgba(255,255,255,0.12)",
                        color: sel ? "#FF1F8E" : "#9ca3af",
                      }}>
                      {sel && <Check size={12} />}
                      {svc}
                    </button>
                  );
                })}
              </div>

              {proServices.length > 0 && (
                <p className="text-[#FF1F8E] text-xs font-bold text-center">
                  {proServices.length} service{proServices.length !== 1 ? "s" : ""} selected
                </p>
              )}

              <button onClick={handleProRegister}
                disabled={proServices.length === 0 || loading}
                className="w-full disabled:opacity-40 text-black font-black text-xl rounded-2xl py-5 flex items-center justify-center gap-2"
                style={{ background: "#FF1F8E", boxShadow: "0 0 24px rgba(255,31,142,0.35)" }}>
                {loading ? "Creating account…" : <>Create Account <ChevronRight size={22} /></>}
              </button>
            </>
          )}

        </motion.div>
      </div>
    </div>
  );
}
