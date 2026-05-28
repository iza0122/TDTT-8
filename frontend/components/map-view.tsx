"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface MapViewProps {
  filteredRestaurants: any[];
  selectedRestaurant: any | null;
  onSelectRestaurant: (res: any) => void;
}

export function MapView({
  filteredRestaurants,
  selectedRestaurant,
  onSelectRestaurant
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load Google Maps API Script dynamically on the client side
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if google maps script is already loaded globally
    if ((window as any).google && (window as any).google.maps) {
      setIsLoaded(true);
      return;
    }

    const callbackName = "initGoogleMapCallback";
    (window as any)[callbackName] = () => {
      setIsLoaded(true);
    };

    // If script is not present in document, create it
    const existingScript = document.getElementById("google-maps-script");
    if (!existingScript) {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}&libraries=geometry&language=vi&region=VN`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  // Initialize Map Instance once Google Maps SDK is loaded
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    const google = (window as any).google;
    
    // Set map options (Hanoi coordinate as center placeholder)
    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 21.0285, lng: 105.8542 },
      zoom: 12,
      disableDefaultUI: true, // Apple maps style sleek floating UI
      zoomControl: false,
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false
    });

    mapInstanceRef.current = map;
    infoWindowRef.current = new google.maps.InfoWindow();
  }, [isLoaded]);

  // Sync Markers when filteredRestaurants list changes
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    const google = (window as any).google;
    const map = mapInstanceRef.current;
    const infoWindow = infoWindowRef.current;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Render new markers
    filteredRestaurants.forEach((res) => {
      const marker = new google.maps.Marker({
        position: { lat: res.lat, lng: res.lng },
        map: map,
        title: res.name,
        animation: google.maps.Animation.DROP
      });

      marker.addListener("click", () => {
        onSelectRestaurant(res);
        
        infoWindow.setContent(`
          <div style="padding: 4px; font-family: var(--font-sans), system-ui, sans-serif; max-width: 160px; color: #0f172a;">
            <h4 style="margin: 0 0 3px; font-size: 11px; font-weight: 800; line-height: 1.3;">${res.name}</h4>
            <p style="margin: 0 0 4px; font-size: 9px; color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${res.address}</p>
            <div style="display: flex; align-items: center; gap: 4px; font-size: 9px; font-weight: 700;">
              <span style="color: #f59e0b; display: flex; align-items: center;">★ ${res.rating}</span>
              <span style="color: #64748b; font-weight: 500;">(${res.reviews} đánh giá)</span>
            </div>
          </div>
        `);
        
        infoWindow.open({
          anchor: marker,
          map,
          shouldFocus: false,
        });
      });

      markersRef.current.push(marker);
    });
  }, [filteredRestaurants, isLoaded, onSelectRestaurant]);

  // Recenter map smoothly with PanTo when a restaurant is selected
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedRestaurant || !isLoaded) return;

    const map = mapInstanceRef.current;
    const google = (window as any).google;

    // Center map smoothly
    map.panTo({ lat: selectedRestaurant.lat, lng: selectedRestaurant.lng });
    map.setZoom(15);

    // Automatically trigger InfoWindow for the selected restaurant
    const selectedMarker = markersRef.current.find(
      (m) => 
        m.getPosition().lat().toFixed(4) === selectedRestaurant.lat.toFixed(4) && 
        m.getPosition().lng().toFixed(4) === selectedRestaurant.lng.toFixed(4)
    );

    if (selectedMarker && infoWindowRef.current) {
      const infoWindow = infoWindowRef.current;
      infoWindow.setContent(`
        <div style="padding: 4px; font-family: var(--font-sans), system-ui, sans-serif; max-width: 160px; color: #0f172a;">
          <h4 style="margin: 0 0 3px; font-size: 11px; font-weight: 800; line-height: 1.3;">${selectedRestaurant.name}</h4>
          <p style="margin: 0 0 4px; font-size: 9px; color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${selectedRestaurant.address}</p>
          <div style="display: flex; align-items: center; gap: 4px; font-size: 9px; font-weight: 700;">
            <span style="color: #f59e0b; display: flex; align-items: center;">★ ${selectedRestaurant.rating}</span>
            <span style="color: #64748b; font-weight: 500;">(${selectedRestaurant.reviews} đánh giá)</span>
          </div>
        </div>
      `);
      infoWindow.open({
        anchor: selectedMarker,
        map,
        shouldFocus: false,
      });
    }
  }, [selectedRestaurant, isLoaded]);

  return (
    <div ref={mapRef} className="h-full w-full z-0 bg-muted/20" />
  );
}
