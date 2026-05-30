import { useAuth } from "@/lib/auth";
import { useListMyBids, getListMyBidsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VerifiedBadge } from "@/components/verified-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, CheckCircle, Clock, Briefcase, MapPin, User } from "lucide-react";

export default function ProfessionalProfile() {
  const { user } = useAuth();
  const { data: bids, isLoading } = useListMyBids({
    query: { queryKey: getListMyBidsQueryKey() },
  });

  const acceptedBids = bids?.filter((b) => b.status === "accepted").length || 0;
  const totalBids = bids?.length || 0;
  const successRate = totalBids > 0 ? Math.round((acceptedBids / totalBids) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Your professional trust profile</p>
      </div>

      {/* Profile Hero */}
      <Card className="bg-gradient-to-br from-card via-card to-secondary/10 border-card-border rounded-3xl overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-primary/30 via-secondary/20 to-primary/10" />
        <CardContent className="px-6 pb-6 -mt-10">
          <div className="flex items-end gap-4 mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold text-3xl border-4 border-card flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-white">{user?.name}</h2>
                {user?.isVerified && <VerifiedBadge size="md" />}
              </div>
              <p className="text-muted-foreground text-sm capitalize">{user?.role}</p>
            </div>
          </div>

          {/* Verified Badge Display */}
          {user?.isVerified && (
            <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/20 rounded-2xl mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <VerifiedBadge size="md" />
              </div>
              <div>
                <p className="font-bold text-primary">Verified by Tawoss</p>
                <p className="text-xs text-muted-foreground">Your profile has been verified. Clients trust you more.</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm text-muted-foreground">
            {user?.location && (
              <span className="flex items-center gap-1.5"><MapPin size={14} /> {user.location}</span>
            )}
            {user?.rating !== undefined && user.rating > 0 && (
              <span className="flex items-center gap-1.5"><Star size={14} className="text-yellow-500 fill-yellow-500" /> {user.rating.toFixed(1)} rating</span>
            )}
          </div>

          {user?.bio && (
            <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{user.bio}</p>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-card border-card-border rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-extrabold text-white">{totalBids}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Bids</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary/10 to-card border-primary/20 rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-extrabold text-white">{acceptedBids}</p>
            <p className="text-xs text-primary mt-1">Won</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-secondary/10 to-card border-secondary/20 rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-extrabold text-white">{successRate}%</p>
            <p className="text-xs text-secondary mt-1">Win Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bid Activity */}
      <div>
        <h2 className="text-lg font-bold mb-4">Recent Bids</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
          </div>
        ) : bids && bids.length > 0 ? (
          <div className="space-y-3">
            {bids.slice(0, 6).map((bid) => (
              <Card key={bid.id} className="bg-card border-card-border rounded-2xl">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${bid.status === "accepted" ? "bg-green-400" : bid.status === "rejected" ? "bg-destructive" : "bg-primary"}`} />
                    <div>
                      <p className="font-medium text-white text-sm">Job #{bid.jobId}</p>
                      <p className="text-xs text-muted-foreground capitalize">{bid.status}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">{bid.price} MAD</p>
                    {bid.estimatedArrival && (
                      <p className="text-xs text-muted-foreground">{bid.estimatedArrival}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center border border-dashed border-card-border rounded-2xl">
            <Briefcase className="text-muted-foreground mx-auto mb-2" size={28} />
            <p className="text-muted-foreground text-sm">No bids yet. Start bidding on jobs!</p>
          </div>
        )}
      </div>
    </div>
  );
}
