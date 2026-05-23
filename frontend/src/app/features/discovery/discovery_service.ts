import axios from "axios";

export interface MerchantMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  rating: number;
}

const BASE_URL = "http://localhost:8000/api/v1/search";

export const discoveryServices = {
  // Lấy các quán ăn xung quanh dựa trên tọa độ thực tế và bán kính lọc
  getNearbyMerchants: async (lat: number, lng: number, radiusKm: number): Promise<MerchantMarker[]> => {
    try {
      const response = await axios.get(`${BASE_URL}/geo-search`, {
        params: { lat, lng, radius_km: radiusKm }
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy dữ liệu định vị không gian:", error);
      // Trả về dữ liệu Mock để kiểm thử giao diện tĩnh nếu chưa bật Backend
      return [
        { id: "1", name: "Bún Bò Huế US", lat: 10.7628, lng: 106.6823, address: "227 Nguyễn Văn Cừ", rating: 4.8 },
        { id: "2", name: "Cơm Tấm Hòa Đẹp Trai", lat: 10.7650, lng: 106.6810, address: "Trần Hưng Đạo", rating: 4.5 },
        { id: "3", name: "Cà Phê Sữa Trí Claude", lat: 10.7610, lng: 106.6850, address: "An Dương Vương", rating: 4.2 }
      ];
    }
  }
};