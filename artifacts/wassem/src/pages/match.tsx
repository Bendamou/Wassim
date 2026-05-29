import { useParams, useLocation } from "wouter";
import {
  useGetJob,
  getGetJobQueryKey,
  useGetJobBids,
  getGetJobBidsQueryKey,
  useUpdateBidStatus,
} from "@workspace/api-client-react";
import { ArrowLeft, Star, Clock, Check, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function MatchScreen() {
  const { id } = useParams<{ id: string }>();
  const jobId = parseInt(id, 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: job } = useGetJob(jobId, {
    query: { enabled: !!jobId, queryKey: getGetJobQueryKey(jobId) },
  });

  const { data: bids = [] } = useGetJobBids(jobId, {
    query: {
      enabled: !!jobId,
      queryKey: getGetJobBidsQueryKey(jobId),
      refetchInterval: 2000,
    },
  });

  const updateBidStatus = useUpdateBidStatus();

  const handleAccept = (bidId: number) => {
    updateBidStatus.mutate(
      { id: bidId, data: { status: "accepted" } },
      {
        onSuccess: () => {
          toast({ title: "✅ Barber accepted!", description: "Track their live location now." });
          setLocation(`/tracking/${jobId}`);
        },
        onError: () => toast({ title: "Failed", variant: "destructive" }),
      }
    );
  };

  const pendingBids = bids.filter((b) => b.status === "pending");

  return (
    <div className="min-h-[100dvh] bg-[#0f051d] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 pt-safe-top pt-5 pb-4 border-b border-white/5">
        <button
          onClick={() => setLocation("/")}
          className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-white font-black text-xl">Live Offers</h1>
            <div className="flex items-center gap-1 bg-[#00f2ff]/10 border border-[#00f2ff]/20 rounded-full px-2 py-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00f2ff] animate-pulse" />
              <span className="text-[#00f2ff] text-xs font-bold">LIVE</span>
            </div>
          </div>
          {job && (
            <p className="text-gray-500 text-sm capitalize">
              {job.service?.replace("_", " ")} · <span className="text-white font-bold">{job.budget} MAD</span> your offer
            </p>
          )}
        </div>
      </div>

      {/* Bids list */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
        {pendingBids.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full bg-[#00f2ff]/10 border border-[#00f2ff]/20 flex items-center justify-center">
                <Zap size={32} className="text-[#00f2ff]" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#00f2ff] rounded-full animate-ping" />
            </div>
            <p className="text-white font-black text-2xl mb-2">Waiting for barbers</p>
            <p className="text-gray-500 max-w-xs">Nearby professionals are seeing your request right now</p>
          </div>
        ) : (
          pendingBids.map((bid) => {
            const savings = job ? job.budget - bid.price : 0;
            return (
              <div key={bid.id} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00f2ff] to-[#ff007f] flex items-center justify-center text-white font-black text-2xl flex-shrink-0 shadow-[0_0_15px_rgba(0,193,255,0.3)]">
                      {bid.professional?.name?.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-black text-lg">{bid.professional?.name}</p>
                        {bid.professional?.isVerified && (
                          <span className="text-xs bg-[#00f2ff]/20 border border-[#00f2ff]/40 text-[#00f2ff] rounded-full px-2 py-0.5 font-bold">✓ Verified</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                        {bid.professional?.rating !== undefined && bid.professional.rating > 0 && (
                          <span className="flex items-center gap-1">
                            <Star size={13} className="text-yellow-400 fill-yellow-400" />
                            <span className="font-bold text-white">{bid.professional.rating.toFixed(1)}</span>
                          </span>
                        )}
                        {bid.estimatedArrival && (
                          <span className="flex items-center gap-1">
                            <Clock size={13} className="text-[#ff007f]" />
                            <span className="text-[#ff007f] font-bold">{bid.estimatedArrival}</span>
                          </span>
                        )}
                      </div>
                      {bid.professional?.bio && (
                        <p className="text-gray-500 text-xs mt-1 line-clamp-1">{bid.professional.bio}</p>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-end justify-between mt-5 pt-4 border-t border-white/5">
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                        {savings > 0 ? "Counter-offer" : "Accepts your price"}
                      </p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-black text-white">{bid.price}</span>
                        <span className="text-2xl font-bold text-gray-400">MAD</span>
                      </div>
                      {savings !== 0 && (
                        <p className={`text-sm font-bold mt-0.5 ${savings > 0 ? "text-green-400" : "text-[#ff007f]"}`}>
                          {savings > 0 ? `You save ${savings} MAD!` : `+${Math.abs(savings)} MAD above your offer`}
                        </p>
                      )}
                    </div>

                    {/* Accept button */}
                    <button
                      onClick={() => handleAccept(bid.id)}
                      disabled={updateBidStatus.isPending}
                      className="bg-[#00f2ff] hover:bg-[#00b0e8] disabled:opacity-40 text-black font-black text-lg rounded-2xl px-6 py-4 transition-all shadow-[0_0_20px_rgba(0,193,255,0.4)] flex items-center gap-2 active:scale-95"
                    >
                      <Check size={20} /> Accept
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom info */}
      {pendingBids.length > 0 && (
        <div className="px-5 pb-safe-bottom pb-5">
          <p className="text-center text-gray-600 text-sm">
            {pendingBids.length} barber{pendingBids.length !== 1 ? "s" : ""} responded · Updating every 2s
          </p>
        </div>
      )}
    </div>
  );
}
