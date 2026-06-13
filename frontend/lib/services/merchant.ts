export interface MerchantCreatePayload {
  name: string;
  address: string;
  category: string;
  latitude: number;
  longitude: number;
  description?: string;
  image_url?: string;
}

export interface MerchantUpdatePayload {
  name?: string;
  address?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  is_active?: boolean;
  image_url?: string;
}

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface MerchantResponse {
  id: number;
  name: string;
  address: string;
  category: string;
  latitude?: number;
  longitude?: number;
  location?: LocationCoordinates;
  description: string | null;
  rating_avg: number;
  owner_id: number;
  is_active: boolean;
  created_at: string;
  image_url?: string | null;
}

export interface Restaurant {
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
  image?: string;
  distance?: number;
}

/**
 * Maps a raw backend merchant response item to a UI-friendly Restaurant object.
 * Only uses real data from the backend — no fake images or mock values.
 */
export function mapRawMerchantToRestaurant(item: any): Restaurant {
  return {
    id: Number(item.id),
    name: item.name,
    address: item.address || "",
    category: item.category || "",
    latitude: item.location ? item.location.lat : item.latitude,
    longitude: item.location ? item.location.lng : item.longitude,
    rating_avg: item.rating_avg ?? 0,
    image: item.image_url || undefined,
    distance: item.distance,
    description: item.description || null,
    owner_id: item.owner_id,
    is_active: item.is_active,
    created_at: item.created_at
  };
}

async function handleResponseError(response: Response, fallbackMessage: string): Promise<never> {
  let errorDetail: any = fallbackMessage;
  try {
    const errorData = await response.json();
    if (errorData && errorData.detail) {
      errorDetail = errorData.detail;
    } else if (errorData && errorData.message) {
      errorDetail = errorData.message;
    } else if (errorData && errorData.error) {
      errorDetail = errorData.error;
    }
  } catch (e) {
    try {
      const text = await response.text();
      if (text) {
        errorDetail = text;
      }
    } catch (_) {}
  }

  if (typeof errorDetail === "string") {
    throw new Error(errorDetail);
  } else if (Array.isArray(errorDetail)) {
    const formatted = errorDetail
      .map((err: any) => {
        if (typeof err === "string") return err;
        const loc = err.loc ? err.loc.join(".") : "";
        return loc ? `${loc}: ${err.msg || JSON.stringify(err)}` : (err.msg || JSON.stringify(err));
      })
      .join(", ");
    throw new Error(formatted || fallbackMessage);
  } else if (typeof errorDetail === "object" && errorDetail !== null) {
    throw new Error(JSON.stringify(errorDetail));
  } else {
    throw new Error(String(errorDetail) || fallbackMessage);
  }
}

function validateId(id: any, name: string = "ID"): void {
  if (id === undefined || id === null || isNaN(Number(id))) {
    throw new Error(`Mã ${name} không hợp lệ.`);
  }
}

export async function createMerchant(token: string, merchantData: MerchantCreatePayload): Promise<MerchantResponse> {
  const response = await fetch("/api/merchant", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(merchantData),
  });

  if (!response.ok) {
    await handleResponseError(response, "Failed to create merchant.");
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

export async function getMerchantsByOwner(token: string): Promise<MerchantResponse[]> {
  const response = await fetch("/api/merchant/me", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    await handleResponseError(response, "Failed to fetch merchants by owner.");
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    return [];
  }
  return data;
}

export async function updateMerchant(merchantId: number, token: string, merchantData: MerchantUpdatePayload): Promise<MerchantResponse> {
  validateId(merchantId, "nhà hàng");
  const response = await fetch(`/api/merchant/${merchantId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(merchantData),
  });

  if (!response.ok) {
    await handleResponseError(response, "Failed to update merchant.");
  }

  return response.json();
}

export async function getMerchant(id: number): Promise<MerchantResponse & { menus: any[]; reviews?: ReviewResponse[]; campaigns?: CampaignResponse[] }> {
  validateId(id, "nhà hàng");
  const response = await fetch(`/api/merchant/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    await handleResponseError(response, "Failed to fetch merchant details.");
  }

  return response.json();
}

export async function addMenuItem(
  merchantId: number,
  token: string,
  itemData: { dish_name: string; price: number; is_available?: boolean; description?: string; image_url?: string }
): Promise<any> {
  validateId(merchantId, "nhà hàng");
  const response = await fetch(`/api/merchant/${merchantId}/menus`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(itemData),
  });

  if (!response.ok) {
    await handleResponseError(response, "Failed to add menu item.");
  }

  return response.json();
}

export async function updateMenuItem(
  merchantId: number,
  menuId: number,
  token: string,
  itemData: { dish_name?: string; price?: number; is_available?: boolean; description?: string; image_url?: string }
): Promise<any> {
  validateId(merchantId, "nhà hàng");
  validateId(menuId, "món ăn");
  const response = await fetch(`/api/merchant/${merchantId}/menus/${menuId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(itemData),
  });

  if (!response.ok) {
    await handleResponseError(response, "Failed to update menu item.");
  }

  return response.json();
}

export async function deleteMenuItem(
  merchantId: number,
  menuId: number,
  token: string
): Promise<any> {
  validateId(merchantId, "nhà hàng");
  validateId(menuId, "món ăn");
  const response = await fetch(`/api/merchant/${merchantId}/menus/${menuId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    await handleResponseError(response, "Failed to delete menu item.");
  }

  return response.json();
}

export interface MerchantStats {
  total_clicks: number;
  total_ad_impressions: number;
  rating_avg: number;
  total_reviews: number;
  active_promos: number;
}

export async function getMerchantStats(merchantId: number, token: string): Promise<MerchantStats> {
  validateId(merchantId, "nhà hàng");
  const response = await fetch(`/api/merchant/${merchantId}/stats`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    await handleResponseError(response, "Failed to fetch merchant statistics.");
  }

  return response.json();
}

export interface CampaignResponse {
  id: number;
  merchant_id: number;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  is_active: boolean;
  impressions_count: number;
  clicks_count: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface ReviewResponse {
  id: number;
  customerName: string;
  customerAvatar: string | null;
  rating: number;
  comment: string;
  date: string;
  response: string | null;
  reviewerId: number;
  reviewImage: string | null;
}

export async function getCampaigns(merchantId: number, token: string): Promise<CampaignResponse[]> {
  validateId(merchantId, "nhà hàng");
  const response = await fetch(`/api/merchant/${merchantId}/campaigns`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    await handleResponseError(response, "Failed to fetch campaigns.");
  }

  return response.json();
}

export async function createCampaign(
  merchantId: number,
  token: string,
  payload: { title: string; description?: string; video_url?: string; is_active?: boolean; start_date?: string | null; end_date?: string | null }
): Promise<CampaignResponse> {
  validateId(merchantId, "nhà hàng");
  const response = await fetch(`/api/merchant/${merchantId}/campaigns`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    await handleResponseError(response, "Failed to create campaign.");
  }

  return response.json();
}

export async function updateCampaign(
  merchantId: number,
  campaignId: number,
  token: string,
  payload: { title?: string; description?: string; video_url?: string; is_active?: boolean; start_date?: string | null; end_date?: string | null }
): Promise<CampaignResponse> {
  validateId(merchantId, "nhà hàng");
  validateId(campaignId, "chiến dịch");
  const response = await fetch(`/api/merchant/${merchantId}/campaigns/${campaignId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    await handleResponseError(response, "Failed to update campaign.");
  }

  return response.json();
}

export async function deleteCampaign(
  merchantId: number,
  campaignId: number,
  token: string
): Promise<any> {
  validateId(merchantId, "nhà hàng");
  validateId(campaignId, "chiến dịch");
  const response = await fetch(`/api/merchant/${merchantId}/campaigns/${campaignId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    await handleResponseError(response, "Failed to delete campaign.");
  }

  return response.json();
}

export async function getReviews(merchantId: number, token: string): Promise<ReviewResponse[]> {
  validateId(merchantId, "nhà hàng");
  const response = await fetch(`/api/merchant/${merchantId}/reviews`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    await handleResponseError(response, "Failed to fetch reviews.");
  }

  return response.json();
}

export async function respondToReview(
  merchantId: number,
  reviewId: number,
  token: string,
  responseText: string
): Promise<ReviewResponse> {
  validateId(merchantId, "nhà hàng");
  validateId(reviewId, "đánh giá");
  const response = await fetch(`/api/merchant/${merchantId}/reviews/${reviewId}/response`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ response: responseText }),
  });

  if (!response.ok) {
    await handleResponseError(response, "Failed to respond to review.");
  }

  return response.json();
}

export async function deleteMerchant(merchantId: number, token: string): Promise<any> {
  validateId(merchantId, "nhà hàng");
  const response = await fetch(`/api/merchant/${merchantId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    await handleResponseError(response, "Lỗi khi xóa quán ăn.");
  }

  return response.json();
}

export interface ReviewCreatePayload {
  rating: number;
  comment: string;
  thumbnail_url?: string;
}

export async function submitReview(
  merchantId: number,
  token: string,
  payload: ReviewCreatePayload
): Promise<any> {
  validateId(merchantId, "nhà hàng");
  if (payload.rating < 1 || payload.rating > 5) {
    throw new Error("Điểm đánh giá phải từ 1 đến 5 sao.");
  }
  if (!payload.comment || payload.comment.trim() === "") {
    throw new Error("Nội dung đánh giá không được để trống.");
  }

  const response = await fetch("/api/content/videos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: "Đánh giá từ khách hàng",
      video_url: "",
      description: payload.comment.trim(),
      tagged_merchant_id: merchantId,
      post_type: "review",
      rating: payload.rating,
      thumbnail_url: payload.thumbnail_url
    }),
  });

  if (!response.ok) {
    await handleResponseError(response, "Không thể gửi đánh giá.");
  }

  return response.json();
}

export async function deleteReview(
  reviewId: number,
  token: string
): Promise<any> {
  validateId(reviewId, "đánh giá");
  const response = await fetch(`/api/content/videos/${reviewId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    await handleResponseError(response, "Lỗi khi xóa đánh giá.");
  }

  return response.json();
}
