import { useAuth } from "@/lib/auth";
import { useListMyBids, getListMyBidsQueryKey } from "@workspace/api-client-react";
import { Star, LogOut, Briefcase, Check } from "lucide-react";

export default function Profile() {
  const { user, logout } = useAuth();
  const { data: bids = [] } = useListMyBids({
    query: { queryKey: getListMyBidsQueryKey() },
  });

  const acceptedBids = bids.filter((b) => b.status === "accepted").length;
  const totalBids = bids.length;
  const winRate = totalBids > 0 ? Math.round((acceptedBids / totalBids) * 100) : 0;

  const isClient = user?.role === "client";

  return (
    <div className="min-h-[100dvh] bg-[#0f051d] flex flex-col">
      {/* Header */}
      <div className="px-5 pt-safe-top pt-5 pb-6 border-b border-white/5">
        <h1 className="text-white font-black text-2xl">Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 pb-28 space-y-6">
        {/* Avatar + info */}
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#00f2ff] to-[#ff007f] flex items-center justify-center text-white font-black text-4xl shadow-[0_0_30px_rgba(0,193,255,0.3)] mb-4">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-white font-black text-2xl">{user?.name}</h2>
          {user?.phone && <p className="text-gray-500 text-sm mt-1">{user.phone}</p>}
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${isClient ? "text-[#00f2ff] border-[#00f2ff]/30 bg-[#00f2ff]/10" : "text-[#ff007f] border-[#ff007f]/30 bg-[#ff007f]/10"}`}>
              {isClient ? "💈 Client" : "✂️ Professional"}
            </span>
            {user?.isVerified && (
              <span className="text-xs font-bold px-3 py-1 rounded-full border text-green-400 border-green-400/30 bg-green-400/10">
                ✓ Verified
              </span>
            )}
          </div>
        </div>

        {/* Stats — only for professionals */}
        {!isClient && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <p className="text-3xl font-black text-white">{totalBids}</p>
              <p className="text-gray-500 text-xs mt-1 font-bold">BIDS</p>
            </div>
            <div className="bg-[#00f2ff]/10 border border-[#00f2ff]/20 rounded-2xl p-4 text-center">
              <p className="text-3xl font-black text-white">{acceptedBids}</p>
              <p className="text-[#00f2ff] text-xs mt-1 font-bold">WON</p>
            </div>
            <div className="bg-[#ff007f]/10 border border-[#ff007f]/20 rounded-2xl p-4 text-center">
              <p className="text-3xl font-black text-white">{winRate}%</p>
              <p className="text-[#ff007f] text-xs mt-1 font-bold">WIN RATE</p>
            </div>
          </div>
        )}

        {/* Rating */}
        {user?.rating !== undefined && user.rating > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Star size={24} className="text-yellow-400 fill-yellow-400" />
              <div>
                <p className="text-white font-black text-lg">{user.rating.toFixed(1)} Rating</p>
                <p className="text-gray-500 text-sm">Based on completed jobs</p>
              </div>
            </div>
          </div>
        )}

        {/* Recent activity */}
        {!isClient && bids.length > 0 && (
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-3">Recent Bids</p>
            <div className="space-y-2">
              {bids.slice(0, 5).map((bid) => (
                <div key={bid.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${bid.status === "accepted" ? "bg-green-400" : bid.status === "rejected" ? "bg-red-500" : "bg-[#00f2ff]"}`} />
                    <div>
                      <p className="text-white font-bold text-sm">Job #{bid.jobId}</p>
                      <p className="text-gray-500 text-xs capitalize">{bid.status}</p>
                    </div>
                  </div>
                  <p className="text-white font-black">{bid.price} MAD</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 rounded-2xl py-4 text-gray-400 hover:text-red-400 font-bold transition-all"
        >
          <LogOut size={20} /> Sign Out
        </button>
      </div>
    </div>
  );
}
