import { useState } from "react";
import { useLocation } from "wouter";
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
      setStep("pref"); // clients get gender pref step
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
    <div className="min-h-[100dvh] bg-[#1a0b2e] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#00f2ff]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-[#ff007f]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-[#00f2ff] to-[#ff007f] shadow-[0_0_40px_rgba(0,193,255,0.4)] mb-5">
            <span className="text-4xl">✂️</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tight">WASSEM</h1>
          <p className="text-[#00f2ff] font-bold mt-1 text-base">On-demand grooming</p>
        </div>

        {/* ── Step: Phone ── */}
        {step === "phone" && (
          <div className="space-y-5">
            <div>
              <p className="text-white text-2xl font-black mb-1">Your phone number</p>
              <p className="text-gray-500 text-sm">We'll find or create your account</p>
            </div>
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-4 focus-within:border-[#00f2ff] transition-colors">
              <Phone size={20} className="text-[#00f2ff] flex-shrink-0" />
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
              className="w-full bg-[#00f2ff] disabled:opacity-40 text-black font-black text-xl rounded-2xl py-5 transition-all shadow-[0_0_30px_rgba(0,193,255,0.4)] flex items-center justify-center gap-2"
            >
              {loading ? "..." : <>Continue <ChevronRight size={22} /></>}
            </button>
          </div>
        )}

        {/* ── Step: Name ── */}
        {step === "name" && (
          <div className="space-y-5">
            <button onClick={() => setStep("phone")} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={18} /> Back
            </button>
            <div>
              <p className="text-white text-2xl font-black mb-1">What's your name?</p>
              <p className="text-gray-500 text-sm">Just your first name is fine</p>
            </div>
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-4 focus-within:border-[#00f2ff] transition-colors">
              <User size={20} className="text-[#00f2ff] flex-shrink-0" />
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
              className="w-full bg-[#00f2ff] disabled:opacity-40 text-black font-black text-xl rounded-2xl py-5 transition-all shadow-[0_0_30px_rgba(0,193,255,0.4)] flex items-center justify-center gap-2"
            >
              Continue <ChevronRight size={22} />
            </button>
          </div>
        )}

        {/* ── Step: Role ── */}
        {step === "role" && (
          <div className="space-y-5">
            <button onClick={() => setStep("name")} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={18} /> Back
            </button>
            <div>
              <p className="text-white text-2xl font-black mb-1">I am a...</p>
              <p className="text-gray-500 text-sm">Choose how you want to use Wassem</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => handleRoleSelect("client")}
                disabled={loading}
                className="w-full bg-white/5 hover:bg-[#00f2ff]/20 border-2 border-white/10 hover:border-[#00f2ff] text-left rounded-2xl p-5 transition-all group"
              >
                <div className="text-3xl mb-2">💈</div>
                <p className="text-white text-xl font-black group-hover:text-[#00f2ff]">I need a service</p>
                <p className="text-gray-500 text-sm">Book grooming at your price</p>
              </button>
              <button
                onClick={() => handleRoleSelect("professional")}
                disabled={loading}
                className="w-full bg-white/5 hover:bg-[#ff007f]/20 border-2 border-white/10 hover:border-[#ff007f] text-left rounded-2xl p-5 transition-all group"
              >
                <div className="text-3xl mb-2">✂️</div>
                <p className="text-white text-xl font-black group-hover:text-[#ff007f]">I'm a barber / stylist</p>
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
            {loading && <p className="text-center text-gray-400 text-sm">Creating account...</p>}
          </div>
        )}

        {/* ── Step: Gender Preference (clients only) ── */}
        {step === "pref" && (
          <div className="space-y-5">
            <button onClick={() => setStep("role")} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={18} /> Back
            </button>
            <div>
              <p className="text-white text-2xl font-black mb-1">Your grooming preference</p>
              <p className="text-gray-500 text-sm">We'll personalise your feed and map</p>
            </div>
            <div className="space-y-3">
              {[
                {
                  key: "men" as const,
                  emoji: "💈",
                  label: "Men's Grooming",
                  sub: "Barbers, fades, beard care",
                  color: "#00f2ff",
                  hover: "hover:bg-[#00f2ff]/20 hover:border-[#00f2ff]",
                  text: "group-hover:text-[#00f2ff]",
                },
                {
                  key: "women" as const,
                  emoji: "💅",
                  label: "Women's Beauty",
                  sub: "Nails, skincare, massage, styling",
                  color: "#ff007f",
                  hover: "hover:bg-[#ff007f]/20 hover:border-[#ff007f]",
                  text: "group-hover:text-[#ff007f]",
                },
                {
                  key: "all" as const,
                  emoji: "✨",
                  label: "All Services",
                  sub: "Show me everything",
                  color: "#a855f7",
                  hover: "hover:bg-purple-500/20 hover:border-purple-500",
                  text: "group-hover:text-purple-400",
                },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => {
                    setGenderPref(opt.key);
                    handleRegister("client", opt.key);
                  }}
                  disabled={loading}
                  className={`w-full bg-white/5 ${opt.hover} border-2 border-white/10 text-left rounded-2xl p-5 transition-all group`}
                >
                  <div className="text-3xl mb-2">{opt.emoji}</div>
                  <p className={`text-white text-xl font-black ${opt.text}`}>{opt.label}</p>
                  <p className="text-gray-500 text-sm">{opt.sub}</p>
                </button>
              ))}
            </div>
            {loading && <p className="text-center text-gray-400 text-sm">Setting up your feed...</p>}
          </div>
        )}
      </div>
    </div>
  );
}
