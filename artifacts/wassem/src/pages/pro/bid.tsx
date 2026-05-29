import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetJob, getGetJobQueryKey, useCreateBid } from "@workspace/api-client-react";
import { ArrowLeft, Clock, MapPin, Minus, Plus, Check, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SERVICE_EMOJI: Record<string, string> = {
  haircut: "💇",
  beard: "🧔",
  nails: "💅",
  full_grooming: "✨",
};

export default function ProBid() {
  const { jobId } = useParams<{ jobId: string }>();
  const id = parseInt(jobId, 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: job, isLoading } = useGetJob(id, {
    query: { enabled: !!id, queryKey: getGetJobQueryKey(id) },
  });

  const [mode, setMode] = useState<"accept" | "counter">("accept");
  const [counterPrice, setCounterPrice] = useState(0);
  const [eta, setEta] = useState("");

  const createBid = useCreateBid();

  const handleSubmit = () => {
    const price = mode === "accept" ? (job?.budget ?? 0) : counterPrice;
    createBid.mutate(
      { data: { jobId: id, price, estimatedArrival: eta || undefined } },
      {
        onSuccess: () => {
          toast({ title: "Bid sent!", description: "The client will see your offer." });
          setLocation("/pro/requests");
        },
        onError: (err: any) => {
          toast({ title: "Failed", description: err?.data?.message || "Try again", variant: "destructive" });
        },
      }
    );
  };

  if (isLoading || !job) {
    return (
      <div className="min-h-[100dvh] bg-[#0f051d] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#ff007f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#0f051d] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 pt-safe-top pt-5 pb-4">
        <button
          onClick={() => setLocation("/pro/requests")}
          className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-white font-black text-xl">Make Your Offer</h1>
          <p className="text-gray-500 text-sm">Choose how you want to respond</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-36 space-y-6">
        {/* Job card */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#ff007f]/10 border border-[#ff007f]/20 flex items-center justify-center text-2xl flex-shrink-0">
              {SERVICE_EMOJI[job.service] || "✂️"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-black text-lg capitalize">{job.service?.replace("_", " ")}</p>
              <div className="flex flex-wrap gap-x-3 text-sm text-gray-500 mt-1">
                <span className="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
                {job.scheduledTime && (
                  <span className="flex items-center gap-1"><Clock size={12} /> {new Date(job.scheduledTime).toLocaleString()}</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-white">{job.budget}</p>
              <p className="text-gray-500 text-sm">MAD offered</p>
            </div>
          </div>
        </div>

        {/* Mode selector */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMode("accept")}
            className={`rounded-2xl p-5 border-2 transition-all text-left ${
              mode === "accept"
                ? "bg-[#00f2ff]/10 border-[#00f2ff] shadow-[0_0_20px_rgba(0,193,255,0.2)]"
                : "bg-white/5 border-white/10"
            }`}
          >
            <Check size={24} className={mode === "accept" ? "text-[#00f2ff]" : "text-gray-500"} />
            <p className={`font-black text-lg mt-3 ${mode === "accept" ? "text-white" : "text-gray-400"}`}>Accept Price</p>
            <p className="text-gray-500 text-sm mt-1">{job.budget} MAD</p>
          </button>
          <button
            onClick={() => {
              setMode("counter");
              if (counterPrice === 0) setCounterPrice(job.budget);
            }}
            className={`rounded-2xl p-5 border-2 transition-all text-left ${
              mode === "counter"
                ? "bg-[#ff007f]/10 border-[#ff007f] shadow-[0_0_20px_rgba(255,0,255,0.2)]"
                : "bg-white/5 border-white/10"
            }`}
          >
            <MessageSquare size={24} className={mode === "counter" ? "text-[#ff007f]" : "text-gray-500"} />
            <p className={`font-black text-lg mt-3 ${mode === "counter" ? "text-white" : "text-gray-400"}`}>Counter-Offer</p>
            <p className="text-gray-500 text-sm mt-1">Set your price</p>
          </button>
        </div>

        {/* Counter price editor */}
        {mode === "counter" && (
          <div className="bg-white/5 border border-[#ff007f]/20 rounded-3xl p-6">
            <p className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-5 text-center">Your Counter Price</p>
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => setCounterPrice((p) => Math.max(10, p - 10))}
                className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 active:scale-95"
              >
                <Minus size={24} />
              </button>
              <div className="text-center">
                <span className="text-6xl font-black text-white">{counterPrice}</span>
                <span className="text-2xl font-bold text-gray-400 ml-2">MAD</span>
              </div>
              <button
                onClick={() => setCounterPrice((p) => p + 10)}
                className="w-14 h-14 rounded-full bg-[#ff007f] flex items-center justify-center text-white hover:bg-[#e600e6] active:scale-95 shadow-[0_0_20px_rgba(255,0,255,0.4)]"
              >
                <Plus size={24} />
              </button>
            </div>
            {counterPrice !== job.budget && (
              <p className={`text-center text-sm font-bold mt-3 ${counterPrice < job.budget ? "text-green-400" : "text-[#ff007f]"}`}>
                {counterPrice < job.budget ? `You're offering ${job.budget - counterPrice} MAD less` : `${counterPrice - job.budget} MAD above client's offer`}
              </p>
            )}
          </div>
        )}

        {/* ETA */}
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-2">Your ETA (optional)</p>
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-4 focus-within:border-[#ff007f] transition-colors">
            <Clock size={18} className="text-[#ff007f] flex-shrink-0" />
            <input
              value={eta}
              onChange={(e) => setEta(e.target.value)}
              placeholder="e.g. 10 mins, 30 mins..."
              className="bg-transparent text-white font-bold flex-1 outline-none placeholder:text-gray-600"
            />
          </div>
          <p className="text-gray-600 text-xs mt-1.5">Clients love knowing when you'll arrive</p>
        </div>
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A] to-transparent pb-safe-bottom">
        <button
          onClick={handleSubmit}
          disabled={createBid.isPending || (mode === "counter" && counterPrice <= 0)}
          className={`w-full font-black text-xl rounded-2xl py-5 transition-all flex items-center justify-center gap-2 active:scale-[0.97] disabled:opacity-40 ${
            mode === "accept"
              ? "bg-[#00f2ff] hover:bg-[#00b0e8] text-black shadow-[0_0_30px_rgba(0,193,255,0.5)]"
              : "bg-[#ff007f] hover:bg-[#e600e6] text-white shadow-[0_0_30px_rgba(255,0,255,0.5)]"
          }`}
        >
          {createBid.isPending ? "Sending..." : (
            mode === "accept"
              ? <><Check size={22} /> Accept & Bid {job.budget} MAD</>
              : <><MessageSquare size={22} /> Send Counter {counterPrice} MAD</>
          )}
        </button>
      </div>
    </div>
  );
}
