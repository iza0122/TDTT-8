"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/merchant/page-header";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getMerchantsByOwner, updateMerchant, MerchantResponse, MerchantUpdatePayload } from "@/lib/services/merchant";
import { UploadCloud, X, MapPin, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ImageUploadZoneProps {
  label: string;
  description?: string;
  multiple?: boolean;
}

function ImageUploadZone({ label, description, multiple = false }: ImageUploadZoneProps) {
  const [previews, setPreviews] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const urls = Array.from(files).map((f) => URL.createObjectURL(f));
    setPreviews(multiple ? [...previews, ...urls] : urls);
  };

  const removePreview = (i: number) => {
    setPreviews(previews.filter((_, idx) => idx !== i));
  };

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {previews.length > 0 ? (
        <div className={`flex flex-wrap gap-3`}>
          {previews.map((src, i) => (
            <div key={i} className="relative group w-24 h-24 rounded-xl overflow-hidden border border-border">
              <Image src={src} alt="" fill className="object-cover" />
              <button
                type="button"
                onClick={() => removePreview(i)}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ))}
          {multiple && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <UploadCloud className="w-5 h-5" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors group"
        >
          <UploadCloud className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
          <div>
            <p className="text-sm font-medium text-foreground">Nhấp để tải ảnh lên</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {description ?? "PNG, JPG tối đa 5MB"}
            </p>
          </div>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

interface SaveButtonProps {
  label?: string;
  onClick: () => void;
  loading: boolean;
}

function SaveButton({ label = "Lưu thay đổi", onClick, loading }: SaveButtonProps) {
  return (
    <Button type="button" onClick={onClick} disabled={loading} className="gap-2">
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {loading ? "Đang lưu..." : label}
    </Button>
  );
}

export default function MerchantProfilePage() {
  const { token, user } = useAuth();
  const { toast } = useToast();

  const [merchant, setMerchant] = useState<MerchantResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [slogan, setSlogan] = useState(""); // Assuming slogan will be added to backend later
  const [hours, setHours] = useState(""); // Assuming hours will be added to backend later
  const [phone, setPhone] = useState(""); // Assuming phone will be added to backend later
  const [email, setEmail] = useState(""); // Assuming email will be added to backend later

  useEffect(() => {
    const fetchMerchantData = async () => {
      if (!token || !user) {
        setError("Authentication required.");
        setIsLoading(false);
        return;
      }
      try {
        const userMerchants = await getMerchantsByOwner(token);
        if (userMerchants.length > 0) {
          const firstMerchant = userMerchants[0]; // Assuming one merchant for simplicity
          setMerchant(firstMerchant);
          setName(firstMerchant.name);
          setAddress(firstMerchant.address || "");
          setCategory(firstMerchant.category || "");
          setDescription(firstMerchant.description || "");
          setLatitude(firstMerchant.latitude.toString());
          setLongitude(firstMerchant.longitude.toString());
          // For fields not directly in MerchantResponse, leave as default or set from another source if available
          // setSlogan(firstMerchant.slogan || "");
          // setHours(firstMerchant.hours || "");
          // setPhone(firstMerchant.phone || "");
          // setEmail(firstMerchant.email || "");
        } else {
          setError("No merchant found for this user.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch merchant data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMerchantData();
  }, [token, user]);

  const handleSubmit = async (tab: string) => {
    if (!token || !merchant) {
      toast({
        title: "Lỗi 🙁",
        description: "Chưa đăng nhập hoặc không tìm thấy quán ăn.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    setError(null);

    let payload: MerchantUpdatePayload = {};
    let successMessage = "";
    let errorMessage = "";

    switch (tab) {
      case "general":
        payload = { name, category, description };
        successMessage = "Thông tin chung đã được cập nhật.";
        errorMessage = "Lỗi khi cập nhật thông tin chung.";
        break;
      case "contact":
        payload = { address }; // Assuming phone and email are not part of merchant schema
        successMessage = "Thông tin liên hệ đã được cập nhật.";
        errorMessage = "Lỗi khi cập nhật thông tin liên hệ.";
        break;
      case "location":
        payload = {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        };
        successMessage = "Vị trí đã được cập nhật.";
        errorMessage = "Lỗi khi cập nhật vị trí.";
        break;
      case "images":
        // Image handling logic will go here later. For now, it's a placeholder.
        successMessage = "Hình ảnh đã được cập nhật (placeholder).";
        errorMessage = "Lỗi khi cập nhật hình ảnh (placeholder).";
        setIsSaving(false); // No actual saving for images yet
        toast({
          title: "Thông báo",
          description: successMessage,
          variant: "default",
        });
        return;
      default:
        setIsSaving(false);
        return;
    }

    try {
      const updated = await updateMerchant(merchant.id, token, payload);
      setMerchant(updated);
      toast({
        title: "Thành công! 🎉",
        description: successMessage,
        variant: "default",
      });
    } catch (err: any) {
      console.error(errorMessage, err);
      setError(err.message || errorMessage);
      toast({
        title: "Lỗi 🙁",
        description: err.message || errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-2 text-primary">Đang tải thông tin quán ăn...</p>
      </div>
    );
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">Lỗi: {error}</div>;
  }

  if (!merchant) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Không tìm thấy thông tin quán ăn.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Restaurant Profile"
        description="Quản lý thông tin và hình ảnh nhà hàng"
      />

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Thông tin chung</TabsTrigger>
          <TabsTrigger value="contact">Liên hệ</TabsTrigger>
          <TabsTrigger value="images">Hình ảnh</TabsTrigger>
          <TabsTrigger value="location">Vị trí</TabsTrigger>
        </TabsList>

        {/* General Info */}
        <TabsContent value="general" className="mt-5">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin chung</CardTitle>
              <CardDescription>Cập nhật thông tin cơ bản của nhà hàng.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Tên nhà hàng</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slogan">Slogan</Label>
                <Input id="slogan" value={slogan} onChange={(e) => setSlogan(e.target.value)} placeholder="Ví dụ: Hương vị đích thực từ trái tim" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cuisine">Loại ẩm thực</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại ẩm thực" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vietnamese">Món Việt</SelectItem>
                      <SelectItem value="italian">Món Ý</SelectItem>
                      <SelectItem value="japanese">Món Nhật</SelectItem>
                      <SelectItem value="mexican">Món Mexico</SelectItem>
                      <SelectItem value="other">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="hours">Giờ hoạt động</Label>
                  <Input id="hours" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="Ví dụ: T2–CN: 9:00 – 22:00" />
                </div>
              </div>
              <SaveButton onClick={() => handleSubmit("general")} loading={isSaving} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Info */}
        <TabsContent value="contact" className="mt-5">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin liên hệ</CardTitle>
              <CardDescription>Địa chỉ, số điện thoại và email liên hệ của nhà hàng.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="address">Địa chỉ</Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ví dụ: 123 Nguyễn Huệ, Quận 1, TP.HCM" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ví dụ: 028 1234 5678" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Ví dụ: info@nharang.com" />
                </div>
              </div>
              <SaveButton onClick={() => handleSubmit("contact")} loading={isSaving} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Images */}
        <TabsContent value="images" className="mt-5">
          <Card>
            <CardHeader>
              <CardTitle>Hình ảnh nhà hàng</CardTitle>
              <CardDescription>Tải lên ảnh đại diện, ảnh bìa và thư viện ảnh.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ImageUploadZone
                label="Ảnh đại diện"
                description="Ảnh vuông, tối thiểu 200×200px"
              />
              <ImageUploadZone
                label="Ảnh bìa (Hero)"
                description="Ảnh ngang, khuyến nghị 1600×900px"
              />
              <ImageUploadZone
                label="Thư viện ảnh"
                description="Có thể tải nhiều ảnh cùng lúc"
                multiple
              />
              <SaveButton label="Tải ảnh lên" onClick={() => handleSubmit("images")} loading={isSaving} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Location */}
        <TabsContent value="location" className="mt-5">
          <Card>
            <CardHeader>
              <CardTitle>Vị trí nhà hàng</CardTitle>
              <CardDescription>Cập nhật tọa độ để hiển thị chính xác trên bản đồ.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="latitude">Vĩ độ (Latitude)</Label>
                  <Input id="latitude" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="Ví dụ: 10.7769" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="longitude">Kinh độ (Longitude)</Label>
                  <Input id="longitude" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="Ví dụ: 106.7009" />
                </div>
              </div>

              <Link
                href="/map"
                className="flex items-center gap-3 p-4 rounded-xl border border-border bg-secondary/40 hover:bg-secondary/70 hover:border-primary/30 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    Xem trên bản đồ
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Kiểm tra vị trí nhà hàng trên bản đồ thực tế</p>
                </div>
              </Link>

              <SaveButton label="Lưu vị trí" onClick={() => handleSubmit("location")} loading={isSaving} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
