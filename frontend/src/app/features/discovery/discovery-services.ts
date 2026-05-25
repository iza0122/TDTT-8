// discovery-services.ts
export interface Shop {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

// Công thức Haversine để tính khoảng cách giữa 2 điểm (km)
export const calculateDistance = (
  lat1: number, lng1: number, lat2: number, lng2: number
): number => {
  const R = 6371; // Bán kính trái đất (km)
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const filterShopsByRadius = (shops: Shop[], center: [number, number], radius: number) => {
  return shops.filter(shop => {
    const distance = calculateDistance(center[0], center[1], shop.lat, shop.lng);
    return distance <= radius;
  });
};

