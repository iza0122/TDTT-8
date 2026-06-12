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
import { getMerchantsByOwner, updateMerchant, createMerchant, deleteMerchant, MerchantResponse, MerchantUpdatePayload } from "@/lib/services/merchant";
import { UploadCloud, X, MapPin, Loader2, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
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

  const [merchantsList, setMerchantsList] = useState<MerchantResponse[]>([]);
  const [merchant, setMerchant] = useState<MerchantResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  // Add Restaurant Dialog Form states
  const [newMerchantName, setNewMerchantName] = useState("");
  const [newMerchantAddress, setNewMerchantAddress] = useState("");
  const [newMerchantCategory, setNewMerchantCategory] = useState("");
  const [newMerchantLatitude, setNewMerchantLatitude] = useState("");
  const [newMerchantLongitude, setNewMerchantLongitude] = useState("");
  const [newMerchantDescription, setNewMerchantDescription] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const fetchMerchants = async (selectId?: number) => {
    if (!token || !user) {
      setError("Authentication required.");
      setIsLoading(false);
      return;
    }
    try {
      const list = await getMerchantsByOwner(token);
      setMerchantsList(list);
      if (list.length > 0) {
        // If selectId is specified and exists, select it; otherwise select the first one
        const active = (selectId && list.find(m => m.id === selectId)) || list[0];
        setSelectedMerchant(active);
        setError(null);
      } else {
        setMerchant(null);
        setError("No merchant found for this user.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch merchant data.");
    } finally {
      setIsLoading(false);
    }
  };

  const setSelectedMerchant = (m: MerchantResponse) => {
    setMerchant(m);
    setName(m.name);
    setAddress(m.address || "");
    setCategory(m.category || "");
    setDescription(m.description || "");
    setLatitude(m.location ? m.location.lat.toString() : (m.latitude?.toString() || ""));
    setLongitude(m.location ? m.location.lng.toString() : (m.longitude?.toString() || ""));
  };

  useEffect(() => {
    fetchMerchants();
  }, [token, user]);

  const handleAddMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!newMerchantName.trim() || !newMerchantAddress.trim() || !newMerchantCategory.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng điền các trường bắt buộc (*)",
        variant: "destructive"
      });
      return;
    }

    setIsAdding(true);
    try {
      const created = await createMerchant(token, {
        name: newMerchantName,
        address: newMerchantAddress,
        category: newMerchantCategory,
        latitude: parseFloat(newMerchantLatitude) || 10.762,
        longitude: parseFloat(newMerchantLongitude) || 106.682,
        description: newMerchantDescription,
      });

      toast({
        title: "Thành công! 🎉",
        description: `Đã thêm quán ăn '${created.name}'`,
      });

      // Reset add form fields
      setNewMerchantName("");
      setNewMerchantAddress("");
      setNewMerchantCategory("");
      setNewMerchantLatitude("");
      setNewMerchantLongitude("");
      setNewMerchantDescription("");
      setIsAddDialogOpen(false);

      // Reload list and select the new one
      setIsLoading(true);
      await fetchMerchants(created.id);
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.message || "Không thể thêm quán ăn mới.",
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteMerchant = async () => {
    if (!token || !merchant) return;

    setIsDeleting(true);
    try {
      await deleteMerchant(merchant.id, token);
      toast({
        title: "Thành công 🎉",
        description: `Đã xóa quán ăn '${merchant.name}'`,
      });
      setIsDeleteDialogOpen(false);

      // Reload list
      setIsLoading(true);
      await fetchMerchants();
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.message || "Không thể xóa quán ăn.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

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
      setMerchantsList(prev => prev.map(m => m.id === updated.id ? updated : m));
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

  if (error && error !== "No merchant found for this user.") {
    return <div className="min-h-screen flex items-center justify-center text-red-500">Lỗi: {typeof error === 'object' ? JSON.stringify(error) : String(error)}</div>;
  }

  if (!merchant) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <PageHeader
            title="Restaurant Profile"
            description="Quản lý thông tin và hình ảnh nhà hàng"
            className="flex-1"
          />
          <div className="flex flex-wrap items-center gap-3 bg-secondary/30 border border-border/40 p-2.5 rounded-full px-4 shrink-0 shadow-xs">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full gap-1.5 h-9 bg-background border-orange-500/20 text-orange-500 hover:bg-orange-500/10 hover:text-orange-600 font-bold text-xs">
                  <Plus className="w-3.5 h-3.5" /> Đăng ký quán mới
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px] rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="font-extrabold text-lg">Đăng ký quán ăn mới</DialogTitle>
                  <DialogDescription className="text-xs">Nhập thông tin quán ăn mới vào hệ thống.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddMerchant} className="space-y-4 py-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="new_name" className="text-xs font-bold">Tên quán <span className="text-destructive">*</span></Label>
                    <Input id="new_name" value={newMerchantName} onChange={(e) => setNewMerchantName(e.target.value)} required placeholder="Ví dụ: Bún Chả Hương Liên" className="rounded-xl" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="new_category" className="text-xs font-bold">Danh mục ẩm thực <span className="text-destructive">*</span></Label>
                    <Input id="new_category" placeholder="Ví dụ: Món Việt, Cafe, Trà sữa..." value={newMerchantCategory} onChange={(e) => setNewMerchantCategory(e.target.value)} required className="rounded-xl" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="new_address" className="text-xs font-bold">Địa chỉ <span className="text-destructive">*</span></Label>
                    <Input id="new_address" value={newMerchantAddress} onChange={(e) => setNewMerchantAddress(e.target.value)} required placeholder="Ví dụ: 24 Lê Văn Hưu, Quận Hai Bà Trưng, Hà Nội" className="rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <Label htmlFor="new_lat" className="text-xs font-bold">Vĩ độ (Latitude)</Label>
                      <Input id="new_lat" placeholder="21.0194" value={newMerchantLatitude} onChange={(e) => setNewMerchantLatitude(e.target.value)} className="rounded-xl" />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="new_lng" className="text-xs font-bold">Kinh độ (Longitude)</Label>
                      <Input id="new_lng" placeholder="105.8540" value={newMerchantLongitude} onChange={(e) => setNewMerchantLongitude(e.target.value)} className="rounded-xl" />
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="new_desc" className="text-xs font-bold">Mô tả quán ăn</Label>
                    <Textarea id="new_desc" rows={3} value={newMerchantDescription} onChange={(e) => setNewMerchantDescription(e.target.value)} placeholder="Mô tả qua về không gian hoặc món đặc trưng..." className="rounded-xl" />
                  </div>
                  <DialogFooter className="pt-4 flex items-center justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="rounded-full text-xs font-bold">Hủy</Button>
                    <Button type="submit" disabled={isAdding} className="rounded-full text-xs font-bold gap-2">
                      {isAdding && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Xác nhận thêm
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 border border-dashed border-border rounded-3xl bg-secondary/10 max-w-lg mx-auto my-12 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <MapPin className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <p className="text-lg font-bold text-foreground">Bạn chưa đăng ký quán ăn nào</p>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            Hồ sơ nhà hàng chưa sẵn sàng. Vui lòng đăng ký thông tin quán ăn mới để kích hoạt các cài đặt profile.
          </p>
          <Button size="lg" onClick={() => setIsAddDialogOpen(true)} className="rounded-full px-6 font-bold shadow-md hover:shadow-lg transition-shadow">
            Đăng ký quán ăn ngay
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Restaurant Profile"
          description="Quản lý thông tin và hình ảnh nhà hàng"
          className="flex-1"
        />

        {/* Dropdown to select active restaurant, Add new, and Delete current */}
        <div className="flex flex-wrap items-center gap-3 bg-secondary/30 border border-border/40 p-2.5 rounded-full px-4 shrink-0 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground shrink-0 pl-1">Chọn quán:</span>
            <Select
              value={merchant ? merchant.id.toString() : ""}
              onValueChange={(val) => {
                const matched = merchantsList.find(m => m.id.toString() === val);
                if (matched) setSelectedMerchant(matched);
              }}
            >
              <SelectTrigger className="w-[180px] h-9 rounded-full bg-background border-border/60 text-xs font-bold">
                <SelectValue placeholder="Chọn quán" />
              </SelectTrigger>
              <SelectContent>
                {merchantsList.map(m => (
                  <SelectItem key={m.id} value={m.id.toString()}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5 border-l border-border/60 pl-2">
            {/* Add Restaurant Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full gap-1.5 h-9 bg-background border-orange-500/20 text-orange-500 hover:bg-orange-500/10 hover:text-orange-600 font-bold text-xs">
                  <Plus className="w-3.5 h-3.5" /> Thêm quán
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px] rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="font-extrabold text-lg">Đăng ký quán ăn mới</DialogTitle>
                  <DialogDescription className="text-xs">Nhập thông tin quán ăn mới vào hệ thống.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddMerchant} className="space-y-4 py-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="new_name" className="text-xs font-bold">Tên quán <span className="text-destructive">*</span></Label>
                    <Input id="new_name" value={newMerchantName} onChange={(e) => setNewMerchantName(e.target.value)} required placeholder="Ví dụ: Bún Chả Hương Liên" className="rounded-xl" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="new_category" className="text-xs font-bold">Danh mục ẩm thực <span className="text-destructive">*</span></Label>
                    <Input id="new_category" placeholder="Ví dụ: Món Việt, Cafe, Trà sữa..." value={newMerchantCategory} onChange={(e) => setNewMerchantCategory(e.target.value)} required className="rounded-xl" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="new_address" className="text-xs font-bold">Địa chỉ <span className="text-destructive">*</span></Label>
                    <Input id="new_address" value={newMerchantAddress} onChange={(e) => setNewMerchantAddress(e.target.value)} required placeholder="Ví dụ: 24 Lê Văn Hưu, Quận Hai Bà Trưng, Hà Nội" className="rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <Label htmlFor="new_lat" className="text-xs font-bold">Vĩ độ (Latitude)</Label>
                      <Input id="new_lat" placeholder="21.0194" value={newMerchantLatitude} onChange={(e) => setNewMerchantLatitude(e.target.value)} className="rounded-xl" />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="new_lng" className="text-xs font-bold">Kinh độ (Longitude)</Label>
                      <Input id="new_lng" placeholder="105.8540" value={newMerchantLongitude} onChange={(e) => setNewMerchantLongitude(e.target.value)} className="rounded-xl" />
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="new_desc" className="text-xs font-bold">Mô tả quán ăn</Label>
                    <Textarea id="new_desc" rows={3} value={newMerchantDescription} onChange={(e) => setNewMerchantDescription(e.target.value)} placeholder="Mô tả qua về không gian hoặc món đặc trưng..." className="rounded-xl" />
                  </div>
                  <DialogFooter className="pt-4 flex items-center justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="rounded-full text-xs font-bold">Hủy</Button>
                    <Button type="submit" disabled={isAdding} className="rounded-full text-xs font-bold gap-2">
                      {isAdding && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Xác nhận thêm
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Delete current merchant */}
            {merchant && (
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5 h-9 font-bold text-xs px-3">
                    <Trash2 className="w-3.5 h-3.5" /> Xóa quán
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-3xl max-w-[450px]">
                  <DialogHeader>
                    <DialogTitle className="font-extrabold text-lg text-destructive">Xác nhận xóa quán ăn?</DialogTitle>
                    <DialogDescription className="text-xs leading-relaxed mt-2">
                      Bạn có chắc muốn xóa quán ăn <strong>{merchant.name}</strong> không?
                      <br />
                      Mọi thực đơn, khuyến mãi và dữ liệu liên quan sẽ bị xóa vĩnh viễn khỏi cơ sở dữ liệu. Hành động này không thể phục hồi!
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="pt-4 flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="rounded-full text-xs font-bold">Bỏ qua</Button>
                    <Button type="button" variant="destructive" disabled={isDeleting} onClick={handleDeleteMerchant} className="rounded-full text-xs font-bold gap-2">
                      {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Đồng ý xóa
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

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
