import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateJob } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Minus, Plus, MapPin, ChevronRight } from "lucide-react";

const SERVICES = [
  { id: "haircut", emoji: "💇", label: "Haircut", basePrice: 60 },
  { id: "beard", emoji: "🧔", label: "Beard Trim", basePrice: 40 },
  { id: "nails", emoji: "💅", label: "Nails", basePrice: 50 },
  { id: "full_grooming", emoji: "✨", label: "Full Package", basePrice: 150 },
];

export default function RequestService() {
  const [, setLocation] = useLocation();
  const [service, setService] = useState("haircut");
  const [price, setPrice] = useState(60);
  const [location, setLocation2] = useState("Casablanca, Maarif");
  const [step, setStep] = useState<"service" | "price">("service");
  const { toast } = useToast();
  const createJob = useCreateJob();

  const selectedService = SERVICES.find((s) => s.id === service)!;

  const handleServicePick = (svc: typeof SERVICES[0]) => {
    setService(svc.id);
    setPrice(svc.basePrice);
    setStep("price");
  };

  const handleSubmit = () => {
    createJob.mutate(
      { data: { service: service as any, budget: price, location: location } },
      {
        onSuccess: (job) => {
          toast({ title: "Request sent!", description: "Waiting for barbers to respond..." });
          setLocation(`/match/${job.id}`);
        },
        onError: () => toast({ title: "Failed to post request", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="min-h-[100dvh] bg-[#090013] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 pt-safe-top pt-5 pb-4">
        <button
          onClick={() => step === "price" ? setStep("service") : setLocation("/")}
          className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-white font-black text-xl">
            {step === "service" ? "What do you need?" : "Set your price"}
          </h1>
          <p className="text-gray-500 text-sm">
            {step === "service" ? "Pick a service" : "Barbers will see your offer"}
          </p>
        </div>
      </div>

      <div className="flex-1 px-5 pb-32">
        {step === "service" ? (
          <div className="grid grid-cols-2 gap-3 mt-4">
            {SERVICES.map((svc) => (
              <button
                key={svc.id}
                onClick={() => handleServicePick(svc)}
                className="bg-white/5 hover:bg-[#00B4FF]/10 border-2 border-white/10 hover:border-[#00B4FF] rounded-3xl p-6 text-left transition-all active:scale-95 group"
              >
                <div className="text-4xl mb-3">{svc.emoji}</div>
                <p className="text-white font-black text-lg group-hover:text-[#00B4FF]">{svc.label}</p>
                <p className="text-gray-500 text-sm mt-1">From {svc.basePrice} MAD</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-6 space-y-8">
            {/* Selected service recap */}
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4">
              <span className="text-3xl">{selectedService.emoji}</span>
              <div>
                <p className="text-white font-black">{selectedService.label}</p>
                <p className="text-gray-500 text-sm">Change service?{" "}
                  <button onClick={() => setStep("service")} className="text-[#00B4FF] underline">Go back</button>
                </p>
              </div>
            </div>

            {/* Price Setter — BIG */}
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-4 uppercase tracking-wider font-bold">Your Offer</p>
              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={() => setPrice((p) => Math.max(10, p - 10))}
                  className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-all"
                >
                  <Minus size={24} />
                </button>
                <div>
                  <span className="text-7xl font-black text-white">{price}</span>
                  <span className="text-3xl font-black text-gray-400 ml-2">MAD</span>
                </div>
                <button
                  onClick={() => setPrice((p) => p + 10)}
                  className="w-14 h-14 rounded-full bg-[#00B4FF] flex items-center justify-center text-black hover:bg-[#00b0e8] active:scale-95 transition-all shadow-[0_0_20px_rgba(0,193,255,0.4)]"
                >
                  <Plus size={24} />
                </button>
              </div>
              <p className="text-gray-500 text-sm mt-3">Barbers can counter-offer a different price</p>
            </div>

            {/* Location */}
            <div>
              <p className="text-gray-400 text-sm mb-2 uppercase tracking-wider font-bold">Your Location</p>
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-4 focus-within:border-[#00B4FF] transition-colors">
                <MapPin size={20} className="text-[#00B4FF] flex-shrink-0" />
                <input
                  value={location}
                  onChange={(e) => setLocation2(e.target.value)}
                  className="bg-transparent text-white font-bold flex-1 outline-none placeholder:text-gray-600"
                  placeholder="Your address"
                />
              </div>
            </div>

            {/* Price preview */}
            <div className="bg-gradient-to-r from-[#00B4FF]/10 to-[#FF1F8E]/10 border border-[#00B4FF]/20 rounded-2xl p-4 text-center">
              <p className="text-gray-400 text-sm">You're offering</p>
              <p className="text-white font-black text-2xl mt-1">
                {selectedService.label} for <span className="text-[#00B4FF]">{price} MAD</span>
              </p>
              <p className="text-gray-500 text-xs mt-1">Barbers nearby will see this and can respond</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Button */}
      {step === "price" && (
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#0A0A0A] to-transparent pb-safe-bottom">
          <button
            onClick={handleSubmit}
            disabled={createJob.isPending}
            className="w-full bg-[#00B4FF] hover:bg-[#00b0e8] disabled:opacity-40 text-black font-black text-xl rounded-2xl py-5 transition-all shadow-[0_0_30px_rgba(0,193,255,0.5)] flex items-center justify-center gap-2 active:scale-[0.97]"
          >
            {createJob.isPending ? "Posting..." : <>Send Request <ChevronRight size={22} /></>}
          </button>
        </div>
      )}
    </div>
  );
}
