import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { apiCall } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MapPin, Star, Scissors, ArrowLeft, Users, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SalonDetail() {
  const [, params] = useRoute("/salon/:id");
  const salonId = parseInt(params?.id || "0", 10);
  const { t } = useI18n();
  const { toast } = useToast();

  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [cardHolder, setCardHolder] = useState("");
  const [cardLast4, setCardLast4] = useState("");
  const [claiming, setClaiming] = useState(false);

  const { data: salons, isLoading } = useQuery({
    queryKey: ["salons"],
    queryFn: () => apiCall("GET", "/salons"),
  });

  const salon = salons?.find((s: any) => s.id === salonId);

  const handleClaim = async () => {
    if (!cardHolder || cardLast4.length !== 4) {
      toast({ title: "Invalid card details", variant: "destructive" });
      return;
    }
    
    setClaiming(true);
    try {
      await apiCall("POST", `/salons/${salonId}/claim-chair`, { cardHolder, cardLast4 });
      toast({ title: "Chair claimed successfully! Head to the salon." });
      setClaimModalOpen(false);
    } catch (err: any) {
      toast({ title: "Could not claim chair", description: err.message, variant: "destructive" });
    } finally {
      setClaiming(false);
    }
  };

  if (!salonId) return <div>Invalid Salon ID</div>;

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500 relative">
      <Link href="/explore" className="absolute top-4 left-4 z-20 h-10 w-10 rounded-full bg-background/80 backdrop-blur border border-border flex items-center justify-center hover:bg-background transition-colors">
        <ArrowLeft className="h-5 w-5" />
      </Link>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-b-3xl -mt-8" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ) : salon ? (
        <>
          <div className="h-64 sm:h-80 -mt-8 -mx-4 sm:-mx-8 relative overflow-hidden bg-muted rounded-b-[2rem] border-b border-border shadow-2xl">
            {salon.photos ? (
              <img src={salon.photos.split(',')[0]} alt={salon.name} className="w-full h-full object-cover opacity-60" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                <Scissors className="h-16 w-16 text-primary/40" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            
            {salon.is_live && (
              <div className="absolute bottom-6 right-6 px-4 py-2 bg-green-500 rounded-full text-white font-bold animate-pulse shadow-[0_0_20px_rgba(34,197,94,0.6)] flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-white animate-ping" />
                {t.isLive}
              </div>
            )}
          </div>

          <div className="px-2">
            <h1 className="text-4xl font-black mb-2">{salon.name}</h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{salon.address || salon.city || t.notSet}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-secondary text-secondary" />
                <span className="font-bold text-foreground">{salon.rating?.toFixed(1) || "4.8"}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-accent" />
                <span>{salon.gender_pref === "women" ? t.filterWomen : t.filterMen}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-card border border-border p-4 rounded-xl text-center">
                <div className="text-sm text-muted-foreground mb-1">Status</div>
                <div className={`font-bold text-lg ${salon.is_live ? "text-green-500" : "text-muted-foreground"}`}>
                  {salon.is_live ? "Open Now" : "Closed"}
                </div>
              </div>
              <div className="bg-card border border-border p-4 rounded-xl text-center">
                <div className="text-sm text-muted-foreground mb-1">Chairs Available</div>
                <div className="font-bold text-lg text-primary">{salon.is_live ? salon.free_chairs || 0 : "-"}</div>
              </div>
            </div>

            <div className="prose prose-invert max-w-none">
              <p className="text-muted-foreground">
                Premium grooming services in a modern environment. We specialize in precision cuts, beard styling, and hot towel shaves. Walk in during our live hours for immediate service.
              </p>
            </div>
          </div>

          {/* Fixed bottom action bar */}
          <div className="fixed bottom-[72px] md:bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border z-40">
            <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
              <div className="hidden sm:block">
                <div className="text-sm text-muted-foreground">Deposit</div>
                <div className="font-bold text-xl text-primary">20 {t.mad}</div>
              </div>
              <Button 
                className="w-full sm:w-auto flex-1 h-14 text-lg font-bold shadow-[0_0_20px_rgba(0,180,255,0.4)] hover:shadow-[0_0_30px_rgba(0,180,255,0.6)] transition-all"
                disabled={!salon.is_live || !salon.free_chairs}
                onClick={() => setClaimModalOpen(true)}
              >
                {!salon.is_live ? "Currently Closed" : 
                 !salon.free_chairs ? "Queue Full" : 
                 "Walk In Now"}
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center p-12">Salon not found</div>
      )}

      <Dialog open={claimModalOpen} onOpenChange={setClaimModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Claim a Chair</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted p-4 rounded-lg flex items-center justify-between mb-4 border border-border">
              <span className="font-medium">Deposit to hold chair</span>
              <span className="font-black text-primary text-xl">20 {t.mad}</span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Name on Card</label>
              <Input 
                value={cardHolder} 
                onChange={e => setCardHolder(e.target.value)} 
                placeholder="AHMED BENALI"
                className="bg-background h-12 uppercase"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Card Number</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  value={cardLast4} 
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').substring(0, 4);
                    setCardLast4(val);
                  }} 
                  placeholder="•••• •••• •••• 4242"
                  className="bg-background pl-10 h-12 tracking-widest text-lg font-mono"
                  maxLength={4}
                />
              </div>
              <p className="text-xs text-muted-foreground">Just enter 4 digits for this demo</p>
            </div>

            <Button 
              className="w-full h-12 mt-4 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(0,180,255,0.4)]" 
              onClick={handleClaim}
              disabled={claiming || !cardHolder || cardLast4.length !== 4}
            >
              {claiming ? "Processing..." : "Confirm & Claim Chair"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
