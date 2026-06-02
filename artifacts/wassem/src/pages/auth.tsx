import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import {
  Phone, User, ChevronRight, ArrowLeft, MapPin, Building2, Check, Mail,
} from "lucide-react";

const API_BASE = "/api";

type Step =
  | "role" | "credentials" | "signin"
  | "pref" | "salon_info" | "salon_category"
  | "pro_category" | "pro_services";

type Role = "client" | "professional" | "salon_owner";

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

const SALON_CATS = [
  { id: "men",   emoji: "👨", label: "Men Only",    sub: "Barber shop, men's grooming" },
  { id: "women", emoji: "👩", label: "Women Only",  sub: "Beauty salon, spa, nails" },
  { id: "both",  emoji: "✨", label: "Men & Women", sub: "Mixed salon, all services" },
];

const ROLE_OPTIONS = [
  {
    role: "client" as Role,
    emoji: "👤",
    label: "Customer",
    sub: "Book grooming services at your price",
    accent: "#00B4FF",
    gradient: "linear-gradient(135deg,rgba(0,180,255,0.18),rgba(0,180,255,0.04))",
    border: "rgba(0,180,255,0.4)",
    glow: "rgba(0,180,255,0.2)",
  },
  {
    role: "salon_owner" as Role,
    emoji: "🏠",
    label: "Salon Owner",
    sub: "Register your shop & manage chairs",
    accent: "#9B30FF",
    gradient: "linear-gradient(135deg,rgba(155,48,255,0.18),rgba(155,48,255,0.04))",
    border: "rgba(155,48,255,0.4)",
    glow: "rgba(155,48,255,0.2)",
  },
  {
    role: "professional" as Role,
    emoji: "✂️",
    label: "Freelancer / Pro",
    sub: "Choose your services & take jobs",
    accent: "#FF1F8E",
    gradient: "linear-gradient(135deg,rgba(255,31,142,0.18),rgba(255,31,142,0.04))",
    border: "rgba(255,31,142,0.4)",
    glow: "rgba(255,31,142,0.2)",
  },
];

const formatPhone = (val: string) => {
  const digits = val.replace(/\D/g, "");
  return digits.startsWith("0") ? `+212${digits.slice(1)}` : `+${digits}`;
};

export default function AuthPage() {
  const [step, setStep] = useState<Step>("role");
  const [chosenRole, setChosenRole] = useState<Role | null>(null);

  // Credentials
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Sign-in
  const [signinPhone, setSigninPhone] = useState("");

  // Client pref
  const [genderPref, setGenderPref] = useState<"men" | "women" | "all">("all");

  // Salon owner
  const [salonName, setSalonName] = useState("");
  const [salonCity, setSalonCity] = useState("");
  const [salonAddress, setSalonAddress] = useState("");
  const [salonPhone, setSalonPhone] = useState("");
  const [salonCat, setSalonCat] = useState<"men" | "women" | "both">("both");

  // Professional
  const [proCategory, setProCategory] = useState("");
  const [proServices, setProServices] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  // ── Back navigation ──────────────────────────────────────────────────────
  const handleBack = () => {
    const map: Partial<Record<Step, Step>> = {
      credentials: "role",
      signin: "role",
      pref: "credentials",
      salon_info: "credentials",
      salon_category: "salon_info",
      pro_category: "credentials",
      pro_services: "pro_category",
    };
    const prev = map[step];
    if (prev) setStep(prev); else setLocation("/");
  };

  // ── Role selection ────────────────────────────────────────────────────────
  const handleRoleSelect = (role: Role) => {
    setChosenRole(role);
    setStep("credentials");
  };

  // ── Core register ─────────────────────────────────────────────────────────
  const registerUser = async (role: string, pref: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/phone-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: formatPhone(phone),
          name: name.trim(),
          email: email.trim(),
          role,
          gender_pref: pref,
        }),
      });
      if (res.ok) return await res.json() as { user: any; token: string };
      const err = await res.json();
      // If phone already taken, try phone-login instead
      if (res.status === 409) {
        const loginRes = await fetch(`${API_BASE}/auth/phone-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: formatPhone(phone) }),
        });
        if (loginRes.ok) return await loginRes.json() as { user: any; token: string };
      }
      toast({ title: "Error", description: err.message || "Registration failed", variant: "destructive" });
      return null;
    } catch {
      toast({ title: "Network error", variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ── Credentials continue ──────────────────────────────────────────────────
  const handleCredentialsContinue = () => {
    if (chosenRole === "client") setStep("pref");
    else if (chosenRole === "salon_owner") setStep("salon_info");
    else setStep("pro_category");
  };

  // ── Client register ───────────────────────────────────────────────────────
  const handleClientRegister = async (pref: "men" | "women" | "all") => {
    setGenderPref(pref);
    const data = await registerUser("client", pref);
    if (!data) return;
    login(data.user, data.token);
    setLocation("/");
  };

  // ── Salon register ────────────────────────────────────────────────────────
  const handleSalonRegister = async () => {
    if (!salonName.trim() || !salonCity.trim()) return;
    const data = await registerUser("salon_owner", "all");
    if (!data) return;
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
    } catch { /* non-fatal */ }
    login(data.user, data.token);
    setLocation("/salon/dashboard");
  };

  // ── Pro register ──────────────────────────────────────────────────────────
  const handleProRegister = async () => {
    if (!proCategory || proServices.length === 0) return;
    const data = await registerUser("professional", "all");
    if (!data) return;
    try {
      await fetch(`${API_BASE}/auth/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.token}` },
        body: JSON.stringify({ bio: JSON.stringify({ category: proCategory, services: proServices }) }),
      });
    } catch { /* non-fatal */ }
    login(data.user, data.token);
    setLocation("/pro/requests");
  };

  // ── Phone-only sign in ────────────────────────────────────────────────────
  const handleSignIn = async () => {
    if (signinPhone.length < 8) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/phone-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formatPhone(signinPhone) }),
      });
      if (res.ok) {
        const data = await res.json();
        login(data.user, data.token);
        if (data.user.role === "client") setLocation("/");
        else if (data.user.role === "salon_owner") setLocation("/salon/dashboard");
        else setLocation("/pro/requests");
      } else {
        toast({ title: "Phone not found", description: "Create an account first", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (svc: string) =>
    setProServices(prev => prev.includes(svc) ? prev.filter(s => s !== svc) : [...prev, svc]);

  const credentialsValid = name.trim().length >= 2 && email.includes("@") && phone.length >= 8;

  return (
    <div className="min-h-[100dvh] bg-[#090013] flex flex-col items-center justify-start p-6 relative overflow-hidden overflow-y-auto">
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#00B4FF]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-[#FF1F8E]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-0 w-[300px] h-[300px] bg-[#9B30FF]/8 rounded-full blur-[100px] pointer-events-none" />

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
          <p className="text-[#00B4FF] font-bold mt-1 text-xs uppercase tracking-[0.25em]">On-demand grooming</p>
          <div className="mt-4 space-y-0.5">
            <p className="text-3xl font-black leading-none tracking-tight"
              style={{
                background: "linear-gradient(90deg,#00B4FF 0%,#FF1F8E 50%,#9B30FF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
              Look fresh.
            </p>
            <p className="text-3xl font-black leading-none tracking-tight text-white">
              Book like a boss.
            </p>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22 }}
            className="space-y-5">

            {/* Back button */}
            {step !== "role" && (
              <button onClick={handleBack}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-bold">
                <ArrowLeft size={16} /> Back
              </button>
            )}

            {/* ══ ROLE PICKER ══════════════════════════════════════════════════ */}
            {step === "role" && (
              <>
                <div>
                  <p className="text-white text-3xl font-black mb-1.5 leading-tight">Who are you?</p>
                  <p className="text-gray-500 text-sm">Choose how you want to use Tawoss</p>
                </div>

                <div className="space-y-3 pt-1">
                  {ROLE_OPTIONS.map((opt, i) => (
                    <motion.button
                      key={opt.role}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07, duration: 0.3 }}
                      onClick={() => handleRoleSelect(opt.role)}
                      className="w-full rounded-3xl p-5 text-left transition-all active:scale-[0.98] group relative overflow-hidden"
                      style={{ background: opt.gradient, border: `1.5px solid ${opt.border}`, boxShadow: `0 0 24px ${opt.glow}` }}>
                      {/* Glow spot */}
                      <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-30 pointer-events-none"
                        style={{ background: opt.accent, transform: "translate(30%,-30%)" }} />
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                          style={{ background: `${opt.accent}20`, border: `1px solid ${opt.accent}40` }}>
                          {opt.emoji}
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-xl font-black leading-tight">{opt.label}</p>
                          <p className="text-gray-400 text-sm mt-0.5">{opt.sub}</p>
                        </div>
                        <ChevronRight size={20} style={{ color: opt.accent }} className="flex-shrink-0" />
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Sign in link */}
                <div className="pt-2 text-center">
                  <button onClick={() => setStep("signin")}
                    className="text-gray-500 text-sm hover:text-gray-300 transition-colors">
                    Already have an account?{" "}
                    <span className="text-[#00B4FF] font-bold">Sign in →</span>
                  </button>
                </div>
              </>
            )}

            {/* ══ CREDENTIALS ══════════════════════════════════════════════════ */}
            {step === "credentials" && (
              <>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">
                      {ROLE_OPTIONS.find(r => r.role === chosenRole)?.emoji}
                    </span>
                    <p className="text-white text-2xl font-black">Create your account</p>
                  </div>
                  <p className="text-gray-500 text-sm">Quick setup — just 3 fields</p>
                </div>

                {/* Name */}
                <div>
                  <label className="text-gray-400 text-xs uppercase tracking-widest font-bold block mb-2">Full Name</label>
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-4 focus-within:border-[#00B4FF] transition-colors">
                    <User size={18} className="text-[#00B4FF] flex-shrink-0" />
                    <input type="text" placeholder="Ahmed Benali" value={name}
                      onChange={e => setName(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && email && phone.length >= 8 && handleCredentialsContinue()}
                      className="bg-transparent text-white font-bold flex-1 outline-none placeholder:text-gray-600"
                      autoFocus />
                  </div>
                </div>

                {/* Gmail */}
                <div>
                  <label className="text-gray-400 text-xs uppercase tracking-widest font-bold block mb-2">Gmail Address</label>
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-4 focus-within:border-[#00B4FF] transition-colors">
                    <Mail size={18} className="text-[#00B4FF] flex-shrink-0" />
                    <input type="email" placeholder="you@gmail.com" value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="bg-transparent text-white font-bold flex-1 outline-none placeholder:text-gray-600" />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="text-gray-400 text-xs uppercase tracking-widest font-bold block mb-2">Phone Number</label>
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-4 focus-within:border-[#00B4FF] transition-colors">
                    <Phone size={18} className="text-[#00B4FF] flex-shrink-0" />
                    <input type="tel" placeholder="0612 345 678" value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="bg-transparent text-white font-bold flex-1 outline-none placeholder:text-gray-600" />
                  </div>
                </div>

                <button onClick={handleCredentialsContinue} disabled={!credentialsValid || loading}
                  className="w-full text-black font-black text-xl rounded-2xl py-5 flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
                  style={{
                    background: chosenRole === "client" ? "#00B4FF"
                      : chosenRole === "salon_owner" ? "linear-gradient(135deg,#9B30FF,#00B4FF)"
                      : "#FF1F8E",
                    boxShadow: `0 0 24px ${ROLE_OPTIONS.find(r => r.role === chosenRole)?.glow ?? "transparent"}`,
                    color: "#fff",
                  }}>
                  Continue <ChevronRight size={22} />
                </button>

                <p className="text-center text-gray-600 text-xs">
                  Already registered?{" "}
                  <button onClick={() => setStep("signin")} className="text-[#00B4FF] font-bold">Sign in with phone</button>
                </p>
              </>
            )}

            {/* ══ SIGN IN ═══════════════════════════════════════════════════════ */}
            {step === "signin" && (
              <>
                <div>
                  <p className="text-white text-2xl font-black mb-1">Welcome back</p>
                  <p className="text-gray-500 text-sm">Enter your phone number to continue</p>
                </div>
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-4 focus-within:border-[#00B4FF] transition-colors">
                  <Phone size={20} className="text-[#00B4FF] flex-shrink-0" />
                  <input type="tel" placeholder="0612 345 678" value={signinPhone}
                    onChange={e => setSigninPhone(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSignIn()}
                    className="bg-transparent text-white text-xl font-bold flex-1 outline-none placeholder:text-gray-600"
                    autoFocus />
                </div>
                <button onClick={handleSignIn} disabled={signinPhone.length < 8 || loading}
                  className="w-full bg-[#00B4FF] disabled:opacity-40 text-black font-black text-xl rounded-2xl py-5 flex items-center justify-center gap-2">
                  {loading ? "Signing in…" : <>Sign In <ChevronRight size={22} /></>}
                </button>
                <p className="text-center text-gray-500 text-sm">
                  New here?{" "}
                  <button onClick={() => setStep("role")} className="text-[#FF1F8E] font-bold">Create account →</button>
                </p>
              </>
            )}

            {/* ══ CLIENT PREF ═══════════════════════════════════════════════════ */}
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
                {loading && <p className="text-center text-gray-400 text-sm animate-pulse">Setting up your account…</p>}
              </>
            )}

            {/* ══ SALON INFO ════════════════════════════════════════════════════ */}
            {step === "salon_info" && (
              <>
                <div>
                  <p className="text-white text-2xl font-black mb-1">Your salon details</p>
                  <p className="text-gray-500 text-sm">Clients will see this on the map</p>
                </div>

                <div>
                  <label className="text-gray-400 text-xs uppercase tracking-widest font-bold block mb-2">Salon / Spa Name *</label>
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-4 focus-within:border-[#9B30FF] transition-colors">
                    <Building2 size={18} className="text-[#9B30FF] flex-shrink-0" />
                    <input type="text" placeholder="Barber House Maarif" value={salonName}
                      onChange={e => setSalonName(e.target.value)}
                      className="bg-transparent text-white font-bold flex-1 outline-none placeholder:text-gray-600" autoFocus />
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 text-xs uppercase tracking-widest font-bold block mb-2">City / Neighbourhood *</label>
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-4 focus-within:border-[#9B30FF] transition-colors">
                    <MapPin size={18} className="text-[#9B30FF] flex-shrink-0" />
                    <input type="text" placeholder="Casablanca, Maarif" value={salonCity}
                      onChange={e => setSalonCity(e.target.value)}
                      className="bg-transparent text-white font-bold flex-1 outline-none placeholder:text-gray-600" />
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 text-xs uppercase tracking-widest font-bold block mb-2">
                    Street Address <span className="text-gray-600 normal-case font-normal">(optional)</span>
                  </label>
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-4 focus-within:border-[#9B30FF] transition-colors">
                    <MapPin size={18} className="text-gray-600 flex-shrink-0" />
                    <input type="text" placeholder="12 Rue Oum Rabie" value={salonAddress}
                      onChange={e => setSalonAddress(e.target.value)}
                      className="bg-transparent text-white font-bold flex-1 outline-none placeholder:text-gray-600" />
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 text-xs uppercase tracking-widest font-bold block mb-2">
                    Salon Phone <span className="text-gray-600 normal-case font-normal">(optional)</span>
                  </label>
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

            {/* ══ SALON CATEGORY ════════════════════════════════════════════════ */}
            {step === "salon_category" && (
              <>
                <div>
                  <p className="text-white text-2xl font-black mb-1">Who do you serve?</p>
                  <p className="text-gray-500 text-sm">This helps clients find the right salon</p>
                </div>
                <div className="space-y-3">
                  {SALON_CATS.map(cat => (
                    <button key={cat.id}
                      onClick={() => setSalonCat(cat.id as "men" | "women" | "both")}
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

            {/* ══ PRO CATEGORY ══════════════════════════════════════════════════ */}
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
                  className="w-full disabled:opacity-40 text-white font-black text-xl rounded-2xl py-5 flex items-center justify-center gap-2"
                  style={{ background: "#FF1F8E", boxShadow: "0 0 24px rgba(255,31,142,0.35)" }}>
                  Continue <ChevronRight size={22} />
                </button>
              </>
            )}

            {/* ══ PRO SERVICES ══════════════════════════════════════════════════ */}
            {step === "pro_services" && (
              <>
                <div>
                  <p className="text-white text-2xl font-black mb-1">Services you offer</p>
                  <p className="text-gray-500 text-sm">Select all that apply — clients will see these</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(PRO_SERVICES[proCategory] ?? []).map(svc => {
                    const sel = proServices.includes(svc);
                    return (
                      <button key={svc} onClick={() => toggleService(svc)}
                        className="px-4 py-2 rounded-full border-2 text-sm font-bold transition-all flex items-center gap-1.5"
                        style={{
                          background: sel ? "rgba(255,31,142,0.15)" : "rgba(255,255,255,0.04)",
                          borderColor: sel ? "#FF1F8E" : "rgba(255,255,255,0.10)",
                          color: sel ? "#FF1F8E" : "#9ca3af",
                          boxShadow: sel ? "0 0 10px rgba(255,31,142,0.2)" : "none",
                        }}>
                        {sel && <Check size={12} />}
                        {svc}
                      </button>
                    );
                  })}
                </div>
                <button onClick={handleProRegister} disabled={proServices.length === 0 || loading}
                  className="w-full disabled:opacity-40 text-white font-black text-xl rounded-2xl py-5 flex items-center justify-center gap-2"
                  style={{ background: "#FF1F8E", boxShadow: "0 0 24px rgba(255,31,142,0.35)" }}>
                  {loading ? "Creating your account…" : <>Start Taking Jobs <ChevronRight size={22} /></>}
                </button>
              </>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
