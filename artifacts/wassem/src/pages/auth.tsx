import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Phone, User, ChevronRight, ArrowLeft } from "lucide-react";

const API_BASE = "/api";
type Step = "phone" | "name" | "role" | "pref";

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
    <div className="min-h-[100dvh] bg-[#090013] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#00B4FF]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-[#FF1F8E]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm z-10">
        {/* Logo */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <motion.div
            className="inline-block mb-5"
            animate={{ y: [0, -6, 0], scale: [1, 1.03, 1] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-[#00B4FF] to-[#FF1F8E] shadow-[0_0_40px_rgba(0,193,255,0.4)]">
              <img
                src="/tawoss-logo.png"
                alt="Tawoss"
                className="w-14 h-14 object-contain"
                style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.4))" }}
              />
            </div>
          </motion.div>
          <h1 className="text-5xl font-black text-white tracking-tight">TAWOSS</h1>
          <p className="text-[#00B4FF] font-bold mt-1 text-base">On-demand grooming</p>
        </motion.div>

        {/* ── Step: Phone ── */}
        {step === "phone" && (
          <motion.div
            className="space-y-5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div>
              <p className="text-white text-2xl font-black mb-1">Your phone number</p>
              <p className="text-gray-500 text-sm">We'll find or create your account</p>
            </div>
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-4 focus-within:border-[#00B4FF] transition-colors">
              <Phone size={20} className="text-[#00B4FF] flex-shrink-0" />
              <input
                type="tel" placeholder="0612 345 678" value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handlePhoneSubmit()}
                className="bg-transparent text-white text-xl font-bold flex-1 outline-none placeholder:text-gray-600"
                autoFocus
              />
            </div>
            <button
              onClick={handlePhoneSubmit}
              disabled={phone.length < 8 || loading}
              className="w-full bg-[#00B4FF] disabled:opacity-40 text-black font-black text-xl rounded-2xl py-5 transition-all shadow-[0_0_30px_rgba(0,193,255,0.4)] flex items-center justify-center gap-2"
            >
              {loading ? "..." : <>Continue <ChevronRight size={22} /></>}
            </button>
          </motion.div>
        )}

        {/* ── Step: Name ── */}
        {step === "name" && (
          <motion.div
            className="space-y-5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <button onClick={() => setStep("phone")} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={18} /> Back
            </button>
            <div>
              <p className="text-white text-2xl font-black mb-1">What's your name?</p>
              <p className="text-gray-500 text-sm">Just your first name is fine</p>
            </div>
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-4 focus-within:border-[#00B4FF] transition-colors">
              <User size={20} className="text-[#00B4FF] flex-shrink-0" />
              <input
                type="text" placeholder="Ahmed" value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && name.length >= 2 && setStep("role")}
                className="bg-transparent text-white text-xl font-bold flex-1 outline-none placeholder:text-gray-600"
                autoFocus
              />
            </div>
            <button
              onClick={() => setStep("role")}
              disabled={name.length < 2}
              className="w-full bg-[#00B4FF] disabled:opacity-40 text-black font-black text-xl rounded-2xl py-5 transition-all shadow-[0_0_30px_rgba(0,193,255,0.4)] flex items-center justify-center gap-2"
            >
              Continue <ChevronRight size={22} />
            </button>
          </motion.div>
        )}

        {/* ── Step: Role ── */}
        {step === "role" && (
          <motion.div
            className="space-y-5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <button onClick={() => setStep("name")} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={18} /> Back
            </button>
            <div>
              <p className="text-white text-2xl font-black mb-1">I am a…</p>
              <p className="text-gray-500 text-sm">Choose how you want to use Tawoss</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => handleRoleSelect("client")}
                disabled={loading}
                className="w-full bg-white/5 hover:bg-[#00B4FF]/20 border-2 border-white/10 hover:border-[#00B4FF] text-left rounded-2xl p-5 transition-all group"
              >
                <div className="text-3xl mb-2">💈</div>
                <p className="text-white text-xl font-black group-hover:text-[#00B4FF]">I need a service</p>
                <p className="text-gray-500 text-sm">Book grooming at your price</p>
              </button>
              <button
                onClick={() => handleRoleSelect("professional")}
                disabled={loading}
                className="w-full bg-white/5 hover:bg-[#FF1F8E]/20 border-2 border-white/10 hover:border-[#FF1F8E] text-left rounded-2xl p-5 transition-all group"
              >
                <div className="text-3xl mb-2">✂️</div>
                <p className="text-white text-xl font-black group-hover:text-[#FF1F8E]">I'm a barber / stylist</p>
                <p className="text-gray-500 text-sm">Accept jobs and set your own terms</p>
              </button>
              <button
                onClick={() => handleRoleSelect("salon_owner")}
                disabled={loading}
                className="w-full bg-white/5 hover:bg-yellow-500/20 border-2 border-white/10 hover:border-yellow-500 text-left rounded-2xl p-5 transition-all group"
              >
                <div className="text-3xl mb-2">🏠</div>
                <p className="text-white text-xl font-black group-hover:text-yellow-400">I own a salon / spa</p>
                <p className="text-gray-500 text-sm">Manage chairs, services & products</p>
              </button>
            </div>
            {loading && <p className="text-center text-gray-400 text-sm">Creating account…</p>}
          </motion.div>
        )}

        {/* ── Step: Gender Preference ── */}
        {step === "pref" && (
          <motion.div
            className="space-y-5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <button onClick={() => setStep("role")} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={18} /> Back
            </button>
            <div>
              <p className="text-white text-2xl font-black mb-1">Your grooming preference</p>
              <p className="text-gray-500 text-sm">We'll personalise your feed and map</p>
            </div>
            <div className="space-y-3">
              {[
                { key: "men"   as const, emoji: "💈", label: "Men's Grooming",  sub: "Barbers, fades, beard care",        hover: "hover:bg-[#00B4FF]/20 hover:border-[#00B4FF]", text: "group-hover:text-[#00B4FF]" },
                { key: "women" as const, emoji: "💅", label: "Women's Beauty",  sub: "Nails, skincare, massage, styling", hover: "hover:bg-[#FF1F8E]/20 hover:border-[#FF1F8E]", text: "group-hover:text-[#FF1F8E]" },
                { key: "all"   as const, emoji: "✨", label: "All Services",    sub: "Show me everything",                hover: "hover:bg-purple-500/20 hover:border-purple-500", text: "group-hover:text-purple-400" },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => { setGenderPref(opt.key); handleRegister("client", opt.key); }}
                  disabled={loading}
                  className={`w-full bg-white/5 ${opt.hover} border-2 border-white/10 text-left rounded-2xl p-5 transition-all group`}
                >
                  <div className="text-3xl mb-2">{opt.emoji}</div>
                  <p className={`text-white text-xl font-black ${opt.text}`}>{opt.label}</p>
                  <p className="text-gray-500 text-sm">{opt.sub}</p>
                </button>
              ))}
            </div>
            {loading && <p className="text-center text-gray-400 text-sm">Setting up your feed…</p>}
          </motion.div>
        )}
      </div>
    </div>
  );
}
