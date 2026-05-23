import React from "react";
import { MerchantMarker } from "../discovery-services";

interface MapViewProps {
  merchants: MerchantMarker[];
  userLocation: { lat: number; lng: number };
}

export default function MapView({ merchants, userLocation }: MapViewProps) {
  return (
    <div className="relative w-full h-full bg-emerald-50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] flex items-center justify-center overflow-hidden">
      
      {/* VỊ TRÍ CỦA TÔI (USER GPS) */}
      <div className="absolute flex flex-col items-center z-10 animate-pulse">
        <div className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-md">
          Bạn ở đây
        </div>
        <div className="w-5 h-5 rounded-full bg-blue-500 border-4 border-white shadow-lg"></div>
      </div>

      {/* RENDER CÁC GHIM QUÁN ĂN (MAP MARKERS ĐỒNG BỘ TỪ BACKEND) */}
      {merchants.map((merchant, index) => {
        // Tính toán vị trí hiển thị ngẫu nhiên quanh tâm trên màn hình giả lập
        const offsetX = (merchant.lng - userLocation.lng) * 10000;
        const offsetY = (merchant.lat - userLocation.lat) * 10000;

        return (
          <div
            key={merchant.id}
            className="absolute flex flex-col items-center transition-all duration-500 hover:scale-110 group cursor-pointer"
            style={{
              transform: `translate(${offsetX * 2}px, ${offsetY * 2}px)`,
            }}
          >
            {/* POPUP THÔNG TIN KHI HOVER VÀO MARKER */}
            <div className="absolute bottom-8 bg-white p-2 rounded-xl shadow-xl w-40 opacity-0 group-hover:opacity-100 border border-gray-100 pointer-events-none transition-all duration-300 z-30">
              <p className="font-bold text-xs truncate">{merchant.name}</p>
              <p className="text-[10px] text-gray-400 truncate">{merchant.address}</p>
              <p className="text-[10px] text-orange-500 font-bold mt-1">⭐️ {merchant.rating}</p>
            </div>
            
            {/* ICON GHIM ĐỊNH VỊ (MARKER PIN) */}
            <span className="text-3xl drop-shadow-md">📍</span>
          </div>
        );
      })}

      <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur px-3 py-1.5 rounded-lg text-[11px] text-gray-500 border border-gray-200">
        🗺️ Bản đồ Giả lập Không gian (Mapbox/Google Maps Canvas)
      </div>
    </div>
  );
}