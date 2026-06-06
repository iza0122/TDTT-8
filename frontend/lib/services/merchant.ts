export interface MerchantCreatePayload {
  name: string;
  address: string;
  category: string;
  latitude: number;
  longitude: number;
  description?: string;
}

export interface MerchantResponse {
  id: number;
  name: string;
  address: string;
  category: string;
  latitude: number;
  longitude: number;
  description: string | null;
  rating_avg: number;
  owner_id: number;
  is_active: boolean;
  created_at: string;
}

export interface Restaurant {
  id: number; // Changed from string to number as per backend `id = Column(Integer, ...)`
  name: string;
  address: string;
  category: string;
  latitude: number; // Changed from lat
  longitude: number; // Changed from lng
  description: string | null; // Added
  rating_avg: number; // Changed from rating
  owner_id: number; // Added
  is_active: boolean; // Added
  created_at: string; // Added

  // UI-specific fields that mapRawMerchantToRestaurant will fill
  reviews: number;
  isOpen: boolean;
  openTime: string;
  priceRange: string;
  image: string;
  distance?: number;
}

/**
 * Maps a raw backend merchant response item to a UI-friendly Restaurant object.
 * Isolates the fallback and default values (like default images and rating) completely.
 */
export function mapRawMerchantToRestaurant(item: any): Restaurant {
  // Isolate fallback default values as requested by the user
  const fallbackRating = item.rating_avg !== undefined && item.rating_avg !== null ? item.rating_avg : 4.5;
  
  // Isolated mock generator helpers - separated from UI logic
  const mockReviews = Math.floor(Math.random() * 200) + 10;
  const mockImage = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500";
  const mockOpenTime = "08:00 - 22:00";
  const mockPriceRange = "30k - 100k";

  return {
    id: Number(item.id),
    name: item.name,
    address: item.address || "",
    category: item.category || "Món ăn",
    latitude: item.latitude,
    longitude: item.longitude,
    rating_avg: fallbackRating,
    reviews: mockReviews,
    isOpen: true,
    openTime: mockOpenTime,
    priceRange: mockPriceRange,
    image: mockImage,
    distance: item.distance,
    description: item.description || null,
    owner_id: item.owner_id,
    is_active: item.is_active,
    created_at: item.created_at
  };
}

export async function createMerchant(token: string, merchantData: MerchantCreatePayload): Promise<MerchantResponse> {
  const response = await fetch("/api/merchant/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(merchantData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to create merchant.");
  }

  return response.json();
}

export interface SearchMerchantsParams {
  lat: number;
  lng: number;
  radius?: number;
  q?: string;
  category?: string;
}

/**
 * Fetches merchants from the geo-search backend endpoint.
 */
export async function searchMerchantsGeo(params: SearchMerchantsParams): Promise<Restaurant[]> {
  const { lat, lng, radius = 15.0, q, category } = params;
  
  let url = `/api/interact/search?lat=${lat}&lng=${lng}&radius=${radius}`;
  if (q && q.trim() !== "") {
    url += `&q=${encodeURIComponent(q.trim())}`;
  }
  if (category && category !== "all") {
    url += `&category=${encodeURIComponent(category)}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Lỗi gọi API tìm kiếm quán ăn: ${response.statusText}`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(mapRawMerchantToRestaurant);
}
