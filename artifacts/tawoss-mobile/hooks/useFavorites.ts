import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

export interface FavoriteSalon {
  id: number;
  name: string;
  address?: string;
  city?: string;
  rating?: number;
  is_live?: boolean;
  free_chairs?: number;
  total_chairs?: number;
  active_claims?: number;
  owner_name?: string;
  category?: string;
  favorited_at?: string;
}

export function useFavorites() {
  const { token } = useAuth();
  const qc = useQueryClient();

  const { data: favorites = [], isLoading, refetch } = useQuery<FavoriteSalon[]>({
    queryKey: ["favorites"],
    queryFn: () => api("GET", "/users/favorites", undefined, token),
    enabled: !!token,
  });

  const { data: favoriteIds = [] } = useQuery<number[]>({
    queryKey: ["favoriteIds"],
    queryFn: () => api("GET", "/users/favorites/ids", undefined, token),
    enabled: !!token,
  });

  const addMutation = useMutation({
    mutationFn: (salonId: number) =>
      api("POST", `/users/favorites/${salonId}`, undefined, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorites"] });
      qc.invalidateQueries({ queryKey: ["favoriteIds"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (salonId: number) =>
      api("DELETE", `/users/favorites/${salonId}`, undefined, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorites"] });
      qc.invalidateQueries({ queryKey: ["favoriteIds"] });
    },
  });

  const isFavorite = (salonId: number) => favoriteIds.includes(salonId);

  const toggle = async (salonId: number): Promise<"added" | "removed"> => {
    if (isFavorite(salonId)) {
      await removeMutation.mutateAsync(salonId);
      return "removed";
    } else {
      await addMutation.mutateAsync(salonId);
      return "added";
    }
  };

  return { favorites, favoriteIds, isLoading, refetch, isFavorite, toggle };
}
