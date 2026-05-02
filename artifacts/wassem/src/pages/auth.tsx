import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Phone, User, Scissors, ChevronRight, ArrowLeft } from "lucide-react";

const API_BASE = "/api";

type Step = "phone" | "name" | "role";

export default function AuthPage() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"client" | "professional">("client");
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

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
        setLocation(data.user.role === "client" ? "/" : "/pro/requests");
      } else if (res.status === 404) {
        setIsNewUser(true);
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

  const handleRegister = async (selectedRole: "client" | "professional") => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/phone-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formatPhone(phone), name, role: selectedRole }),
      });
      if (res.ok) {
        const data = await res.json();
        login(data.user, data.token);
        setLocation(selectedRole === "client" ? "/" : "/pro/requests");
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
    <div className="min-h-[100dvh] bg-[#0A0A0A] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#00C1FF]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-[#FF00FF]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm z-10">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-[#00C1FF] to-[#FF00FF] shadow-[0_0_40px_rgba(0,193,255,0.4)] mb-6">
            <Scissors className="text-white" size={36} />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tight">WASSEM</h1>
          <p className="text-[#00C1FF] font-bold mt-2 text-lg">On-demand grooming</p>
        </div>

        {/* Step: Phone */}
        {step === "phone" && (
          <div className="space-y-6">
            <div>
              <p className="text-white text-2xl font-black mb-1">Your phone number</p>
              <p className="text-gray-500 text-sm">We'll find or create your account</p>
            </div>
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-4 focus-within:border-[#00C1FF] transition-colors">
              <Phone size={20} className="text-[#00C1FF] flex-shrink-0" />
              <input
                type="tel"
                placeholder="0612 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePhoneSubmit()}
                className="bg-transparent text-white text-xl font-bold flex-1 outline-none placeholder:text-gray-600"
                autoFocus
              />
            </div>
            <button
              onClick={handlePhoneSubmit}
              disabled={phone.length < 8 || loading}
              className="w-full bg-[#00C1FF] hover:bg-[#00a8e0] disabled:opacity-40 text-black font-black text-xl rounded-2xl py-5 transition-all shadow-[0_0_30px_rgba(0,193,255,0.4)] flex items-center justify-center gap-2"
            >
              {loading ? "..." : <>Continue <ChevronRight size={22} /></>}
            </button>
          </div>
        )}

        {/* Step: Name */}
        {step === "name" && (
          <div className="space-y-6">
            <button onClick={() => setStep("phone")} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-2">
              <ArrowLeft size={18} /> Back
            </button>
            <div>
              <p className="text-white text-2xl font-black mb-1">What's your name?</p>
              <p className="text-gray-500 text-sm">Just your first name is fine</p>
            </div>
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-4 focus-within:border-[#00C1FF] transition-colors">
              <User size={20} className="text-[#00C1FF] flex-shrink-0" />
              <input
                type="text"
                placeholder="Ahmed"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && name.length >= 2 && setStep("role")}
                className="bg-transparent text-white text-xl font-bold flex-1 outline-none placeholder:text-gray-600"
                autoFocus
              />
            </div>
            <button
              onClick={() => setStep("role")}
              disabled={name.length < 2 || loading}
              className="w-full bg-[#00C1FF] hover:bg-[#00a8e0] disabled:opacity-40 text-black font-black text-xl rounded-2xl py-5 transition-all shadow-[0_0_30px_rgba(0,193,255,0.4)] flex items-center justify-center gap-2"
            >
              Continue <ChevronRight size={22} />
            </button>
          </div>
        )}

        {/* Step: Role */}
        {step === "role" && (
          <div className="space-y-6">
            <button onClick={() => setStep("name")} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-2">
              <ArrowLeft size={18} /> Back
            </button>
            <div>
              <p className="text-white text-2xl font-black mb-1">I am a...</p>
              <p className="text-gray-500 text-sm">Choose how you want to use Wassem</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => handleRegister("client")}
                disabled={loading}
                className="w-full bg-white/5 hover:bg-[#00C1FF]/20 border-2 border-white/10 hover:border-[#00C1FF] text-left rounded-2xl p-5 transition-all group"
              >
                <div className="text-3xl mb-2">💈</div>
                <p className="text-white text-xl font-black group-hover:text-[#00C1FF]">I need a cut</p>
                <p className="text-gray-500 text-sm">Request grooming services at your price</p>
              </button>
              <button
                onClick={() => handleRegister("professional")}
                disabled={loading}
                className="w-full bg-white/5 hover:bg-[#FF00FF]/20 border-2 border-white/10 hover:border-[#FF00FF] text-left rounded-2xl p-5 transition-all group"
              >
                <div className="text-3xl mb-2">✂️</div>
                <p className="text-white text-xl font-black group-hover:text-[#FF00FF]">I'm a professional</p>
                <p className="text-gray-500 text-sm">Accept jobs and set your own terms</p>
              </button>
            </div>
            {loading && <p className="text-center text-gray-400 text-sm">Creating account...</p>}
          </div>
        )}
      </div>
    </div>
  );
}
