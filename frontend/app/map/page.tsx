"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { MapPin, Star, Clock, X, Search, ChevronRight, ChevronLeft, Home, Navigation } from "lucide-react";
import { restaurants } from "@/lib/data";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import { CategoryFilter } from "@/components/category-filter";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Dynamic import for MapView to completely avoid Next.js SSR window/leaflet ReferenceErrors
const MapView = dynamic(
  () => import("@/components/map-view").then((mod) => mod.MapView),
  { 
    ssr: false, 
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-muted/25">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground font-semibold">Đang tải bản đồ ẩm thực...</p>
        </div>
      </div>
    )
  }
);

export default function MapPage() {
  const [selectedRestaurant, setSelectedRestaurant] = useState<typeof restaurants[0] | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSelectRestaurant = (res: typeof restaurants[0] | null) => {
    setSelectedRestaurant(res);
    if (res && typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsPanelOpen(false);
    }
  };

  // Filter restaurants based on active category and search query
  const filteredRestaurants = restaurants.filter((restaurant) => {
    // 1. Category Filter
    if (activeCategory !== "all") {
      const categoryId = activeCategory.toLowerCase();
      const restaurantCategory = restaurant.category.toLowerCase();
      
      const categoryMap: { [key: string]: string } = {
        pho: "phở",
        bun: "bún",
        com: "cơm",
        banh: "bánh",
        cafe: "cà phê",
        tra: "trà sữa",
        lau: "lẩu"
      };
      
      const targetCategory = categoryMap[categoryId];
      if (targetCategory && !restaurantCategory.includes(targetCategory)) {
        return false;
      }
    }

    // 2. Search Query Filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      return (
        restaurant.name.toLowerCase().includes(query) ||
        restaurant.address.toLowerCase().includes(query) ||
        restaurant.category.toLowerCase().includes(query)
      );
    }

    return true;
  });

  return (
    <div className="h-screen w-screen bg-background overflow-hidden relative flex flex-col">
      
      {/* Map Container - Full screen background */}
      <div className="absolute inset-0 w-full h-full z-0">
        {isClient && (
          <MapView
            filteredRestaurants={filteredRestaurants}
            selectedRestaurant={selectedRestaurant}
            onSelectRestaurant={handleSelectRestaurant}
          />
        )}
      </div>

      {/* FLOATING LEFT SIDEBAR / SPLIT PANEL (Responsive for both Mobile & Desktop) */}
      <div
        className={cn(
          "flex flex-col w-[calc(100%-72px)] sm:w-80 lg:w-96 absolute top-4 lg:top-6 bottom-4 lg:bottom-6 bg-card/90 backdrop-blur-md rounded-2xl border border-border shadow-2xl z-20 transition-all duration-300 ease-in-out",
          isPanelOpen 
            ? "left-4 lg:left-6 opacity-100" 
            : "-translate-x-[calc(100%+24px)] opacity-0 pointer-events-none"
        )}
      >
        {/* Header containing title and search */}
        <div className="p-4 border-b border-border space-y-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground tracking-tight">Khám phá địa điểm</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsPanelOpen(false)}
              className="h-8 w-8 rounded-full hover:bg-muted"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
          
          {/* Search Input bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm kiếm địa chỉ, tên quán ăn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-secondary/60 hover:bg-secondary/80 focus:bg-background text-foreground placeholder:text-muted-foreground pl-9 pr-9 py-2 rounded-xl border border-border/60 focus:border-primary/50 focus:outline-none transition-all text-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Custom Category Pills */}
          <div className="-mx-4 px-2">
            <CategoryFilter activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
          </div>
        </div>

        {/* Restaurants vertical scroll area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-hide">
          {filteredRestaurants.length > 0 ? (
            filteredRestaurants.map((res, index) => {
              const isSelected = selectedRestaurant?.id === res.id;
              return (
                <button
                  key={res.id}
                  onClick={() => handleSelectRestaurant(res)}
                  className={cn(
                    "w-full text-left flex gap-3 p-3.5 rounded-2xl border transition-all duration-200 bg-card shadow-xs group",
                    isSelected 
                      ? "border-primary ring-2 ring-primary/20 bg-primary/5" 
                      : "border-border/60 hover:border-primary/20"
                  )}
                >
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                    <Image
                      src={res.image}
                      alt={res.name}
                      fill
                      sizes="56px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      priority={index < 3}
                      loading={index < 3 ? "eager" : "lazy"}
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                        {res.name}
                      </h4>
                      <p className="text-[10px] text-muted-foreground/50 leading-tight truncate mt-0.5">{res.address}</p>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-0.5 bg-orange-500/10 px-1.5 py-0.5 rounded text-[9px] font-extrabold text-orange-500">
                          <Star className="w-2.5 h-2.5 fill-orange-500 text-orange-500" />
                          <span>{res.rating}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/50 font-semibold">{res.category}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground/75 font-bold">{res.priceRange}</span>
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="text-center py-12 px-4 space-y-3 bg-card border border-border/80 rounded-2xl">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-foreground">Không tìm thấy địa điểm</h4>
                <p className="text-[10px] text-muted-foreground mt-1">Hãy thử tìm với từ khóa khác</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Toggle Button for Split Panel (Responsive for both Mobile & Desktop) */}
      <button
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className={cn(
          "flex w-10 h-10 rounded-full bg-card/95 backdrop-blur-md border border-border shadow-xl items-center justify-center hover:bg-orange-500 hover:text-white hover:border-orange-500 active:scale-95 transition-all duration-300 text-foreground cursor-pointer z-20 absolute top-4 lg:top-6",
          isPanelOpen 
            ? "left-[calc(100%-56px)] sm:left-[344px] lg:left-[416px]" 
            : "left-4 lg:left-6"
        )}
        aria-label={isPanelOpen ? "Đóng bảng tìm kiếm" : "Mở bảng tìm kiếm"}
      >
        {isPanelOpen ? (
          <ChevronLeft className="w-5 h-5" />
        ) : (
          <ChevronRight className="w-5 h-5" />
        )}
      </button>

      {/* Floating Home Button below the Panel Toggle Button (Responsive for both Mobile & Desktop) */}
      <Link href="/">
        <button
          className={cn(
            "flex w-10 h-10 rounded-full bg-card/95 backdrop-blur-md border border-border shadow-xl items-center justify-center hover:bg-orange-500 hover:text-white hover:border-orange-500 active:scale-95 transition-all duration-300 text-foreground cursor-pointer z-20 absolute top-[68px] lg:top-[76px]",
            isPanelOpen 
              ? "left-[calc(100%-56px)] sm:left-[344px] lg:left-[416px]" 
              : "left-4 lg:left-6"
          )}
          aria-label="Trở về trang chủ"
        >
          <Home className="w-5 h-5" />
        </button>
      </Link>

      {/* Floating Selected Restaurant Detail overlay (Visible above the map on Desktop and Mobile) */}
      {selectedRestaurant && (
        <div 
          className={cn(
            "absolute z-20 border border-border/80 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 bg-card",
            // Responsive placement:
            // Mobile: bottom-4, left-4, right-4
            // Desktop: bottom-6, left changes based on whether split panel is open or closed
            "bottom-4 left-4 right-4 lg:bottom-6 lg:top-auto lg:left-auto lg:right-auto lg:max-w-md",
            isPanelOpen 
              ? "lg:left-[416px]" 
              : "lg:left-6"
          )}
        >
          <div className="relative h-28 lg:h-32">
            <Image
              src={selectedRestaurant.image}
              alt={selectedRestaurant.name}
              fill
              className="object-cover"
            />
            <button
              onClick={() => setSelectedRestaurant(null)}
              className="absolute top-2.5 right-2.5 w-7 h-7 bg-card/85 backdrop-blur-md rounded-full flex items-center justify-center border border-border/50 hover:bg-muted transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-4 space-y-3 bg-gradient-to-b from-card to-card/90">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-black text-base text-foreground leading-tight">{selectedRestaurant.name}</h3>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">{selectedRestaurant.category} • {selectedRestaurant.priceRange}</p>
              </div>
              <div className="flex items-center gap-1 bg-gradient-to-br from-orange-500 to-amber-500 px-2.5 py-1 rounded-xl text-white shadow-xs">
                <Star className="w-3.5 h-3.5 fill-white text-white" />
                <span className="font-extrabold text-xs">{selectedRestaurant.rating}</span>
              </div>
            </div>
            <div className="space-y-1 text-[10px] text-muted-foreground/70">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground/50" />
                <span className="truncate text-muted-foreground/60">{selectedRestaurant.address}</span>
              </div>
              <div className="flex items-center gap-1.5 pt-0.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground/50" />
                <span className="text-muted-foreground/60">{selectedRestaurant.openTime}</span>
                <span className={cn(
                  "ml-2 px-2 py-0.5 rounded-full text-[9px] font-bold",
                  selectedRestaurant.isOpen ? "bg-accent/25 text-accent" : "bg-destructive/20 text-destructive"
                )}>
                  {selectedRestaurant.isOpen ? "Đang mở cửa" : "Đã đóng cửa"}
                </span>
              </div>
            </div>
            <div className="flex gap-2.5 pt-2">
              <Button size="sm" className="flex-1 text-xs font-bold gap-1.5 rounded-xl">
                <Navigation className="w-3 h-3" />
                Chỉ đường
              </Button>
              <Button size="sm" variant="outline" className="flex-1 text-xs font-bold rounded-xl">
                Xem chi tiết
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
