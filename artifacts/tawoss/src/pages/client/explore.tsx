import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { apiCall } from "@/lib/api";
import { useListProfessionals } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, Heart, Star, Scissors } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Explore() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const { data: salons, isLoading: loadingSalons, refetch: refetchSalons } = useQuery({
    queryKey: ["salons"],
    queryFn: () => apiCall("GET", "/salons"),
  });

  const { data: favorites, refetch: refetchFavs } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => apiCall("GET", "/users/favorites"),
  });

  const { data: pros, isLoading: loadingPros } = useListProfessionals();

  const toggleFavorite = async (salonId: number, isFav: boolean) => {
    try {
      if (isFav) {
        await apiCall("DELETE", `/users/favorites/${salonId}`);
        toast({ title: t.removedFromFavorites });
      } else {
        await apiCall("POST", "/users/favorites", { salonId });
        toast({ title: t.addedToFavorites });
      }
      refetchFavs();
    } catch (err: any) {
      toast({ title: t.error, description: err.message, variant: "destructive" });
    }
  };

  const isFavorite = (id: number) => favorites?.some((f: any) => f.id === id);

  const filteredSalons = salons?.filter((s: any) => {
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filter === "live" && !s.is_live) return false;
    if (filter === "men" && s.gender_pref === "women") return false;
    if (filter === "women" && s.gender_pref === "men") return false;
    return true;
  });

  const filteredPros = pros?.filter(p => {
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-500">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl pb-4 -mx-4 px-4 pt-2 md:mx-0 md:px-0 md:pt-0 border-b border-border/50 md:border-none">
        <h2 className="text-3xl font-black mb-4 drop-shadow-[0_0_8px_rgba(0,180,255,0.4)]">{t.browseSalons}</h2>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={t.salonSearchPlaceholder} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-primary/30 focus-visible:ring-primary"
          />
        </div>
      </div>

      <Tabs defaultValue="salons" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-card/50">
          <TabsTrigger value="salons">{t.roleSalon}</TabsTrigger>
          <TabsTrigger value="pros">{t.topProfessionals}</TabsTrigger>
        </TabsList>

        <TabsContent value="salons" className="space-y-4 mt-4">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 hide-scrollbar">
            {["all", "men", "women", "live"].map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                className="rounded-full shrink-0"
                onClick={() => setFilter(f)}
              >
                {f === "all" ? t.filterAll : f === "men" ? t.filterMen : f === "women" ? t.filterWomen : t.live}
              </Button>
            ))}
          </div>

          {loadingSalons ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
            </div>
          ) : filteredSalons?.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredSalons.map((salon: any) => (
                <div key={salon.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-colors group flex flex-col relative">
                  <div className="absolute top-2 right-2 z-10 flex gap-2">
                    {salon.is_live && (
                      <Badge className="bg-green-500 hover:bg-green-600 text-white font-bold animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]">
                        {t.isLive}
                      </Badge>
                    )}
                    <button 
                      onClick={(e) => { e.preventDefault(); toggleFavorite(salon.id, isFavorite(salon.id)); }}
                      className="h-8 w-8 rounded-full bg-background/50 backdrop-blur flex items-center justify-center border border-border hover:bg-background"
                    >
                      <Heart className={`h-4 w-4 ${isFavorite(salon.id) ? "fill-secondary text-secondary" : "text-foreground"}`} />
                    </button>
                  </div>
                  
                  <div className="h-32 bg-muted relative overflow-hidden">
                    {salon.photos ? (
                      <img src={salon.photos.split(',')[0]} alt={salon.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                        <Scissors className="h-8 w-8 text-primary/40" />
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-bold text-lg leading-tight">{salon.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>{salon.address || salon.city || t.notSet}</span>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-secondary text-secondary" />
                        <span className="font-bold">{salon.rating?.toFixed(1) || "4.8"}</span>
                      </div>
                      
                      {salon.is_live ? (
                        <div className="text-sm font-medium text-green-500">
                          {t.freeChairs(salon.free_chairs || 0)}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          {t.notSet}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Link href={`/salon/${salon.id}`} className="absolute inset-0 z-0">
                    <span className="sr-only">View salon</span>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-12 border border-dashed rounded-xl border-border bg-card/20">
              <p className="text-muted-foreground">{t.noSalons}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="pros" className="space-y-4 mt-4">
          {loadingPros ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
            </div>
          ) : filteredPros?.length ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filteredPros.map(pro => (
                <div key={pro.id} className="bg-card border border-border rounded-xl p-4 flex flex-col items-center text-center hover:border-primary/50 transition-colors">
                  <Avatar className="h-20 w-20 mb-3 border-2 border-primary/20">
                    <AvatarImage src={pro.avatar} />
                    <AvatarFallback className="bg-accent/20 text-accent text-xl font-bold">
                      {pro.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-bold line-clamp-1">{pro.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-secondary mt-1">
                    <Star className="h-3 w-3 fill-current" />
                    <span>{pro.rating?.toFixed(1) || "5.0"}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {pro.bio || t.roleProSub}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-12 border border-dashed rounded-xl border-border bg-card/20">
              <p className="text-muted-foreground">{t.noProfessionals}</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
