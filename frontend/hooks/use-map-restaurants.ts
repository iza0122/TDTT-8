"use client";

import { useState, useEffect, useCallback } from "react";
import { searchMerchantsGeo, Restaurant } from "@/lib/services/merchant";

export function useMapRestaurants() {
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [restaurantsList, setRestaurantsList] = useState<Restaurant[]>([]);
  const [isFetchingRestaurants, setIsFetchingRestaurants] = useState(false);

  // Handle client-side detection to avoid SSR mismatches
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch restaurants via the API service with query and category filters
  useEffect(() => {
    if (!isClient) return;

    const loadRestaurants = async () => {
      setIsFetchingRestaurants(true);
      try {
        // Center coordinates placeholder (HCMC)
        const lat = 10.775;
        const lng = 106.690;
        const radius = 15.0;

        const data = await searchMerchantsGeo({
          lat,
          lng,
          radius,
          q: searchQuery,
          category: activeCategory
        });

        setRestaurantsList(data);
      } catch (err) {
        console.error("Lỗi khi tải danh sách quán ăn bản đồ từ hook:", err);
      } finally {
        setIsFetchingRestaurants(false);
      }
    };

    // Debounce search query by 300ms
    const delayDebounce = setTimeout(() => {
      loadRestaurants();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, activeCategory, isClient]);

  // Handler for selecting a restaurant (e.g. from list or marker)
  const handleSelectRestaurant = useCallback((res: Restaurant | null) => {
    setSelectedRestaurant(res);
    if (res && typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsPanelOpen(false);
    }
  }, []);

  return {
    restaurantsList,
    isFetchingRestaurants,
    selectedRestaurant,
    setSelectedRestaurant,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    isPanelOpen,
    setIsPanelOpen,
    isClient,
    handleSelectRestaurant
  };
}
