import { Restaurant } from "@/lib/services/merchant";

export interface AppCacheType {
  posts: any[] | null;
  followingPosts: any[] | null;
  reels: any[] | null;
  suggestedRestaurants: any[] | null;
  mapState: {
    restaurantsList: Restaurant[];
    selectedRestaurant: Restaurant | null;
    activeCategory: string;
    searchQuery: string;
    radius: number;
    searchCenter: { lat: number; lng: number };
    userLocation: { lat: number; lng: number } | null;
    isLocationResolved: boolean;
  } | null;
}

export const globalAppCache: AppCacheType = {
  posts: null,
  followingPosts: null,
  reels: null,
  suggestedRestaurants: null,
  mapState: null,
};
