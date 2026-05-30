import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Phone, User, ChevronRight, ArrowLeft } from "lucide-react";

const API_BASE = "/api";
type Step = "phone" | "name" | "role" | "pref";

// Tawoss brand colors
const PURPLE = "#5B0EA6";
const GOLD   = "#C9A227";

export default function AuthPage() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [selectedRole, setSelectedRole] = useState<"client" | "professional" | "salon_owner" | null>(null);
  const [genderPref, setGenderPref] = useState<"men" | "women" | "all">("all");
  const [loading, setLoading] = useState(false);

  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, "");
    return digits.startsWith("0") ? `+212${digits.slice(1)}` : `+${digits}`;
  };

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

  const handleRoleSelect = (role: "client" | "professional" | "salon_owner") => {
    setSelectedRole(role);
    if (role === "client") {
      setStep("pref");
    } else {
      handleRegister(role, "all");
    }
  };

  const handleRegister = async (role: "client" | "professional" | "salon_owner", pref: "men" | "women" | "all") => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/phone-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formatPhone(phone), name, role, gender_pref: pref }),
      });
      if (res.ok) {
        const data = await res.json();
        login(data.user, data.token);
        if (role === "client") setLocation("/");
        else if (role === "salon_owner") setLocation("/salon/dashboard");
        else setLocation("/pro/requests");
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message || "Registration failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ background: `radial-gradient(ellipse 120% 100% at 50% 10%, #7B1FCC 0%, #5B0EA6 40%, #2D0060 100%)` }}
    >
      {/* Background glow orbs */}
      <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${GOLD}18 0%, transparent 70%)` }} />
      <div className="absolute bottom-[-60px] right-[-60px] w-[350px] h-[350px] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${PURPLE}60 0%, transparent 70%)` }} />

      {/* Decorative feather arcs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="absolute rounded-full"
            style={{
              width: `${120 + i * 60}px`,
              height: `${120 + i * 60}px`,
              border: `1px solid ${GOLD}${Math.round(14 - i * 2).toString(16).padStart(2, "0")}`,
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
            }} />
        ))}
      </div>

      <div className="w-full max-w-sm z-10">
        {/* ── Logo / Hero ── */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Mascot */}
          <motion.div
            className="inline-block mb-4"
            animate={{ y: [0, -8, 0], scale: [1, 1.03, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="relative inline-block">
              <div className="absolute inset-0 rounded-full"
                style={{ boxShadow: `0 0 40px 15px ${GOLD}35`, borderRadius: "50%" }} />
              <img
                src="/tawoss-mascot.png"
                alt="Tawoss"
                className="relative w-24 h-24 object-contain"
                style={{ filter: `drop-shadow(0 4px 16px ${PURPLE}80)` }}
              />
            </div>
          </motion.div>

          <motion.h1
            className="text-5xl font-black tracking-[0.12em] mb-1"
            style={{
              background: `linear-gradient(135deg, ${GOLD} 0%, #E8C84A 50%, ${GOLD} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
            initial={{ opacity: 0, letterSpacing: "0.3em" }}
            animate={{ opacity: 1, letterSpacing: "0.12em" }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            TAWOSS
          </motion.h1>
          <motion.p
            className="font-bold text-base"
            style={{ color: `${GOLD}CC` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            On-demand grooming
          </motion.p>
        </motion.div>

        {/* ── Step: Phone ── */}
        {step === "phone" && (
          <motion.div
            className="space-y-5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div>
              <p className="text-white text-2xl font-black mb-1">Your phone number</p>
              <p className="text-sm" style={{ color: `${GOLD}80` }}>We'll find or create your account</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl px-4 py-4 focus-within:ring-2 transition-all"
              style={{ background: "rgba(255,255,255,0.07)", border: `1px solid ${GOLD}30`, outline: "none" }}>
              <Phone size={20} style={{ color: GOLD }} className="flex-shrink-0" />
              <input
                type="tel" placeholder="0612 345 678" value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handlePhoneSubmit()}
                className="bg-transparent text-white text-xl font-bold flex-1 outline-none placeholder:text-white/25"
                autoFocus
              />
            </div>
            <motion.button
              onClick={handlePhoneSubmit}
              disabled={phone.length < 8 || loading}
              className="w-full font-black text-xl rounded-2xl py-5 flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
              style={{
                background: `linear-gradient(135deg, ${GOLD}, #B8891A)`,
                color: "#1a0040",
                boxShadow: `0 0 30px ${GOLD}40`,
              }}
              whileTap={{ scale: 0.97 }}
            >
              {loading ? "..." : <>Continue <ChevronRight size={22} /></>}
            </motion.button>
          </motion.div>
        )}

        {/* ── Step: Name ── */}
        {step === "name" && (
          <motion.div
            className="space-y-5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
          >
            <button onClick={() => setStep("phone")}
              className="flex items-center gap-2 transition-colors"
              style={{ color: `${GOLD}80` }}>
              <ArrowLeft size={18} /> Back
            </button>
            <div>
              <p className="text-white text-2xl font-black mb-1">What's your name?</p>
              <p className="text-sm" style={{ color: `${GOLD}80` }}>Just your first name is fine</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl px-4 py-4 transition-all"
              style={{ background: "rgba(255,255,255,0.07)", border: `1px solid ${GOLD}30` }}>
              <User size={20} style={{ color: GOLD }} className="flex-shrink-0" />
              <input
                type="text" placeholder="Ahmed" value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && name.length >= 2 && setStep("role")}
                className="bg-transparent text-white text-xl font-bold flex-1 outline-none placeholder:text-white/25"
                autoFocus
              />
            </div>
            <motion.button
              onClick={() => setStep("role")}
              disabled={name.length < 2}
              className="w-full font-black text-xl rounded-2xl py-5 flex items-center justify-center gap-2 disabled:opacity-40"
              style={{
                background: `linear-gradient(135deg, ${GOLD}, #B8891A)`,
                color: "#1a0040",
                boxShadow: `0 0 30px ${GOLD}40`,
              }}
              whileTap={{ scale: 0.97 }}
            >
              Continue <ChevronRight size={22} />
            </motion.button>
          </motion.div>
        )}

        {/* ── Step: Role ── */}
        {step === "role" && (
          <motion.div
            className="space-y-5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
          >
            <button onClick={() => setStep("name")}
              className="flex items-center gap-2 transition-colors"
              style={{ color: `${GOLD}80` }}>
              <ArrowLeft size={18} /> Back
            </button>
            <div>
              <p className="text-white text-2xl font-black mb-1">I am a…</p>
              <p className="text-sm" style={{ color: `${GOLD}80` }}>Choose how you want to use Tawoss</p>
            </div>
            <div className="space-y-3">
              {[
                { role: "client" as const,       emoji: "💈", label: "I need a service",     sub: "Book grooming at your price",           color: "#00f2ff" },
                { role: "professional" as const, emoji: "✂️", label: "I'm a barber / stylist", sub: "Accept jobs and set your own terms",   color: "#ff007f" },
                { role: "salon_owner" as const,  emoji: "🏠", label: "I own a salon / spa",   sub: "Manage chairs, services & products",    color: GOLD },
              ].map(opt => (
                <motion.button
                  key={opt.role}
                  onClick={() => handleRoleSelect(opt.role)}
                  disabled={loading}
                  className="w-full text-left rounded-2xl p-5 transition-all group"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: `1.5px solid rgba(255,255,255,0.08)`,
                  }}
                  whileHover={{ scale: 1.02, borderColor: opt.color, backgroundColor: `${opt.color}15` }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-3xl mb-2">{opt.emoji}</div>
                  <p className="text-white text-xl font-black">{opt.label}</p>
                  <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{opt.sub}</p>
                </motion.button>
              ))}
            </div>
            {loading && <p className="text-center text-sm" style={{ color: `${GOLD}80` }}>Creating account…</p>}
          </motion.div>
        )}

        {/* ── Step: Gender Preference ── */}
        {step === "pref" && (
          <motion.div
            className="space-y-5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
          >
            <button onClick={() => setStep("role")}
              className="flex items-center gap-2 transition-colors"
              style={{ color: `${GOLD}80` }}>
              <ArrowLeft size={18} /> Back
            </button>
            <div>
              <p className="text-white text-2xl font-black mb-1">Your grooming preference</p>
              <p className="text-sm" style={{ color: `${GOLD}80` }}>We'll personalise your feed and map</p>
            </div>
            <div className="space-y-3">
              {[
                { key: "men"   as const, emoji: "💈", label: "Men's Grooming",  sub: "Barbers, fades, beard care",        color: "#00f2ff" },
                { key: "women" as const, emoji: "💅", label: "Women's Beauty",  sub: "Nails, skincare, massage, styling", color: "#ff007f" },
                { key: "all"   as const, emoji: "✨", label: "All Services",    sub: "Show me everything",                color: GOLD },
              ].map(opt => (
                <motion.button
                  key={opt.key}
                  onClick={() => { setGenderPref(opt.key); handleRegister("client", opt.key); }}
                  disabled={loading}
                  className="w-full text-left rounded-2xl p-5 transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1.5px solid rgba(255,255,255,0.08)" }}
                  whileHover={{ scale: 1.02, borderColor: opt.color, backgroundColor: `${opt.color}15` }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-3xl mb-2">{opt.emoji}</div>
                  <p className="text-white text-xl font-black">{opt.label}</p>
                  <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{opt.sub}</p>
                </motion.button>
              ))}
            </div>
            {loading && <p className="text-center text-sm" style={{ color: `${GOLD}80` }}>Setting up your feed…</p>}
          </motion.div>
        )}
      </div>
    </div>
  );
}
