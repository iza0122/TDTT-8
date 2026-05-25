import axiosClient from '../../core/api/axios-client';

export interface UserResponse {
  id: number;
  firebase_uid: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export interface RegisterPayload {
  email?: string;
  phone_number?: string;
  password: string;
  full_name?: string;
}

export interface LoginPayload {
  username?: string;
  email?: string;
  phone_number?: string;
  password: string;
}

export async function registerUser(payload: RegisterPayload): Promise<UserResponse> {
  return axiosClient.post('/auth/register', payload);
}

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  return axiosClient.post('/auth/login', payload);
}
