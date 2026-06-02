import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { apiCall } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, CreditCard, UserX, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SalonDashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: salons, isLoading: loadingSalons } = useQuery({
    queryKey: ["salons"],
    queryFn: () => apiCall("GET", "/salons"),
  });

  const mySalon = salons?.find((s: any) => s.owner_id === user?.id);

  const { data: queue, isLoading: loadingQueue } = useQuery({
    queryKey: ["queue", mySalon?.id],
    queryFn: () => apiCall("GET", `/salons/${mySalon?.id}/queue`),
    enabled: !!mySalon?.id,
    refetchInterval: mySalon?.is_live ? 3000 : false,
  });

  const toggleLiveMutation = useMutation({
    mutationFn: (is_live: boolean) => apiCall("POST", `/salons/${mySalon?.id}/go-live`, { is_live }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salons"] });
      toast({ title: "Live status updated" });
    },
  });

  const updateClaimMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => apiCall("PATCH", `/claims/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue", mySalon?.id] });
      toast({ title: "Queue updated" });
    },
  });

  const handleToggleLive = (checked: boolean) => {
    if (!mySalon?.id) return;
    toggleLiveMutation.mutate(checked);
  };

  const handleClaimStatus = (id: number, status: string) => {
    updateClaimMutation.mutate({ id, status });
  };

  // Mock earnings calculation
  const completedClaims = queue?.filter((q: any) => q.status === "completed") || [];
  const earnings = completedClaims.length * (mySalon?.avg_service_price || 50);

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black drop-shadow-[0_0_8px_rgba(155,48,255,0.4)] text-accent">
            {t.salonDashboard}
          </h2>
          {mySalon && <p className="text-muted-foreground mt-1">{mySalon.name}</p>}
        </div>
      </div>

      {loadingSalons ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : mySalon ? (
        <>
          <Card className="bg-card border-border overflow-hidden relative">
            <div className={`absolute inset-0 z-0 transition-opacity duration-1000 ${mySalon.is_live ? 'opacity-100' : 'opacity-0'}`}>
              <div className="absolute inset-0 bg-green-500/5 backdrop-blur-3xl" />
            </div>
            
            <CardContent className="p-6 relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className={`h-16 w-16 rounded-full flex items-center justify-center border-4 ${
                    mySalon.is_live ? "border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)]" : "border-muted"
                  }`}>
                    <Users className={`h-8 w-8 ${mySalon.is_live ? "text-green-500" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{mySalon.is_live ? t.youAreLive : t.goLiveToStart}</h3>
                    <p className="text-sm text-muted-foreground">{mySalon.is_live ? t.clientsCanFind : t.startAccepting}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full md:w-auto gap-6 bg-background/50 p-4 rounded-xl border border-border">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-muted-foreground">{t.goLive}</span>
                    <Switch 
                      checked={!!mySalon.is_live} 
                      onCheckedChange={handleToggleLive}
                      disabled={toggleLiveMutation.isPending}
                      className="data-[state=checked]:bg-green-500 mt-1"
                    />
                  </div>
                  
                  {mySalon.is_live && (
                    <div className="text-right">
                      <div className="text-sm font-bold text-muted-foreground mb-1">{t.earnedToday}</div>
                      <div className="text-2xl font-black text-green-500 drop-shadow-[0_0_5px_rgba(34,197,94,0.3)]">
                        {earnings} <span className="text-sm">{t.mad}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              {t.liveQueueTitle(queue?.filter((q:any) => q.status === "claimed").length || 0)}
              {mySalon.is_live && <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>}
            </h3>

            {loadingQueue ? (
              <div className="space-y-3">
                {[1, 2].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
              </div>
            ) : queue?.filter((q:any) => q.status === "claimed").length ? (
              <div className="space-y-3">
                {queue.filter((q:any) => q.status === "claimed").map((claim: any) => (
                  <Card key={claim.id} className="bg-card border-border hover:border-primary/30 transition-colors">
                    <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border border-primary/20">
                          {claim.id}
                        </div>
                        <div>
                          <div className="font-bold">{t.clientNum(claim.client_id)}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <CreditCard className="h-3 w-3" /> •••• {claim.card_last4 || "0000"} 
                            <span className="ml-2 font-medium text-primary">
                              {t.depositLabel}: {claim.deposit_amount || 20} {t.mad}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button 
                          onClick={() => handleClaimStatus(claim.id, "completed")}
                          className="flex-1 bg-green-500 text-white hover:bg-green-600 shadow-[0_0_10px_rgba(34,197,94,0.3)] gap-2"
                        >
                          <CheckCircle2 className="h-4 w-4" /> Check In
                        </Button>
                        <Button 
                          onClick={() => handleClaimStatus(claim.id, "noshow")}
                          variant="outline"
                          className="flex-1 border-destructive text-destructive hover:bg-destructive/10 gap-2"
                        >
                          <UserX className="h-4 w-4" /> No-Show
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center p-12 border border-dashed rounded-xl border-border bg-card/20">
                <p className="text-muted-foreground">
                  {mySalon.is_live ? t.queueEmpty : t.goLiveForQueue}
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center p-12 border border-dashed rounded-xl border-border bg-card/20">
          <p className="text-muted-foreground">No salon profile found. Please contact support.</p>
        </div>
      )}
    </div>
  );
}
