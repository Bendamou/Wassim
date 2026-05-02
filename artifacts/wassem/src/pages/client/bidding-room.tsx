import { useParams, useLocation } from "wouter";
import {
  useGetJob,
  getGetJobQueryKey,
  useGetJobBids,
  getGetJobBidsQueryKey,
  useUpdateBidStatus,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/verified-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Scissors, MapPin, Clock, Star, Check, X, ArrowLeft, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function BiddingRoom() {
  const { id } = useParams<{ id: string }>();
  const jobId = parseInt(id, 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: job, isLoading: jobLoading } = useGetJob(jobId, {
    query: { enabled: !!jobId, queryKey: getGetJobQueryKey(jobId) },
  });

  const { data: bids, isLoading: bidsLoading, dataUpdatedAt } = useGetJobBids(jobId, {
    query: {
      enabled: !!jobId,
      queryKey: getGetJobBidsQueryKey(jobId),
      refetchInterval: 3000,
    },
  });

  const updateBidStatus = useUpdateBidStatus();

  const handleBidAction = (bidId: number, status: "accepted" | "rejected") => {
    updateBidStatus.mutate(
      { id: bidId, data: { status } },
      {
        onSuccess: () => {
          toast({
            title: status === "accepted" ? "Bid accepted!" : "Bid rejected",
            description: status === "accepted" ? "The professional is on their way." : "You can still accept other bids.",
          });
          if (status === "accepted") setLocation("/client/jobs");
        },
        onError: () => toast({ title: "Failed to update bid", variant: "destructive" }),
      }
    );
  };

  if (jobLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <Link href="/client/jobs">
          <button className="p-2 rounded-full hover:bg-white/5 text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Bidding Room</h1>
          <p className="text-muted-foreground text-sm">Professionals are competing for your job</p>
        </div>
      </div>

      {/* Job Summary */}
      {job && (
        <Card className="bg-gradient-to-br from-primary/10 to-card border-primary/20 rounded-3xl">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Scissors size={24} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold capitalize">{job.service?.replace("_", " ")}</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full border text-primary border-primary/40 bg-primary/10 capitalize font-medium">
                    {job.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-2">
                  <span className="flex items-center gap-1"><MapPin size={14} /> {job.location}</span>
                  {job.scheduledTime && (
                    <span className="flex items-center gap-1"><Clock size={14} /> {new Date(job.scheduledTime).toLocaleString()}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-white">{job.budget}</p>
                <p className="text-xs text-muted-foreground">MAD budget</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bids Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold">{bids?.length || 0} Offers</h2>
            <div className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
              <RefreshCw size={10} className="animate-spin" /> Live
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Updates every 3s</p>
        </div>

        {bidsLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        ) : bids && bids.length > 0 ? (
          <div className="space-y-3">
            {bids.map((bid) => (
              <Card key={bid.id} className={`border-card-border rounded-2xl transition-all ${bid.status === "accepted" ? "border-green-400/40 bg-green-400/5" : bid.status === "rejected" ? "opacity-50 bg-card" : "bg-card hover:border-primary/30"}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {bid.professional?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-bold text-white">{bid.professional?.name}</p>
                          {bid.professional?.isVerified && <VerifiedBadge size="sm" />}
                          {bid.status !== "pending" && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${bid.status === "accepted" ? "bg-green-400/20 text-green-400 border border-green-400/30" : "bg-muted/20 text-muted-foreground border border-muted/30"}`}>
                              {bid.status}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          {bid.professional?.rating !== undefined && bid.professional.rating > 0 && (
                            <span className="flex items-center gap-1"><Star size={11} className="text-yellow-500 fill-yellow-500" /> {bid.professional.rating.toFixed(1)}</span>
                          )}
                          {bid.estimatedArrival && (
                            <span className="flex items-center gap-1"><Clock size={11} /> {bid.estimatedArrival} arrival</span>
                          )}
                        </div>
                        {bid.professional?.bio && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{bid.professional.bio}</p>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-extrabold text-white">{bid.price}</p>
                      <p className="text-xs text-muted-foreground">MAD</p>
                      {bid.budget !== undefined && bid.price < (job?.budget || 0) && (
                        <p className="text-xs text-green-400 font-medium mt-0.5">Saves {(job?.budget || 0) - bid.price} MAD</p>
                      )}
                    </div>
                  </div>

                  {bid.status === "pending" && job?.status === "open" && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        className="flex-1 rounded-full bg-primary hover:bg-primary/90 text-black font-bold shadow-[0_0_15px_rgba(0,193,255,0.3)]"
                        size="sm"
                        onClick={() => handleBidAction(bid.id, "accepted")}
                        disabled={updateBidStatus.isPending}
                      >
                        <Check size={16} className="mr-1" /> Accept
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 rounded-full border-destructive/50 text-destructive hover:bg-destructive/10"
                        size="sm"
                        onClick={() => handleBidAction(bid.id, "rejected")}
                        disabled={updateBidStatus.isPending}
                      >
                        <X size={16} className="mr-1" /> Decline
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center border border-dashed border-card-border rounded-3xl">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <RefreshCw size={28} className="text-primary animate-spin" style={{ animationDuration: "3s" }} />
            </div>
            <p className="text-lg font-bold text-white mb-1">Waiting for bids...</p>
            <p className="text-muted-foreground text-sm">Professionals are being notified of your request</p>
          </div>
        )}
      </div>
    </div>
  );
}
