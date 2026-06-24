import { stat } from "fs";

const API_BASE = "/api"; // Keep API_BASE for non-mocking mode
const IS_MOCKING_ADMIN_DATA = process.env.NEXT_PUBLIC_MOCK_ADMIN_DATA === "true";

export interface AdminUser {
  id: number;
  firebase_uid: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  meta_data?: { disabled?: boolean } | null;
}

export interface AdminMerchant {
  id: number;
  name: string;
  address: string;
  category: string;
  rating_avg: number;
  owner_id: number;
  owner?: { full_name: string | null };
  is_active: boolean;
  created_at: string;
  latitude: number;
  longitude: number;
  description: string | null;
}

export interface AdminVideo {
  id: number;
  title: string | null;
  description: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  post_type: "video" | "image";
  status: "pending" | "approved" | "rejected";
  likes_count: number;
  created_at: string;
  reviewer_id: number;
  reviewer?: { full_name: string | null; avatar_url: string | null };
  tagged_merchant_id: number | null;
  tagged_merchant?: { name: string } | null;
  meta_data?: { reject_reason?: string } | null;
}

export interface AdminCampaign {
  id: number;
  title: string;
  is_active: boolean;
  impressions_count: number;
  clicks_count: number;
  created_at: string;
  merchant_id: number;
  merchant?: { name: string };
  video_url?: string | null;
}

export interface AdminStats {
  total_users: number;
  pending_videos: number;
  active_merchants: number;
  active_campaigns: number;
}

export interface PaginatedUsers {
  items: AdminUser[];
  total: number;
}

export interface PaginatedMerchants {
  items: AdminMerchant[];
  total: number;
}

export interface PaginatedVideos {
  items: AdminVideo[];
  total: number;
}

export interface PaginatedCampaigns {
  items: AdminCampaign[];
  total: number;
}

// Define mock data for each admin interface
const MOCK_ADMIN_STATS: AdminStats = {
  total_users: 150,
  pending_videos: 12,
  active_merchants: 45,
  active_campaigns: 7,
};

const MOCK_ADMIN_USERS: AdminUser[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  firebase_uid: `mock_user_${i + 1}`,
  email: `user${i + 1}@example.com`,
  full_name: `User Name ${i + 1}`,
  avatar_url: `https://i.pravatar.cc/150?img=${i + 1}`,
  role: i === 0 ? "admin" : (i % 3 === 0 ? "merchant" : "reviewer"),
  created_at: new Date(Date.now() - (i * 86400000)).toISOString(),
  meta_data: { disabled: i % 5 === 0 },
}));

const MOCK_ADMIN_MERCHANTS: AdminMerchant[] = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  name: `Restaurant Name ${i + 1}`,
  address: `${i + 1} Main St, City`,
  category: i % 2 === 0 ? "Vietnamese" : "Thai",
  rating_avg: parseFloat((Math.random() * 2 + 3).toFixed(1)), // 3.0 to 5.0
  owner_id: i + 1,
  owner: { full_name: `Merchant Owner ${i + 1}` },
  is_active: i % 3 !== 0,
  created_at: new Date(Date.now() - (i * 86400000 * 2)).toISOString(),
  latitude: 10.775 + (Math.random() - 0.5) * 0.1,
  longitude: 106.700 + (Math.random() - 0.5) * 0.1,
  description: `A lovely restaurant serving delicious ${i % 2 === 0 ? "Vietnamese" : "Thai"} food.`,
}));

const MOCK_ADMIN_VIDEOS: AdminVideo[] = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  title: `Delicious Food Review ${i + 1}`,
  description: `A detailed review of the amazing dishes at Restaurant ${i + 1}.`,
  video_url: `https://example.com/video${i + 1}.mp4`,
  thumbnail_url: `https://picsum.photos/seed/video${i}/300/200`,
  post_type: (i % 2 === 0 ? "video" : "image"), // Explicitly cast to literal types
  status: (i % 3 === 0 ? "pending" : (i % 3 === 1 ? "approved" : "rejected")), // Explicitly cast
  likes_count: Math.floor(Math.random() * 1000),
  reviewer_id: Math.floor(Math.random() * MOCK_ADMIN_USERS.length) + 1,
  reviewer: { full_name: `Reviewer ${Math.floor(Math.random() * 10) + 1}`, avatar_url: `https://i.pravatar.cc/150?img=${i}` },
  tagged_merchant_id: Math.floor(Math.random() * MOCK_ADMIN_MERCHANTS.length) + 1,
  tagged_merchant: { name: `Restaurant Name ${Math.floor(Math.random() * 30) + 1}` },
  created_at: new Date(Date.now() - (i * 86400000 * 0.5)).toISOString(),
  meta_data: i % 3 === 2 ? { reject_reason: "Content policy violation" } : null,
}));

const MOCK_ADMIN_CAMPAIGNS: AdminCampaign[] = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  merchant_id: Math.floor(Math.random() * MOCK_ADMIN_MERCHANTS.length) + 1,
  title: `Grand Sale Campaign ${i + 1}`,
  video_url: `https://example.com/promo${i + 1}.mp4`,
  thumbnail_url: `https://picsum.photos/seed/campaign${i}/300/200`,
  is_active: i % 2 === 0,
  impressions_count: Math.floor(Math.random() * 10000),
  clicks_count: Math.floor(Math.random() * 500),
  created_at: new Date(Date.now() - (i * 86400000 * 3)).toISOString(),
  merchant: { name: `Restaurant Name ${Math.floor(Math.random() * 30) + 1}` },
}));

function authHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

export async function getAdminStats(token: string): Promise<AdminStats> {
  if (IS_MOCKING_ADMIN_DATA) {
    return Promise.resolve(MOCK_ADMIN_STATS);
  }
  const res = await fetch(`${API_BASE}/admin/stats`, { headers: authHeaders(token) });
  return handleResponse<AdminStats>(res);
}

export async function getAdminUsers(
  token: string,
  params: { limit?: number; offset?: number; search?: string; role?: string; status?: string; sort?: string }
): Promise<PaginatedUsers> {
  if (IS_MOCKING_ADMIN_DATA) {
    let filteredUsers = MOCK_ADMIN_USERS.map(user => ({...user})); // Create a deep copy for mutable operations

    if (params.search) {
      const searchTerm = params.search.toLowerCase();
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.full_name?.toLowerCase().includes(searchTerm) ||
          user.email?.toLowerCase().includes(searchTerm)
      );
    }
    if (params.role && params.role !== "all") {
      filteredUsers = filteredUsers.filter((user) => user.role === params.role);
    }
    if (params.status && params.status !== "all") {
      if (params.status === "disabled") {
        filteredUsers = filteredUsers.filter((user) => user.meta_data?.disabled === true);
      } else if (params.status === "active") {
        filteredUsers = filteredUsers.filter((user) => user.meta_data?.disabled !== true);
      }
    }
    if (params.sort === "newest") {
      filteredUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    const total = filteredUsers.length;
    const items = filteredUsers.slice(params.offset, (params.offset || 0) + (params.limit || 10));

    return Promise.resolve({ items, total });
  }
  const p = new URLSearchParams();
  if (params.limit !== undefined) p.set("limit", String(params.limit));
  if (params.offset !== undefined) p.set("offset", String(params.offset));
  if (params.search) p.set("search", params.search);
  if (params.role && params.role !== "all") p.set("role", params.role);
  if (params.status && params.status !== "all") p.set("status", params.status);
  if (params.sort) p.set("sort", params.sort);
  const res = await fetch(`${API_BASE}/admin/users?${p}`, { headers: authHeaders(token) });
  return handleResponse<PaginatedUsers>(res);
}

export async function patchUserRole(token: string, userId: number, role: string): Promise<AdminUser> {
  if (IS_MOCKING_ADMIN_DATA) {
    const user = MOCK_ADMIN_USERS.find((u) => u.id === userId);
    if (user) {
      user.role = role;
      return Promise.resolve(user);
    }
    return Promise.reject(new Error("User not found"));
  }
  const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ role }),
  });
  return handleResponse<AdminUser>(res);
}

export async function patchUserDisable(token: string, userId: number, disabled: boolean): Promise<AdminUser> {
  if (IS_MOCKING_ADMIN_DATA) {
    const user = MOCK_ADMIN_USERS.find((u) => u.id === userId);
    if (user) {
      if (!user.meta_data) user.meta_data = {};
      user.meta_data.disabled = disabled;
      return Promise.resolve(user);
    }
    return Promise.reject(new Error("User not found"));
  }
  const res = await fetch(`${API_BASE}/admin/users/${userId}/disable`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ disabled }),
  });
  return handleResponse<AdminUser>(res);
}

export async function getAdminMerchants(
  token: string,
  params: { limit?: number; offset?: number; search?: string; category?: string; is_active?: string }
): Promise<PaginatedMerchants> {
  if (IS_MOCKING_ADMIN_DATA) {
    let filteredMerchants = MOCK_ADMIN_MERCHANTS.map(merchant => ({...merchant})); // Create a deep copy

    if (params.search) {
      const searchTerm = params.search.toLowerCase();
      filteredMerchants = filteredMerchants.filter(
        (merchant) =>
          merchant.name.toLowerCase().includes(searchTerm) ||
          merchant.address?.toLowerCase().includes(searchTerm) ||
          merchant.owner?.full_name?.toLowerCase().includes(searchTerm)
      );
    }
    if (params.category && params.category !== "all") {
      filteredMerchants = filteredMerchants.filter((merchant) => merchant.category === params.category);
    }
    if (params.is_active && params.is_active !== "all") {
      filteredMerchants = filteredMerchants.filter(
        (merchant) => merchant.is_active === (params.is_active === "true")
      );
    }

    const total = filteredMerchants.length;
    const items = filteredMerchants.slice(params.offset, (params.offset || 0) + (params.limit || 10));

    return Promise.resolve({ items, total });
  }
  const p = new URLSearchParams();
  if (params.limit !== undefined) p.set("limit", String(params.limit));
  if (params.offset !== undefined) p.set("offset", String(params.offset));
  if (params.search) p.set("search", params.search);
  if (params.category && params.category !== "all") p.set("category", params.category);
  if (params.is_active && params.is_active !== "all") p.set("is_active", params.is_active);
  const res = await fetch(`${API_BASE}/admin/merchants?${p}`, { headers: authHeaders(token) });
  return handleResponse<PaginatedMerchants>(res);
}

export async function patchMerchantActive(token: string, merchantId: number, is_active: boolean): Promise<AdminMerchant> {
  if (IS_MOCKING_ADMIN_DATA) {
    const merchant = MOCK_ADMIN_MERCHANTS.find((m) => m.id === merchantId);
    if (merchant) {
      merchant.is_active = is_active;
      return Promise.resolve(merchant);
    }
    return Promise.reject(new Error("Merchant not found"));
  }
  const res = await fetch(`${API_BASE}/admin/merchants/${merchantId}/active`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ is_active }),
  });
  return handleResponse<AdminMerchant>(res);
}

export async function getAdminVideos(
  token: string,
  params: { limit?: number; offset?: number; status?: string }
): Promise<PaginatedVideos> {
  if (IS_MOCKING_ADMIN_DATA) {
    let filteredVideos = MOCK_ADMIN_VIDEOS.map(video => ({...video})); // Create a deep copy

    if (params.status && params.status !== "all") {
      filteredVideos = filteredVideos.filter((video) => video.status === params.status);
    }

    const total = filteredVideos.length;
    const items = filteredVideos.slice(params.offset, (params.offset || 0) + (params.limit || 10));

    return Promise.resolve({ items, total });
  }
  const p = new URLSearchParams();
  if (params.limit !== undefined) p.set("limit", String(params.limit));
  if (params.offset !== undefined) p.set("offset", String(params.offset));
  if (params.status && params.status !== "all") p.set("status", params.status);
  const res = await fetch(`${API_BASE}/admin/videos?${p}`, { headers: authHeaders(token) });
  return handleResponse<PaginatedVideos>(res);
}

export async function patchVideoStatus(
  token: string,
  videoId: number,
  status: "approved" | "rejected",
  reject_reason?: string
): Promise<AdminVideo> {
  if (IS_MOCKING_ADMIN_DATA) {
    const video = MOCK_ADMIN_VIDEOS.find((v) => v.id === videoId);
    if (video) {
      video.status = status;
      if (status === "rejected") {
        video.meta_data = { reject_reason: reject_reason || "" }; // Ensure reject_reason is a string
      } else {
        video.meta_data = null; // Set to null if not rejected
      }
      return Promise.resolve(video);
    }
    return Promise.reject(new Error("Video not found"));
  }
  const body: Record<string, string> = { status };
  if (reject_reason) body.reject_reason = reject_reason;
  const res = await fetch(`${API_BASE}/admin/videos/${videoId}/status`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  return handleResponse<AdminVideo>(res);
}

export async function getAdminCampaigns(
  token: string,
  params: { limit?: number; offset?: number; is_active?: string; merchant_search?: string }
): Promise<PaginatedCampaigns> {
  if (IS_MOCKING_ADMIN_DATA) {
    let filteredCampaigns = MOCK_ADMIN_CAMPAIGNS.map(campaign => ({...campaign})); // Create a deep copy

    if (params.is_active && params.is_active !== "all") {
      filteredCampaigns = filteredCampaigns.filter(
        (campaign) => campaign.is_active === (params.is_active === "true")
      );
    }
    if (params.merchant_search) {
      const searchTerm = params.merchant_search.toLowerCase();
      filteredCampaigns = filteredCampaigns.filter((campaign) =>
        campaign.merchant?.name.toLowerCase().includes(searchTerm)
      );
    }

    const total = filteredCampaigns.length;
    const items = filteredCampaigns.slice(params.offset, (params.offset || 0) + (params.limit || 10));

    return Promise.resolve({ items, total });
  }
  const p = new URLSearchParams();
  if (params.limit !== undefined) p.set("limit", String(params.limit));
  if (params.offset !== undefined) p.set("offset", String(params.offset));
  if (params.is_active && params.is_active !== "all") p.set("is_active", params.is_active);
  if (params.merchant_search) p.set("merchant_search", params.merchant_search);
  const res = await fetch(`${API_BASE}/admin/campaigns?${p}`, { headers: authHeaders(token) });
  return handleResponse<PaginatedCampaigns>(res);
}

export async function patchCampaignActive(token: string, campaignId: number, is_active: boolean): Promise<AdminCampaign> {
  if (IS_MOCKING_ADMIN_DATA) {
    const campaign = MOCK_ADMIN_CAMPAIGNS.find((c) => c.id === campaignId);
    if (campaign) {
      campaign.is_active = is_active;
      return Promise.resolve(campaign);
    }
    return Promise.reject(new Error("Campaign not found"));
  }
  const res = await fetch(`${API_BASE}/admin/campaigns/${campaignId}/toggle`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ is_active }),
  });
  return handleResponse<AdminCampaign>(res);
}
