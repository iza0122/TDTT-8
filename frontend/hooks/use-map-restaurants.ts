"use client";

import { useState, useEffect, useCallback } from "react";
import { searchMerchantsGeo, Restaurant } from "@/lib/services/merchant";
import { toast } from "@/hooks/use-toast";

export function useMapRestaurants() {
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [radius, setRadius] = useState(20.0);
  const [searchCenter, setSearchCenter] = useState({ lat: 10.775, lng: 106.690 });
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isLocationResolved, setIsLocationResolved] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [restaurantsList, setRestaurantsList] = useState<Restaurant[]>([]);
  const [isFetchingRestaurants, setIsFetchingRestaurants] = useState(false);

  // Retrieve user location using Geolocation API
  const getCurrentLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast({
        title: "Thiết bị không hỗ trợ định vị",
        description: "Trình duyệt của bạn không hỗ trợ tính năng định vị GPS tự động.",
        variant: "destructive",
      });
      setIsLocationResolved(true);
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coords = { lat: latitude, lng: longitude };
        setSearchCenter(coords);
        setUserLocation(coords);
        setIsLocating(false);
        setIsLocationResolved(true);
        
        toast({
          title: "Định vị thành công",
          description: "Đã cập nhật bản đồ theo tọa độ hiện tại của bạn.",
          variant: "success",
          duration: 3000,
        });
      },
      (error) => {
        console.warn("Lỗi định vị hoặc bị từ chối quyền truy cập GPS:", error.message || error);
        toast({
          title: "Sử dụng vị trí mặc định",
          description: "Không thể lấy GPS (đã từ chối hoặc hết hạn). Mặc định hiển thị trung tâm Quận 1, TP.HCM.",
          variant: "warning",
          duration: 6000,
        });
        setIsLocating(false);
        setIsLocationResolved(true);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, []);

  // Handle client-side detection and auto-trigger geolocation on startup
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined" && navigator.geolocation) {
      const timer = setTimeout(() => {
        getCurrentLocation();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setIsLocationResolved(true);
    }
  }, [getCurrentLocation]);

  // Fetch restaurants via the API service with query and category filters
  useEffect(() => {
    if (!isClient || !isLocationResolved) return;

    const loadRestaurants = async () => {
      setIsFetchingRestaurants(true);
      try {
        const data = await searchMerchantsGeo({
          lat: searchCenter.lat,
          lng: searchCenter.lng,
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
  }, [searchQuery, activeCategory, radius, searchCenter, isLocationResolved, isClient]);

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
    isLocationResolved,
    selectedRestaurant,
    setSelectedRestaurant,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    radius,
    setRadius,
    searchCenter,
    setSearchCenter,
    userLocation,
    isLocating,
    getCurrentLocation,
    isPanelOpen,
    setIsPanelOpen,
    isClient,
    handleSelectRestaurant
  };
}
