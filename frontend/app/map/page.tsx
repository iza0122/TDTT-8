"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { MapPin, Star, Clock, X, Search, ChevronRight, ChevronLeft, Home, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryFilter } from "@/components/category-filter";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useMapRestaurants } from "@/hooks/use-map-restaurants";

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
  const {
    restaurantsList,
    isFetchingRestaurants,
    isLocationResolved,
    selectedRestaurant,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    radius,
    setRadius,
    searchCenter,
    userLocation,
    isLocating,
    getCurrentLocation,
    isPanelOpen,
    setIsPanelOpen,
    isClient,
    handleSelectRestaurant
  } = useMapRestaurants();

  const filteredRestaurants = restaurantsList;

  return (
    <div className="h-screen w-screen bg-background overflow-hidden relative flex flex-col font-sans select-none">
      
      {/* Dynamic Staggered Animations injected via Style Block */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
      `}} />

      {/* Map Container - Full screen background */}
      <div className="absolute inset-0 w-full h-full z-0">
        {isClient && (
          <MapView
            filteredRestaurants={filteredRestaurants}
            selectedRestaurant={selectedRestaurant}
            onSelectRestaurant={handleSelectRestaurant}
            mapCenter={searchCenter}
            userLocation={userLocation}
          />
        )}
      </div>

      {/* FLOATING LEFT SIDEBAR / SPLIT PANEL - OUTER SHELL (Double-Bezel Architecture) */}
      <div
        className={cn(
          "flex flex-col w-[calc(100%-64px)] sm:w-80 lg:w-96 absolute top-4 lg:top-6 bottom-4 lg:bottom-6 z-20 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          "p-1.5 rounded-[2rem] bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/10 shadow-2xl backdrop-blur-xl",
          isPanelOpen 
            ? "left-4 lg:left-6 opacity-100 translate-x-0" 
            : "-translate-x-[calc(100%+24px)] opacity-0 pointer-events-none"
        )}
      >
        {/* INNER CORE (Double-Bezel Architecture) */}
        <div className="flex flex-col w-full h-full rounded-[calc(2rem-6px)] bg-card/75 dark:bg-card/45 overflow-hidden border border-white/5 shadow-inner">
          
          {/* Header containing title and search */}
          <div className="p-4.5 border-b border-border/40 space-y-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-foreground tracking-tight flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
                Khám phá địa điểm
              </h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsPanelOpen(false)}
                className="h-7 w-7 rounded-full hover:bg-muted/80 hover:scale-105 active:scale-95 transition-all duration-300"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </div>
            
            {/* Search Input bar */}
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-orange-500 transition-colors duration-300" />
              <input
                type="text"
                placeholder="Tìm địa chỉ, tên quán ăn..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "w-full bg-secondary/40 hover:bg-secondary/60 focus:bg-background text-foreground placeholder:text-muted-foreground/60 pl-10 pr-9 py-2.5 rounded-xl border border-border/40 focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all duration-300 text-xs font-semibold"
                )}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground active:scale-90 transition-all duration-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Bán kính quét / Radius Adjustment Pills */}
            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                  Bán kính quét: <span className="text-orange-500 font-black">{radius} km</span>
                </label>
              </div>
              <div className="flex gap-1 bg-secondary/35 p-1 rounded-xl border border-border/30">
                {[5, 10, 15, 20].map((value) => {
                  const isActive = radius === value;
                  return (
                    <button
                      key={`radius-${value}`}
                      onClick={() => setRadius(value)}
                      className={cn(
                        "flex-1 text-[10px] font-bold py-1.5 rounded-lg transition-all duration-300 cursor-pointer text-center",
                        isActive 
                          ? "bg-orange-500 text-white shadow-xs font-black scale-102"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      )}
                    >
                      {value} km
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Category Pills */}
            <div className="-mx-4.5 -mb-4.5 px-0.5">
              <CategoryFilter activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
            </div>
          </div>

          {/* Restaurants vertical scroll area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
            {(isFetchingRestaurants || !isLocationResolved) ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div 
                    key={`map-skeleton-${i}`} 
                    className="w-full flex gap-3.5 p-3 rounded-2xl border border-border/40 bg-card/60 shadow-xs animate-pulse"
                  >
                    <div className="w-14 h-14 bg-secondary/80 dark:bg-muted/30 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2 py-1.5 min-w-0">
                      <div className="h-3.5 bg-secondary/80 dark:bg-muted/30 rounded-full w-2/3 animate-pulse" />
                      <div className="h-2.5 bg-secondary/80 dark:bg-muted/30 rounded-full w-1/2 animate-pulse" />
                      <div className="flex justify-between items-center pt-2">
                        <div className="w-12 h-3.5 bg-secondary/80 dark:bg-muted/30 rounded-md" />
                        <div className="w-12 h-3.5 bg-secondary/80 dark:bg-muted/30 rounded-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredRestaurants.length > 0 ? (
              filteredRestaurants.map((res, index) => {
                const isSelected = selectedRestaurant?.id === res.id;
                return (
                  <button
                    key={res.id}
                    onClick={() => handleSelectRestaurant(res)}
                    style={{ animationDelay: `${index * 40}ms` }}
                    className={cn(
                      "w-full text-left flex gap-3.5 p-3 rounded-2xl border transition-all duration-300 bg-card/60 shadow-xs group cursor-pointer ease-[cubic-bezier(0.34,1.56,0.64,1)] animate-slide-up",
                      isSelected 
                        ? "border-orange-500/80 ring-2 ring-orange-500/10 bg-orange-500/5 shadow-md scale-102" 
                        : "border-border/40 hover:border-orange-500/20 hover:bg-card/90 hover:scale-101"
                    )}
                  >
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-border/30 shadow-xs">
                      <Image
                        src={res.image}
                        alt={res.name}
                        fill
                        sizes="56px"
                        className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-108"
                        priority={index < 3}
                        loading={index < 3 ? "eager" : "lazy"}
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <h4 className="font-extrabold text-xs text-foreground group-hover:text-orange-500 transition-colors duration-300 truncate">
                          {res.name}
                        </h4>
                        <p className="text-[10px] text-muted-foreground/60 leading-tight truncate mt-0.5">{res.address}</p>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-0.5 bg-orange-500/10 px-1.5 py-0.5 rounded text-[9px] font-extrabold text-orange-500 transition-all group-hover:bg-orange-500 group-hover:text-white">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            <span>{res.rating}</span>
                          </div>
                          <span className="text-[9px] text-muted-foreground/60 font-semibold">{res.category}</span>
                        </div>
                        {res.distance !== undefined ? (
                          <span className="text-[9px] text-orange-500 font-bold bg-orange-500/5 px-1.5 py-0.5 rounded-full">
                            {res.distance.toFixed(1)} km
                          </span>
                        ) : (
                          <span className="text-[9px] text-muted-foreground/75 font-bold">{res.priceRange}</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-12 px-4 space-y-3 bg-card/40 border border-border/40 rounded-2xl">
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
      </div>

      {/* Floating Toggle Button for Split Panel */}
      <button
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className={cn(
          "flex w-10 h-10 rounded-full bg-card/80 backdrop-blur-xl border border-white/10 shadow-2xl items-center justify-center hover:bg-orange-500 hover:text-white hover:border-orange-500 active:scale-95 hover:scale-105 transition-all duration-300 text-foreground cursor-pointer z-20 absolute top-4 lg:top-6 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          isPanelOpen 
            ? "left-[calc(100%-52px)] sm:left-[340px] lg:left-[412px]" 
            : "left-4 lg:left-6"
        )}
        aria-label={isPanelOpen ? "Đóng bảng tìm kiếm" : "Mở bảng tìm kiếm"}
      >
        {isPanelOpen ? (
          <ChevronLeft className="w-4 h-4 transition-transform duration-300" />
        ) : (
          <ChevronRight className="w-4 h-4 transition-transform duration-300" />
        )}
      </button>

      {/* Floating Home Button below the Panel Toggle Button */}
      <Link href="/">
        <button
          className={cn(
            "flex w-10 h-10 rounded-full bg-card/80 backdrop-blur-xl border border-white/10 shadow-2xl items-center justify-center hover:bg-orange-500 hover:text-white hover:border-orange-500 active:scale-95 hover:scale-105 transition-all duration-300 text-foreground cursor-pointer z-20 absolute top-[68px] lg:top-[76px] ease-[cubic-bezier(0.34,1.56,0.64,1)]",
            isPanelOpen 
              ? "left-[calc(100%-52px)] sm:left-[340px] lg:left-[412px]" 
              : "left-4 lg:left-6"
          )}
          aria-label="Trở về trang chủ"
        >
          <Home className="w-4.5 h-4.5" />
        </button>
      </Link>

      {/* Floating Locate Me Button below the Home Button */}
      <button
        onClick={getCurrentLocation}
        disabled={isLocating}
        className={cn(
          "flex w-10 h-10 rounded-full bg-card/80 backdrop-blur-xl border border-white/10 shadow-2xl items-center justify-center hover:bg-orange-500 hover:text-white hover:border-orange-500 active:scale-95 hover:scale-105 transition-all duration-300 text-foreground cursor-pointer z-20 absolute top-[120px] lg:top-[128px] ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          isPanelOpen 
            ? "left-[calc(100%-52px)] sm:left-[340px] lg:left-[412px]" 
            : "left-4 lg:left-6"
        )}
        aria-label="Lấy vị trí hiện tại của tôi"
      >
        <Navigation className={cn("w-4.5 h-4.5", isLocating && "animate-spin text-orange-500")} />
      </button>


      {/* Floating Selected Restaurant Detail overlay - OUTER SHELL (Double-Bezel Architecture) */}
      {selectedRestaurant && (
        <div 
          className={cn(
            "absolute z-20 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] animate-fade-in",
            "bottom-4 left-4 right-4 lg:bottom-6 lg:top-auto lg:left-auto lg:right-auto lg:max-w-md",
            "p-1.5 rounded-[2rem] bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/10 shadow-2xl backdrop-blur-xl",
            isPanelOpen 
              ? "lg:left-[412px]" 
              : "lg:left-6"
          )}
        >
          {/* INNER CORE (Double-Bezel Architecture) */}
          <div className="w-full rounded-[calc(2rem-6px)] bg-card/85 dark:bg-card/55 overflow-hidden border border-white/5 shadow-inner">
            <div className="relative h-28 lg:h-32 group/image">
              <Image
                src={selectedRestaurant.image}
                alt={selectedRestaurant.name}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover/image:scale-105"
              />
              <button
                onClick={() => handleSelectRestaurant(null)}
                className="absolute top-3 right-3 w-7 h-7 bg-card/75 hover:bg-orange-500 hover:text-white backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer shadow-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4 bg-gradient-to-b from-card to-card/90">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-foreground leading-snug">{selectedRestaurant.name}</h3>
                  <p className="text-[10px] text-muted-foreground/60 mt-1 font-semibold">{selectedRestaurant.category} • {selectedRestaurant.priceRange}</p>
                </div>
                <div className="flex items-center gap-1 bg-gradient-to-br from-orange-500 to-amber-500 px-2.5 py-1 rounded-xl text-white shadow-md hover:scale-105 transition-all duration-300">
                  <Star className="w-3 h-3 fill-white text-white" />
                  <span className="font-extrabold text-[10px]">{selectedRestaurant.rating}</span>
                </div>
              </div>
              
              <div className="space-y-1.5 text-[10px] text-muted-foreground/70">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-orange-500/70" />
                  <span className="truncate text-muted-foreground/60 font-semibold">{selectedRestaurant.address}</span>
                </div>
                <div className="flex items-center gap-2 pt-0.5">
                  <Clock className="w-3.5 h-3.5 text-orange-500/70" />
                  <span className="text-muted-foreground/60 font-semibold">{selectedRestaurant.openTime}</span>
                  <span className={cn(
                    "ml-2 px-2 py-0.5 rounded-full text-[9px] font-bold border",
                    selectedRestaurant.isOpen 
                      ? "bg-accent/10 text-accent border-accent/20" 
                      : "bg-destructive/10 text-destructive border-destructive/20"
                  )}>
                    {selectedRestaurant.isOpen ? "Đang mở cửa" : "Đã đóng cửa"}
                  </span>
                </div>
              </div>

              {/* Nested CTA Pill (Button-in-Button Architecture) */}
              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={() => {
                    if (selectedRestaurant?.lat && selectedRestaurant?.lng) {
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedRestaurant.lat},${selectedRestaurant.lng}`;
                      window.open(url, "_blank");
                    }
                  }}
                  size="sm" 
                  className={cn(
                    "flex-1 text-xs font-extrabold rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md hover:shadow-lg active:scale-95 group transition-all duration-300",
                    "pr-2 pl-4 py-2 flex items-center justify-between border-0 cursor-pointer"
                  )}
                >
                  <span>Chỉ đường</span>
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:translate-x-1 group-hover:-translate-y-0.5 group-hover:bg-white/30">
                    <Navigation className="w-2.5 h-2.5 fill-white text-white" />
                  </div>
                </Button>
                
                <Link href={`/merchant/${selectedRestaurant.id}`} passHref>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className={cn(
                      "flex-1 text-xs font-bold rounded-full border border-border/80 bg-background/40 hover:bg-muted active:scale-95 hover:scale-101 transition-all duration-300",
                      "py-2 flex items-center justify-center cursor-pointer"
                    )}
                  >
                    Xem chi tiết
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
