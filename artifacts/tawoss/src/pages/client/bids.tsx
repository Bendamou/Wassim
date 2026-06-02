import { useGetJob, useGetJobBids, useUpdateBidStatus, useUpdateJobStatus } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MapPin, Clock, Star, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetJobBidsQueryKey, getGetJobQueryKey } from "@workspace/api-client-react";

export default function JobBids() {
  const [, params] = useRoute("/jobs/:id/bids");
  const jobId = parseInt(params?.id || "0", 10);
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: job, isLoading: loadingJob } = useGetJob(jobId, {
    query: { enabled: !!jobId, queryKey: getGetJobQueryKey(jobId) }
  });

  const { data: bids, isLoading: loadingBids } = useGetJobBids(jobId, {
    query: { 
      enabled: !!jobId, 
      queryKey: getGetJobBidsQueryKey(jobId),
      refetchInterval: job?.status === "open" ? 3000 : false 
    }
  });

  const acceptBid = useUpdateBidStatus();
  const updateJob = useUpdateJobStatus();

  const handleAccept = async (bidId: number) => {
    try {
      await acceptBid.mutateAsync({ id: bidId, data: { status: "accepted" } });
      await updateJob.mutateAsync({ id: jobId, data: { status: "in_progress" } });
      
      toast({ title: t.statusAccepted });
      
      // Invalidate queries to refresh state
      queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(jobId) });
      queryClient.invalidateQueries({ queryKey: getGetJobBidsQueryKey(jobId) });
    } catch (err: any) {
      toast({ title: t.error, description: err.message, variant: "destructive" });
    }
  };

  const handleCancel = async () => {
    if (!confirm(t.cancelJobMsg)) return;
    try {
      await updateJob.mutateAsync({ id: jobId, data: { status: "cancelled" } });
      toast({ title: t.statusCancelled });
      queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(jobId) });
    } catch (err: any) {
      toast({ title: t.couldNotCancel, description: err.message, variant: "destructive" });
    }
  };

  if (!jobId) return <div>Invalid Job ID</div>;

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link href="/jobs" className="h-10 w-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h2 className="text-2xl font-black drop-shadow-[0_0_8px_rgba(0,180,255,0.4)]">
          {t.jobNum(jobId)}
        </h2>
      </div>

      {loadingJob ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : job ? (
        <Card className="bg-card border-primary/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <div className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
              job.status === "open" ? "bg-primary text-primary-foreground animate-pulse" :
              job.status === "in_progress" ? "bg-secondary text-secondary-foreground" :
              job.status === "completed" ? "bg-green-500 text-white" :
              "bg-muted text-muted-foreground"
            }`}>
              {job.status === "open" ? t.statusOpen : job.status === "in_progress" ? t.statusInProgress : job.status === "completed" ? t.statusCompleted : t.statusCancelled}
            </div>
          </div>
          <CardContent className="p-6">
            <h3 className="text-2xl font-bold capitalize mb-4">{job.service.replace("_", " ")}</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <div className="text-sm text-muted-foreground mb-1">{t.budget}</div>
                <div className="text-xl font-black text-primary">{job.budget} {t.mad}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">{t.location}</div>
                <div className="font-medium text-sm flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" /> {job.location}
                </div>
              </div>
            </div>
            
            {job.status === "open" && (
              <Button variant="outline" size="sm" onClick={handleCancel} className="w-full sm:w-auto text-destructive border-destructive hover:bg-destructive/10">
                {t.cancelThisJob}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : null}

      <div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-secondary animate-pulse" />
          Live Bids
        </h3>
        
        {loadingBids ? (
          <div className="space-y-4">
            {[1, 2].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        ) : bids?.length ? (
          <div className="space-y-4">
            {bids.map(bid => (
              <Card key={bid.id} className={`overflow-hidden transition-all ${
                bid.status === "accepted" ? "border-secondary shadow-[0_0_15px_rgba(255,31,142,0.2)]" : 
                bid.status === "rejected" ? "opacity-50" : 
                "border-border hover:border-primary/50"
              }`}>
                <CardContent className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <div className="flex gap-4 items-center">
                    <Avatar className="h-12 w-12 border border-border">
                      <AvatarImage src={bid.professional?.avatar} />
                      <AvatarFallback>{bid.professional?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-bold flex items-center gap-2">
                        {bid.professional?.name}
                        {bid.professional?.isVerified && (
                          <CheckCircle2 className="h-3 w-3 text-primary" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-secondary text-secondary" />
                          {bid.professional?.rating?.toFixed(1) || "5.0"}
                        </span>
                        {bid.estimatedArrival && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {bid.estimatedArrival}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4 sm:gap-2">
                    <div className="text-xl font-black text-foreground">
                      {bid.price} <span className="text-sm font-normal text-muted-foreground">{t.mad}</span>
                    </div>
                    
                    {job?.status === "open" && bid.status === "pending" && (
                      <Button 
                        size="sm" 
                        className="bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[0_0_10px_rgba(255,31,142,0.4)]"
                        onClick={() => handleAccept(bid.id)}
                        disabled={acceptBid.isPending}
                      >
                        {acceptBid.isPending ? "..." : t.statusAccepted}
                      </Button>
                    )}
                    
                    {bid.status === "accepted" && (
                      <div className="text-sm font-bold text-secondary">{t.statusAccepted}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-12 border border-dashed rounded-xl border-border bg-card/20">
            <div className="h-12 w-12 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">{t.biddingStart}</p>
          </div>
        )}
      </div>
    </div>
  );
}
