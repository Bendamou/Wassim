import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { apiCall } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Star, Heart, Scissors } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Favorites() {
  const { t } = useI18n();
  const { toast } = useToast();

  const { data: favorites, isLoading, refetch } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => apiCall("GET", "/users/favorites"),
  });

  const removeFavorite = async (salonId: number) => {
    try {
      await apiCall("DELETE", `/users/favorites/${salonId}`);
      toast({ title: t.removedFromFavorites });
      refetch();
    } catch (err: any) {
      toast({ title: t.error, description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-500">
      <h2 className="text-3xl font-black drop-shadow-[0_0_8px_rgba(255,31,142,0.4)] text-secondary">{t.favoritesTitle}</h2>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
        </div>
      ) : favorites?.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {favorites.map((salon: any) => (
            <Card key={salon.id} className="bg-card border border-border overflow-hidden relative group">
              <button 
                onClick={(e) => { e.preventDefault(); removeFavorite(salon.id); }}
                className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center border border-border hover:bg-destructive/20 hover:border-destructive transition-colors"
                title={t.removeFav}
              >
                <Heart className="h-4 w-4 fill-secondary text-secondary" />
              </button>
              
              <div className="h-32 bg-muted relative overflow-hidden">
                {salon.photos ? (
                  <img src={salon.photos.split(',')[0]} alt={salon.name} className="w-full h-full object-cover opacity-80" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                    <Scissors className="h-8 w-8 text-primary/40" />
                  </div>
                )}
              </div>
              
              <CardContent className="p-4">
                <h3 className="font-bold text-lg leading-tight">{salon.name}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <MapPin className="h-3 w-3" />
                  <span>{salon.address || salon.city || t.notSet}</span>
                </div>
                
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-secondary text-secondary" />
                    <span className="font-bold">{salon.rating?.toFixed(1) || "4.8"}</span>
                  </div>
                  
                  <Link href={`/salon/${salon.id}`}>
                    <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/20">
                      {t.viewMap}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center p-16 border border-dashed rounded-xl border-border bg-card/20 flex flex-col items-center">
          <Heart className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-bold mb-2">{t.favoritesEmpty}</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">{t.favoritesEmptyHint}</p>
          <Link href="/explore">
            <Button className="shadow-[0_0_15px_rgba(255,31,142,0.3)] bg-secondary hover:bg-secondary/90 text-secondary-foreground">
              {t.browseSalons}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
