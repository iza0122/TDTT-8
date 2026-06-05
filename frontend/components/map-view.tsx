"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { AlertCircle } from "lucide-react";

// Retrieve Mapbox token from environment variables
const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";
const hasValidToken = mapboxToken && mapboxToken.trim() !== "" && mapboxToken !== "your_mapbox_access_token_here";

if (hasValidToken) {
  mapboxgl.accessToken = mapboxToken;
}

interface MapViewProps {
  filteredRestaurants: any[];
  selectedRestaurant: any | null;
  onSelectRestaurant: (res: any) => void;
  mapCenter?: { lat: number; lng: number };
  userLocation?: { lat: number; lng: number } | null;
}

export function MapView({
  filteredRestaurants,
  selectedRestaurant,
  onSelectRestaurant,
  mapCenter,
  userLocation
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [tokenError, setTokenError] = useState(!hasValidToken);

  // Initialize Mapbox Map Instance
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !hasValidToken) return;

    try {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [106.690, 10.775], // Ho Chi Minh City coordinates [lng, lat]
        zoom: 12,
        attributionControl: false
      });

      // Add standard zoom and navigation controls
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

      mapRef.current = map;
    } catch (err) {
      console.error("Lỗi khi khởi tạo bản đồ Mapbox:", err);
      setTokenError(true);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Sync User Location Marker
  useEffect(() => {
    if (!mapRef.current || !hasValidToken) return;
    const map = mapRef.current;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const userEl = document.createElement("div");
      userEl.className = "user-location-marker";
      userEl.innerHTML = `
        <div class="user-pulse"></div>
        <div class="user-dot"></div>
      `;
      userMarkerRef.current = new mapboxgl.Marker({ element: userEl })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map);
    }
  }, [userLocation, hasValidToken]);

  // Recenter map smoothly when mapCenter coordinates change
  useEffect(() => {
    if (!mapRef.current || !hasValidToken || !mapCenter) return;
    
    const map = mapRef.current;
    
    // Check if map is already centered close to avoid jumpiness
    const currentCenter = map.getCenter();
    const isClose = Math.abs(currentCenter.lat - mapCenter.lat) < 0.0001 && 
                    Math.abs(currentCenter.lng - mapCenter.lng) < 0.0001;
                    
    if (!isClose) {
      map.easeTo({
        center: [mapCenter.lng, mapCenter.lat],
        zoom: 13,
        duration: 1000
      });
    }
  }, [mapCenter, hasValidToken]);

  // Sync Markers when filteredRestaurants list changes
  useEffect(() => {
    if (!mapRef.current || !hasValidToken) return;

    const map = mapRef.current;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Render new markers
    filteredRestaurants.forEach((res) => {
      if (!res.lng || !res.lat) return;

      // Create a premium custom marker wrapper element
      const el = document.createElement("div");
      el.className = "custom-gourmet-marker";
      el.setAttribute("data-restaurant-id", res.id);
      
      if (selectedRestaurant && selectedRestaurant.id === res.id) {
        el.classList.add("active");
      }

      el.innerHTML = `
        <div class="marker-pulse"></div>
        <div class="marker-pin">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width: 15px; height: 15px; color: white;">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
            <path d="M7 2v4M11 2v4M3 2v4" />
            <path d="M15 2v12a3 3 0 0 0 3 3h1v5h2v-5h1a3 3 0 0 0 3-3V2" />
            <path d="M7 11v11" />
          </svg>
        </div>
        <div class="marker-label">
          <span class="restaurant-name">${res.name}</span>
          <span class="restaurant-rating">★ ${res.rating}</span>
        </div>
      `;

      // Set up Mapbox Marker
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([res.lng, res.lat])
        .addTo(map);

      // Marker click event to select restaurant
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectRestaurant(res);
      });

      markersRef.current.push(marker);
    });

    // Auto-fit map camera bounds to show all markers inside the viewport
    if (filteredRestaurants.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      
      filteredRestaurants.forEach((res) => {
        if (res.lng && res.lat) {
          bounds.extend([res.lng, res.lat]);
        }
      });

      // Calculate responsive map padding offsets to prevent left sidebar and detail panels overlaying pins
      const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024;
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      
      const paddingLeft = isDesktop ? 440 : 20;
      const paddingBottom = isMobile ? 120 : (isDesktop ? 20 : 260);
      const paddingTop = 40;
      const paddingRight = 40;

      map.fitBounds(bounds, {
        padding: { top: paddingTop, bottom: paddingBottom, left: paddingLeft, right: paddingRight },
        maxZoom: 15, // Cap maximum zoom (to prevent overzooming on a single pin)
        duration: 1200 // Smooth zoom animation duration
      });
    }
  }, [filteredRestaurants, onSelectRestaurant]);

  // Recenter map smoothly and toggle active class when a restaurant is selected
  useEffect(() => {
    if (!mapRef.current || !hasValidToken) return;

    // Update markers active classes in DOM
    markersRef.current.forEach((marker) => {
      const el = marker.getElement();
      const isSelected = selectedRestaurant && el.getAttribute("data-restaurant-id") === selectedRestaurant.id;
      if (isSelected) {
        el.classList.add("active");
        el.style.zIndex = "50";
      } else {
        el.classList.remove("active");
        el.style.zIndex = "10";
      }
    });

    if (!selectedRestaurant) return;

    const map = mapRef.current;

    // Tối ưu hóa bố cục: Dịch chuyển tâm bản đồ (offset) để tránh bị đè bởi sidebar bên trái và chi tiết quán ăn
    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024;
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const paddingLeft = isDesktop ? 420 : 0;
    const paddingBottom = isMobile ? 300 : (isDesktop ? 0 : 250);

    // Center map smoothly with offset padding
    map.easeTo({
      center: [selectedRestaurant.lng, selectedRestaurant.lat],
      zoom: 15.5,
      duration: 1000,
      padding: { left: paddingLeft, right: 0, top: 0, bottom: paddingBottom }
    });
  }, [selectedRestaurant, hasValidToken]);

  if (tokenError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/20 p-6 z-0">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-6 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-foreground">Yêu cầu cấu hình Mapbox</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Vui lòng cập nhật biến môi trường <code className="bg-secondary px-1.5 py-0.5 rounded font-mono text-[10px] text-primary">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> với khóa truy cập Mapbox hợp lệ trong tệp <code className="bg-secondary px-1.5 py-0.5 rounded font-mono text-[10px] text-primary">.env.local</code> (hoặc <code className="bg-secondary px-1.5 py-0.5 rounded font-mono text-[10px] text-primary">.env</code>) ở thư mục frontend, sau đó khởi động lại máy chủ phát triển.
            </p>
          </div>
          <div className="pt-3 text-[10px] text-muted-foreground/60 border-t border-border">
            Bạn có thể đăng ký tài khoản miễn phí tại <a href="https://mapbox.com" target="_blank" rel="noreferrer" className="text-primary hover:underline font-semibold">mapbox.com</a> để nhận Access Token.
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* Mapbox default overrides */
        .mapboxgl-marker {
          position: absolute !important;
          will-change: transform;
        }

        /* Custom Marker styles */
        .custom-gourmet-marker {
          position: relative;
          width: 38px;
          height: 38px;
          cursor: pointer;
          z-index: 10;
        }

        .custom-gourmet-marker:hover {
          z-index: 20;
        }

        .custom-gourmet-marker:hover .marker-pin {
          transform: scale(1.12);
        }

        .custom-gourmet-marker.active .marker-pin {
          transform: scale(1.28);
          background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
          border-color: #ffffff;
        }

        .custom-gourmet-marker.active:hover .marker-pin {
          transform: scale(1.35);
        }

        .marker-pin {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          border: 2.5px solid #ffffff;
          box-shadow: 
            0 4px 10px rgba(0, 0, 0, 0.15), 
            inset 0 1px 0 rgba(255, 255, 255, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s ease, border-color 0.3s ease;
        }

        .marker-pulse {
          position: absolute;
          top: -4px;
          left: -4px;
          right: -4px;
          bottom: -4px;
          border-radius: 50%;
          border: 2px solid #f97316;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }

        .custom-gourmet-marker.active .marker-pulse {
          animation: marker-pulse-anim 2s infinite ease-out;
          opacity: 1;
        }

        @keyframes marker-pulse-anim {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }

        .marker-label {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translate(-50%, -6px) scale(0.9);
          background: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #ffffff;
          padding: 3px 8px;
          border-radius: 9999px;
          font-size: 10px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 5px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          white-space: nowrap;
        }

        .custom-gourmet-marker:hover .marker-label,
        .custom-gourmet-marker.active .marker-label {
          opacity: 1;
          transform: translate(-50%, -6px) scale(1);
        }

        .restaurant-rating {
          color: #f59e0b;
        }

        /* User location blue dot pulse marker styles */
        .user-location-marker {
          width: 20px;
          height: 20px;
          position: relative;
          z-index: 40;
        }
        .user-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #3b82f6;
          border: 2px solid #ffffff;
          box-shadow: 0 0 6px rgba(0, 0, 0, 0.2);
          position: absolute;
          top: 3px;
          left: 3px;
        }
        .user-pulse {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.4);
          position: absolute;
          top: 0;
          left: 0;
          animation: user-pulse-anim 2s infinite ease-out;
        }
        @keyframes user-pulse-anim {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          100% {
            transform: scale(3);
            opacity: 0;
          }
        }

      `}} />
      <div ref={mapContainerRef} className="h-full w-full z-0 bg-muted/10" />
    </>
  );
}

