const API_BASE = "/api";

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
  const res = await fetch(`${API_BASE}/admin/stats`, { headers: authHeaders(token) });
  return handleResponse<AdminStats>(res);
}

export async function getAdminUsers(
  token: string,
  params: { limit?: number; offset?: number; search?: string; role?: string; status?: string; sort?: string }
): Promise<PaginatedUsers> {
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
  const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ role }),
  });
  return handleResponse<AdminUser>(res);
}

export async function patchUserDisable(token: string, userId: number, disabled: boolean): Promise<AdminUser> {
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
  const res = await fetch(`${API_BASE}/admin/merchants/${merchantId}/active`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ is_active }),
  });
  return handleResponse<AdminMerchant>(res);
}

export async function getAdminVideos(
  token: string,
  params: { limit?: number; offset?: number; status?: string; post_type?: string }
): Promise<PaginatedVideos> {
  const p = new URLSearchParams();
  if (params.limit !== undefined) p.set("limit", String(params.limit));
  if (params.offset !== undefined) p.set("offset", String(params.offset));
  if (params.status && params.status !== "all") p.set("status", params.status);
  if (params.post_type && params.post_type !== "all") p.set("post_type", params.post_type);
  const res = await fetch(`${API_BASE}/admin/videos?${p}`, { headers: authHeaders(token) });
  return handleResponse<PaginatedVideos>(res);
}

export async function patchVideoStatus(
  token: string,
  videoId: number,
  status: "approved" | "rejected",
  reject_reason?: string
): Promise<AdminVideo> {
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
  const p = new URLSearchParams();
  if (params.limit !== undefined) p.set("limit", String(params.limit));
  if (params.offset !== undefined) p.set("offset", String(params.offset));
  if (params.is_active && params.is_active !== "all") p.set("is_active", params.is_active);
  if (params.merchant_search) p.set("merchant_search", params.merchant_search);
  const res = await fetch(`${API_BASE}/admin/campaigns?${p}`, { headers: authHeaders(token) });
  return handleResponse<PaginatedCampaigns>(res);
}

export async function patchCampaignActive(token: string, campaignId: number, is_active: boolean): Promise<AdminCampaign> {
  const res = await fetch(`${API_BASE}/admin/campaigns/${campaignId}/toggle`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ is_active }),
  });
  return handleResponse<AdminCampaign>(res);
}
