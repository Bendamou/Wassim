import { useListJobs, getListJobsQueryKey, useListMyBids, getListMyBidsQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { MapPin, Clock, ChevronRight, Zap, RefreshCw, Navigation } from "lucide-react";

const SERVICE_EMOJI: Record<string, string> = {
  haircut: "💇",
  beard: "🧔",
  nails: "💅",
  full_grooming: "✨",
};

const SERVICE_LABEL: Record<string, string> = {
  haircut: "Haircut",
  beard: "Beard Trim",
  nails: "Nails",
  full_grooming: "Full Package",
};

export default function ProRequests() {
  const [, setLocation] = useLocation();
  const { data: jobs = [], isLoading } = useListJobs({
    query: { queryKey: getListJobsQueryKey(), refetchInterval: 5000 },
  });
  const { data: myBids = [] } = useListMyBids({
    query: { queryKey: getListMyBidsQueryKey(), refetchInterval: 5000 },
  });

  const acceptedBids = myBids.filter((b) => b.status === "accepted");

  return (
    <div className="min-h-[100dvh] bg-[#0A0A0A] flex flex-col">
      {/* Header */}
      <div className="px-5 pt-safe-top pt-5 pb-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-white font-black text-2xl">Nearby Requests</h1>
              <div className="flex items-center gap-1 bg-[#FF00FF]/10 border border-[#FF00FF]/20 rounded-full px-2 py-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF00FF] animate-pulse" />
                <span className="text-[#FF00FF] text-xs font-bold">LIVE</span>
              </div>
            </div>
            <p className="text-gray-500 text-sm mt-0.5">{jobs.length} open request{jobs.length !== 1 ? "s" : ""} right now</p>
          </div>
          {isLoading && <RefreshCw size={18} className="text-gray-600 animate-spin" />}
        </div>
      </div>

      {/* Active jobs - accepted bids */}
      {acceptedBids.length > 0 && (
        <div className="px-5 pt-4 pb-2 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-green-400">Active Job</p>
          {acceptedBids.map((bid) => (
            <button
              key={bid.id}
              onClick={() => setLocation(`/tracking/${bid.jobId}`)}
              className="w-full bg-green-500/10 border border-green-500/30 rounded-2xl p-4 flex items-center justify-between text-left transition-all hover:border-green-400 active:scale-[0.98]"
            >
              <div>
                <p className="text-white font-black text-base">Job #{bid.jobId}</p>
                <p className="text-green-400 text-sm font-semibold mt-0.5">✅ Bid accepted · {bid.price} MAD</p>
              </div>
              <div className="flex items-center gap-2 bg-green-500 rounded-xl px-4 py-2.5">
                <Navigation size={16} className="text-white" />
                <span className="text-white font-black text-sm">Track</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Jobs list */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3 pb-28">
        {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-[#FF00FF]/10 border border-[#FF00FF]/20 flex items-center justify-center mb-6">
              <Zap size={32} className="text-[#FF00FF]" />
            </div>
            <p className="text-white font-black text-2xl mb-2">No requests yet</p>
            <p className="text-gray-500 max-w-xs">Clients are being notified. Check back in a moment.</p>
          </div>
        ) : (
          jobs.map((job) => (
            <button
              key={job.id}
              onClick={() => setLocation(`/pro/bid/${job.id}`)}
              className="w-full bg-white/5 hover:bg-white/8 border border-white/10 hover:border-[#FF00FF]/50 rounded-3xl p-5 text-left transition-all active:scale-[0.98] group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-4 min-w-0">
                  {/* Service Icon */}
                  <div className="w-14 h-14 rounded-2xl bg-[#FF00FF]/10 border border-[#FF00FF]/20 flex items-center justify-center text-2xl flex-shrink-0">
                    {SERVICE_EMOJI[job.service] || "✂️"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-black text-lg">{SERVICE_LABEL[job.service] || job.service}</p>
                    <div className="flex flex-wrap gap-x-3 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1"><MapPin size={12} />{job.location}</span>
                      {job.scheduledTime && (
                        <span className="flex items-center gap-1"><Clock size={12} />{new Date(job.scheduledTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      )}
                    </div>
                    {(job.bidsCount || 0) > 0 ? (
                      <p className="text-xs text-[#FF00FF] font-bold mt-2">{job.bidsCount} barber{job.bidsCount !== 1 ? "s" : ""} already bid</p>
                    ) : (
                      <p className="text-xs text-green-400 font-bold mt-2">⚡ Be the first!</p>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 flex flex-col items-end justify-between gap-3">
                  <div>
                    <p className="text-4xl font-black text-white">{job.budget}</p>
                    <p className="text-gray-500 text-sm font-bold">MAD</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-[#FF00FF]/10 group-hover:bg-[#FF00FF] flex items-center justify-center transition-colors">
                    <ChevronRight size={18} className="text-[#FF00FF] group-hover:text-black" />
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
