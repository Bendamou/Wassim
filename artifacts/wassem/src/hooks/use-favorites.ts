import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";

export function useFavorites() {
  const { token } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);

  const fetchIds = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/users/favorites/ids", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setFavoriteIds(await res.json());
    } catch { /* silent */ }
  }, [token]);

  useEffect(() => { fetchIds(); }, [fetchIds]);

  const isFavorite = (salonId: number) => favoriteIds.includes(salonId);

  const toggle = async (salonId: number): Promise<"added" | "removed"> => {
    if (!token) return "removed";
    if (isFavorite(salonId)) {
      await fetch(`/api/users/favorites/${salonId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavoriteIds(prev => prev.filter(id => id !== salonId));
      return "removed";
    } else {
      await fetch(`/api/users/favorites/${salonId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavoriteIds(prev => [...prev, salonId]);
      return "added";
    }
  };

  return { favoriteIds, isFavorite, toggle, refetch: fetchIds };
}

export async function fetchFavoriteSalons(token: string) {
  const res = await fetch("/api/users/favorites", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}
