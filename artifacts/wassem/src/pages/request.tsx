import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateJob } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Minus, Plus, MapPin, ChevronRight } from "lucide-react";

type Gender = "men" | "women";
type Step = "gender" | "service" | "price";

type Service = {
  id: string;
  emoji: string;
  label: string;
  basePrice: number;
  api: "haircut" | "beard" | "nails" | "full_grooming";
};

const MEN_SERVICES: Service[] = [
  { id: "haircut",       emoji: "✂️",  label: "Haircut",       basePrice: 60,  api: "haircut" },
  { id: "beard_trim",    emoji: "🧔",  label: "Beard Trim",    basePrice: 40,  api: "beard" },
  { id: "beard_style",   emoji: "💈",  label: "Beard Styling", basePrice: 55,  api: "beard" },
  { id: "mens_facial",   emoji: "🧖‍♂️", label: "Men's Facial",  basePrice: 120, api: "full_grooming" },
  { id: "coloring",      emoji: "🎨",  label: "Hair Coloring", basePrice: 90,  api: "haircut" },
  { id: "full_package",  emoji: "✨",  label: "Full Package",  basePrice: 180, api: "full_grooming" },
];

const WOMEN_SERVICES: Service[] = [
  { id: "haircut_style", emoji: "💇‍♀️", label: "Haircut & Style",  basePrice: 80,  api: "haircut" },
  { id: "hair_coloring", emoji: "🎨",   label: "Hair Coloring",     basePrice: 160, api: "haircut" },
  { id: "blowout",       emoji: "💨",   label: "Blowout",           basePrice: 70,  api: "haircut" },
  { id: "nails",         emoji: "💅",   label: "Nails",             basePrice: 60,  api: "nails" },
  { id: "womens_facial", emoji: "🧖‍♀️",  label: "Facial",            basePrice: 130, api: "full_grooming" },
  { id: "waxing",        emoji: "🌸",   label: "Waxing",            basePrice: 80,  api: "full_grooming" },
  { id: "full_package",  emoji: "✨",   label: "Full Package",      basePrice: 260, api: "full_grooming" },
];

const GENDER_META: Record<Gender, { label: string; emoji: string; tag: string; accent: string; grad: string }> = {
  men: {
    label: "Men",
    emoji: "👨",
    tag: "Haircut · Beard · Facial",
    accent: "#00B4FF",
    grad: "linear-gradient(135deg,rgba(0,180,255,0.18),rgba(155,48,255,0.10))",
  },
  women: {
    label: "Women",
    emoji: "👩",
    tag: "Hair · Nails · Facial",
    accent: "#FF1F8E",
    grad: "linear-gradient(135deg,rgba(255,31,142,0.18),rgba(155,48,255,0.10))",
  },
};

export default function RequestService() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>("gender");
  const [gender, setGender] = useState<Gender | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [price, setPrice] = useState(60);
  const [loc, setLoc] = useState("Casablanca, Maarif");
  const { toast } = useToast();
  const createJob = useCreateJob();

  const services = gender === "men" ? MEN_SERVICES : WOMEN_SERVICES;
  const genderMeta = gender ? GENDER_META[gender] : null;

  const handleGenderPick = (g: Gender) => {
    setGender(g);
    setService(null);
    setStep("service");
  };

  const handleServicePick = (svc: Service) => {
    setService(svc);
    setPrice(svc.basePrice);
    setStep("price");
  };

  const handleBack = () => {
    if (step === "price") { setStep("service"); return; }
    if (step === "service") { setStep("gender"); return; }
    setLocation("/");
  };

  const handleSubmit = () => {
    if (!service) return;
    createJob.mutate(
      { data: { service: service.api as any, budget: price, location: loc } },
      {
        onSuccess: (job) => {
          toast({ title: "Request sent!", description: "Waiting for barbers to respond..." });
          setLocation(`/match/${job.id}`);
        },
        onError: () => toast({ title: "Failed to post request", variant: "destructive" }),
      }
    );
  };

  const stepTitle: Record<Step, string> = {
    gender: "Who is it for?",
    service: "What do you need?",
    price: "Set your price",
  };
  const stepSub: Record<Step, string> = {
    gender: "We'll show the right services for you",
    service: `${gender ? GENDER_META[gender].label + "'s services" : "Pick a service"}`,
    price: "Barbers will see your offer",
  };

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: "#090013" }}>

      {/* ── Header ── */}
      <div className="flex items-center gap-4 px-5 pt-safe-top pt-5 pb-4">
        <button
          onClick={handleBack}
          className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-white font-black text-xl">{stepTitle[step]}</h1>
          <p className="text-gray-500 text-sm">{stepSub[step]}</p>
        </div>

        {/* Step pill */}
        <div className="ml-auto flex items-center gap-1.5">
          {(["gender", "service", "price"] as Step[]).map((s, i) => (
            <div
              key={s}
              className="rounded-full transition-all"
              style={{
                width: step === s ? 20 : 6,
                height: 6,
                background: step === s
                  ? (genderMeta?.accent ?? "#00B4FF")
                  : "rgba(255,255,255,0.15)",
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 px-5 pb-32">

        {/* ── Step 1: Gender ── */}
        {step === "gender" && (
          <div className="mt-6 space-y-4">
            <p className="text-gray-600 text-xs uppercase tracking-widest font-bold text-center mb-6">
              Choose your category
            </p>
            <div className="grid grid-cols-2 gap-4">
              {(["men", "women"] as Gender[]).map(g => {
                const m = GENDER_META[g];
                return (
                  <button
                    key={g}
                    onClick={() => handleGenderPick(g)}
                    className="rounded-3xl border-2 border-white/10 hover:border-white/30 p-6 flex flex-col items-center text-center transition-all active:scale-95 group"
                    style={{ background: m.grad, minHeight: 180 }}
                  >
                    <span className="text-6xl mb-4 group-hover:scale-110 transition-transform">{m.emoji}</span>
                    <p className="text-white font-black text-xl mb-1">{m.label}</p>
                    <p className="text-gray-400 text-xs leading-relaxed">{m.tag}</p>
                    <div className="mt-4 px-4 py-1.5 rounded-full text-xs font-black"
                      style={{ background: `${m.accent}22`, color: m.accent, border: `1px solid ${m.accent}44` }}>
                      {g === "men" ? "6 services" : "7 services"}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick hint */}
            <p className="text-center text-gray-700 text-xs mt-4">
              We'll show services that match your choice
            </p>
          </div>
        )}

        {/* ── Step 2: Service grid ── */}
        {step === "service" && genderMeta && (
          <div className="mt-2">
            {/* Gender badge */}
            <div className="flex items-center gap-2 mb-5">
              <span className="text-2xl">{genderMeta.emoji}</span>
              <span className="px-3 py-1 rounded-full text-xs font-black"
                style={{ background: `${genderMeta.accent}18`, color: genderMeta.accent, border: `1px solid ${genderMeta.accent}35` }}>
                {genderMeta.label}'s Services
              </span>
              <button onClick={() => setStep("gender")} className="ml-auto text-xs text-gray-600 underline hover:text-gray-400">
                Change
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {services.map((svc) => (
                <button
                  key={svc.id}
                  onClick={() => handleServicePick(svc)}
                  className="rounded-3xl p-5 text-left transition-all active:scale-95 group border-2"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    borderColor: "rgba(255,255,255,0.08)",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = `${genderMeta.accent}14`;
                    (e.currentTarget as HTMLElement).style.borderColor = `${genderMeta.accent}55`;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                  }}
                >
                  <div className="text-3xl mb-3">{svc.emoji}</div>
                  <p className="text-white font-black text-sm leading-tight">{svc.label}</p>
                  <p className="text-gray-500 text-xs mt-1.5">From {svc.basePrice} MAD</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 3: Price ── */}
        {step === "price" && service && genderMeta && (
          <div className="mt-6 space-y-8">

            {/* Service recap pill */}
            <div className="flex items-center gap-4 rounded-2xl p-4 border"
              style={{ background: `${genderMeta.accent}0D`, borderColor: `${genderMeta.accent}30` }}>
              <span className="text-3xl">{service.emoji}</span>
              <div className="flex-1">
                <p className="text-white font-black">{service.label}</p>
                <p className="text-gray-500 text-sm">
                  {genderMeta.label}'s service ·{" "}
                  <button onClick={() => setStep("service")} style={{ color: genderMeta.accent }} className="underline">
                    Change
                  </button>
                </p>
              </div>
            </div>

            {/* Price setter */}
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-4 uppercase tracking-wider font-bold">Your Offer</p>
              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={() => setPrice(p => Math.max(10, p - 10))}
                  className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-all"
                >
                  <Minus size={24} />
                </button>
                <div>
                  <span className="text-7xl font-black text-white">{price}</span>
                  <span className="text-3xl font-black text-gray-400 ml-2">MAD</span>
                </div>
                <button
                  onClick={() => setPrice(p => p + 10)}
                  className="w-14 h-14 rounded-full flex items-center justify-center text-black font-black text-2xl active:scale-95 transition-all"
                  style={{ background: genderMeta.accent, boxShadow: `0 0 20px ${genderMeta.accent}55` }}
                >
                  <Plus size={24} />
                </button>
              </div>
              <p className="text-gray-500 text-sm mt-3">Barbers can counter-offer a different price</p>
            </div>

            {/* Location */}
            <div>
              <p className="text-gray-400 text-sm mb-2 uppercase tracking-wider font-bold">Your Location</p>
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-4 focus-within:border-white/30 transition-colors">
                <MapPin size={20} style={{ color: genderMeta.accent }} className="flex-shrink-0" />
                <input
                  value={loc}
                  onChange={e => setLoc(e.target.value)}
                  className="bg-transparent text-white font-bold flex-1 outline-none placeholder:text-gray-600"
                  placeholder="Your address"
                />
              </div>
            </div>

            {/* Summary card */}
            <div className="rounded-2xl p-4 text-center border"
              style={{
                background: `linear-gradient(135deg,${genderMeta.accent}12,rgba(155,48,255,0.08))`,
                borderColor: `${genderMeta.accent}25`,
              }}>
              <p className="text-gray-400 text-sm">You're offering</p>
              <p className="text-white font-black text-2xl mt-1">
                {service.label} for{" "}
                <span style={{ color: genderMeta.accent }}>{price} MAD</span>
              </p>
              <p className="text-gray-500 text-xs mt-1">Barbers nearby will see this and respond</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom CTA ── */}
      {step === "price" && service && genderMeta && (
        <div className="fixed bottom-0 left-0 right-0 p-5 pb-safe-bottom"
          style={{ background: "linear-gradient(to top,#090013 60%,transparent)" }}>
          <button
            onClick={handleSubmit}
            disabled={createJob.isPending}
            className="w-full disabled:opacity-40 text-black font-black text-xl rounded-2xl py-5 transition-all flex items-center justify-center gap-2 active:scale-[0.97]"
            style={{
              background: `linear-gradient(135deg,${genderMeta.accent},#9B30FF)`,
              boxShadow: `0 0 30px ${genderMeta.accent}50`,
            }}
          >
            {createJob.isPending ? "Posting..." : <>Send Request <ChevronRight size={22} /></>}
          </button>
        </div>
      )}
    </div>
  );
}
