import { useState } from "react";
import { useListJobs, useListMyBids, useCreateBid } from "@workspace/api-client-react";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getListJobsQueryKey, getListMyBidsQueryKey } from "@workspace/api-client-react";

export default function ProJobs() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobs, isLoading: loadingJobs } = useListJobs();
  const { data: myBids, isLoading: loadingBids } = useListMyBids();
  
  const createBid = useCreateBid();

  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [bidPrice, setBidPrice] = useState("");
  const [estimatedArrival, setEstimatedArrival] = useState("");

  const openBidModal = (jobId: number) => {
    setSelectedJobId(jobId);
    setBidPrice("");
    setEstimatedArrival("");
    setBidModalOpen(true);
  };

  const submitBid = async () => {
    if (!selectedJobId || !bidPrice) return;
    try {
      await createBid.mutateAsync({
        data: {
          jobId: selectedJobId,
          price: Number(bidPrice),
          estimatedArrival,
        }
      });
      toast({ title: "Bid placed successfully!" });
      setBidModalOpen(false);
      queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListMyBidsQueryKey() });
    } catch (err: any) {
      toast({ title: t.couldNotBid, description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-500">
      <h2 className="text-3xl font-black drop-shadow-[0_0_8px_rgba(255,31,142,0.4)] text-secondary">
        {t.jobs}
      </h2>

      <Tabs defaultValue="available" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-card/50">
          <TabsTrigger value="available">{t.availableJobs(jobs?.filter(j => j.status === "open").length || 0)}</TabsTrigger>
          <TabsTrigger value="bids">{t.myBids}</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4 mt-4">
          {loadingJobs ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
            </div>
          ) : jobs?.filter(j => j.status === "open").length ? (
            <div className="space-y-4">
              {jobs.filter(j => j.status === "open").map(job => {
                const hasBid = myBids?.some(b => b.jobId === job.id);
                return (
                  <Card key={job.id} className="bg-card/80 backdrop-blur hover:bg-muted/50 transition-colors border-border">
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">
                            {t.jobNum(job.id)} • {t.bidsCount(job.bidsCount || 0)}
                          </div>
                          <h3 className="text-xl font-bold capitalize">{job.service.replace("_", " ")}</h3>
                          <div className="space-y-1 mt-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" /> {job.location}
                            </div>
                            {job.scheduledTime && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" /> {new Date(job.scheduledTime).toLocaleString(lang)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end justify-between h-full">
                          <div className="text-xl font-black text-primary drop-shadow-[0_0_5px_rgba(0,180,255,0.3)] mb-4">
                            {job.budget} {t.mad}
                          </div>
                          {hasBid ? (
                            <div className="text-sm text-secondary font-bold flex items-center gap-1">
                              ✓ Bid Placed
                            </div>
                          ) : (
                            <Button size="sm" onClick={() => openBidModal(job.id)} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[0_0_10px_rgba(255,31,142,0.3)]">
                              Place Bid
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center p-12 border border-dashed rounded-xl border-border bg-card/20">
              <p className="text-muted-foreground">{t.noRequests}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="bids" className="space-y-4 mt-4">
          {loadingBids ? (
            <div className="space-y-4">
              {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
            </div>
          ) : myBids?.length ? (
            <div className="space-y-4">
              {myBids.map(bid => (
                <Card key={bid.id} className="bg-card border-border">
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <div className="text-sm font-bold text-muted-foreground mb-1">
                        {t.jobNum(bid.jobId)}
                      </div>
                      <div className="text-lg font-black">{bid.price} {t.mad}</div>
                      {bid.estimatedArrival && (
                        <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {bid.estimatedArrival}
                        </div>
                      )}
                    </div>
                    <div className={`text-sm px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                      bid.status === "pending" ? "bg-muted text-muted-foreground" :
                      bid.status === "accepted" ? "bg-green-500/20 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]" :
                      "bg-destructive/20 text-destructive"
                    }`}>
                      {bid.status === "pending" ? t.statusPending : bid.status === "accepted" ? t.statusAccepted : t.statusRejected}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-12 border border-dashed rounded-xl border-border bg-card/20">
              <p className="text-muted-foreground mb-4">{t.noBidsYet}</p>
              <Button onClick={() => document.querySelector('[value="available"]')?.dispatchEvent(new MouseEvent('click'))} variant="outline" className="border-secondary text-secondary hover:bg-secondary/10">
                {t.browseToBid}
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={bidModalOpen} onOpenChange={setBidModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Place Your Bid</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.budgetLabel}</label>
              <div className="relative">
                <Input 
                  type="number" 
                  value={bidPrice} 
                  onChange={e => setBidPrice(e.target.value)} 
                  className="pl-4 pr-16 h-12 text-lg font-bold"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary font-bold">
                  {t.mad}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Estimated Arrival (e.g. 15 mins)</label>
              <Input 
                value={estimatedArrival} 
                onChange={e => setEstimatedArrival(e.target.value)} 
                placeholder="15 mins"
                className="h-12"
              />
            </div>
            <Button 
              className="w-full h-12 text-lg font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[0_0_15px_rgba(255,31,142,0.4)]" 
              onClick={submitBid}
              disabled={createBid.isPending || !bidPrice}
            >
              {createBid.isPending ? "..." : "Submit Bid"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
