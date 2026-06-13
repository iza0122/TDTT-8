"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/merchant/page-header";
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Search, X, Utensils, Loader2, UploadCloud } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  getMerchantsByOwner, 
  getMerchant, 
  addMenuItem, 
  updateMenuItem, 
  deleteMenuItem,
  MerchantResponse 
} from "@/lib/services/merchant";

interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  is_available?: boolean;
}

interface Category {
  id: string;
  name: string;
}

const mockDishes: Dish[] = [
  {
    id: "1",
    name: "Classic Burger",
    description: "A juicy beef patty with lettuce, tomato, and cheese.",
    price: 12.99,
    category: "Main Course",
    imageUrl: "https://picsum.photos/seed/burger/80/80",
  },
  {
    id: "2",
    name: "Caesar Salad",
    description: "Fresh romaine lettuce with Caesar dressing, croutons, and parmesan.",
    price: 9.50,
    category: "Appetizer",
    imageUrl: "https://picsum.photos/seed/salad/80/80",
  },
  {
    id: "3",
    name: "Orange Juice",
    description: "Freshly squeezed orange juice.",
    price: 4.00,
    category: "Drinks",
    imageUrl: "https://picsum.photos/seed/juice/80/80",
  },
  {
    id: "4",
    name: "Chocolate Lava Cake",
    description: "Warm chocolate cake with a molten center, served with vanilla ice cream.",
    price: 8.50,
    category: "Desserts",
    imageUrl: "https://picsum.photos/seed/cake/80/80",
  },
];

const mockCategories: Category[] = [
  { id: "1", name: "Appetizer" },
  { id: "2", name: "Main Course" },
  { id: "3", name: "Drinks" },
  { id: "4", name: "Desserts" },
];

export default function MenuManagementPage() {
  const { token, user } = useAuth();
  const { toast } = useToast();

  const [merchant, setMerchant] = useState<MerchantResponse | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [isDishDialogOpen, setIsDishDialogOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Dish Photo upload states
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [isSavingDish, setIsSavingDish] = useState(false);

  useEffect(() => {
    if (isDishDialogOpen) {
      setSelectedImageFile(null);
      setSelectedImagePreview(editingDish?.imageUrl || null);
    } else {
      setSelectedImageFile(null);
      if (selectedImagePreview && selectedImageFile) {
        URL.revokeObjectURL(selectedImagePreview);
      }
      setSelectedImagePreview(null);
    }
  }, [isDishDialogOpen, editingDish]);

  useEffect(() => {
    const fetchMerchantAndMenu = async () => {
      if (!token || !user) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const userMerchants = await getMerchantsByOwner(token);
        if (userMerchants.length > 0) {
          const activeMerchant = userMerchants[0];
          setMerchant(activeMerchant);
          const details = await getMerchant(activeMerchant.id);
          const mappedDishes = (details.menus || []).map((m: any) => ({
            id: String(m.id),
            name: m.dish_name,
            price: m.price,
            description: m.description || "",
            category: "Món ăn",
            imageUrl: m.image_url || "",
            is_available: m.is_available ?? true
          }));
          setDishes(mappedDishes);
        }
      } catch (error: any) {
        console.error("Failed to load merchant menu data:", error);
        toast({
          title: "Lỗi 🙁",
          description: error.message || "Không thể tải thực đơn.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchMerchantAndMenu();
  }, [token, user]);

  const filtered = dishes.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "all" || d.category === filterCategory;
    return matchSearch && matchCat;
  });

  const handleAddEditDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !merchant) {
      toast({
        title: "Lỗi",
        description: "Bạn chưa đăng nhập hoặc không sở hữu quán ăn nào.",
        variant: "destructive",
      });
      return;
    }

    const target = e.target as HTMLFormElement;
    const dishNameInput = target.elements.namedItem("dishName") as HTMLInputElement;
    const dishPriceInput = target.elements.namedItem("dishPrice") as HTMLInputElement;
    const dishDescriptionInput = target.elements.namedItem("dishDescription") as HTMLTextAreaElement;
    const dishAvailableInput = target.elements.namedItem("dishAvailable") as HTMLInputElement;

    const dishName = dishNameInput?.value || "";
    const dishPriceRaw = dishPriceInput?.value || "";
    const dishDescription = dishDescriptionInput?.value || "";
    const dishAvailable = dishAvailableInput ? dishAvailableInput.checked : true;

    if (!dishName.trim() || !dishPriceRaw) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập đầy đủ tên và giá món ăn.",
        variant: "destructive",
      });
      return;
    }

    const priceVal = Math.round(parseFloat(dishPriceRaw));
    setIsSavingDish(true);

    try {
      let imageUrlToSave = editingDish?.imageUrl || "";

      if (selectedImageFile) {
        const presignedRes = await fetch("/api/content/presigned-url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            file_name: selectedImageFile.name,
            content_type: selectedImageFile.type,
            folder: "images"
          })
        });

        if (!presignedRes.ok) {
          throw new Error("Không thể khởi tạo link tải ảnh lên hệ thống.");
        }

        const { upload_url, public_url } = await presignedRes.json();

        const uploadRes = await fetch(upload_url, {
          method: "PUT",
          headers: {
            "Content-Type": selectedImageFile.type
          },
          body: selectedImageFile
        });

        if (!uploadRes.ok) {
          throw new Error("Không thể tải ảnh lên kho lưu trữ đám mây.");
        }

        imageUrlToSave = public_url;
      } else if (selectedImagePreview === null) {
        imageUrlToSave = "";
      }

      if (editingDish) {
        const updatedItem = await updateMenuItem(merchant.id, Number(editingDish.id), token, {
          dish_name: dishName,
          price: priceVal,
          is_available: dishAvailable,
          description: dishDescription,
          image_url: imageUrlToSave
        });

        setDishes((prev) =>
          prev.map((d) =>
            d.id === editingDish.id
              ? {
                  ...d,
                  name: updatedItem.dish_name,
                  price: updatedItem.price,
                  is_available: updatedItem.is_available ?? true,
                  description: updatedItem.description || "",
                  imageUrl: updatedItem.image_url || "",
                }
              : d
          )
        );

        toast({
          title: "Thành công 🎉",
          description: "Đã cập nhật món ăn.",
        });
      } else {
        const newItem = await addMenuItem(merchant.id, token, {
          dish_name: dishName,
          price: priceVal,
          is_available: true,
          description: dishDescription,
          image_url: imageUrlToSave
        });

        const mappedNewDish: Dish = {
          id: String(newItem.id),
          name: newItem.dish_name,
          price: newItem.price,
          description: newItem.description || "",
          category: "Món ăn",
          imageUrl: newItem.image_url || "",
          is_available: newItem.is_available ?? true,
        };

        setDishes((prev) => [...prev, mappedNewDish]);

        toast({
          title: "Thành công 🎉",
          description: "Đã thêm món mới vào thực đơn.",
        });
      }
      setIsDishDialogOpen(false);
    } catch (error: any) {
      console.error("Failed to save menu item:", error);
      toast({
        title: "Lỗi 🙁",
        description: error.message || "Không thể lưu món ăn.",
        variant: "destructive",
      });
    } finally {
      setIsSavingDish(false);
    }
  };

  const handleDeleteDish = async (id: string) => {
    if (!token || !merchant) return;
    try {
      await deleteMenuItem(merchant.id, Number(id), token);
      setDishes((prev) => prev.filter((d) => d.id !== id));
      toast({
        title: "Thành công 🎉",
        description: "Đã xóa món ăn khỏi thực đơn.",
      });
    } catch (error: any) {
      console.error("Failed to delete menu item:", error);
      toast({
        title: "Lỗi 🙁",
        description: error.message || "Không thể xóa món ăn.",
        variant: "destructive",
      });
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim()) {
      setCategories([...categories, { id: String(Date.now()), name: newCategoryName.trim() }]);
      setNewCategoryName("");
    }
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(categories.filter((c) => c.id !== id));
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-2 mt-2 text-primary font-medium text-sm animate-pulse">Đang tải thực đơn...</p>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 border border-dashed border-border rounded-2xl bg-secondary/10">
        <Utensils className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="text-sm font-medium text-foreground">Bạn chưa đăng ký quán ăn nào</p>
        <p className="text-xs text-muted-foreground mt-1 mb-4">Vui lòng đăng ký quán ăn mới để quản lý thực đơn.</p>
        <Link href="/merchant/add-restaurant">
          <Button className="rounded-full">Đăng ký quán ăn</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Menu Management"
        description="Quản lý món ăn và danh mục thực đơn"
        action={
          <Dialog open={isDishDialogOpen} onOpenChange={setIsDishDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingDish(null)} className="gap-2">
                <Plus className="w-4 h-4" />
                Thêm món mới
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[440px]">
              <DialogHeader>
                <DialogTitle>{editingDish ? "Chỉnh sửa món ăn" : "Thêm món mới"}</DialogTitle>
                <DialogDescription>
                  {editingDish ? "Cập nhật thông tin món ăn." : "Thêm món ăn mới vào thực đơn."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddEditDish} className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="dishName">Tên món</Label>
                  <Input id="dishName" defaultValue={editingDish?.name ?? ""} placeholder="Ví dụ: Phở bò đặc biệt" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dishDescription">Mô tả</Label>
                  <Textarea id="dishDescription" defaultValue={editingDish?.description ?? ""} placeholder="Mô tả ngắn về món ăn..." rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="dishPrice">Giá (VND)</Label>
                    <Input id="dishPrice" type="number" step="1" defaultValue={editingDish?.price?.toString() ?? ""} placeholder="30000" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dishCategory">Danh mục</Label>
                    <Select defaultValue={editingDish?.category ?? ""}>
                      <SelectTrigger id="dishCategory">
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {editingDish && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="dishAvailable"
                      name="dishAvailable"
                      defaultChecked={editingDish.is_available !== false}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    />
                    <Label htmlFor="dishAvailable" className="cursor-pointer font-medium">Còn món (Đang bán)</Label>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label>Hình ảnh món ăn</Label>
                  {selectedImagePreview ? (
                    <div className="relative group w-32 h-24 rounded-xl overflow-hidden border border-border shadow-xs bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={selectedImagePreview} alt="Dish preview" className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-200" />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImageFile(null);
                          setSelectedImagePreview(null);
                        }}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1 cursor-pointer"
                      >
                        <X className="w-4 h-4" /> Gỡ ảnh
                      </button>
                    </div>
                  ) : (
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          const fileInput = document.getElementById("dishImageFile") as HTMLInputElement;
                          fileInput?.click();
                        }}
                        className="w-full py-6 flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border text-center hover:border-primary hover:bg-primary/5 transition-colors group cursor-pointer"
                      >
                        <UploadCloud className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="text-xs font-semibold text-foreground">Tải ảnh món ăn lên</span>
                        <span className="text-[10px] text-muted-foreground">PNG, JPG tối đa 5MB</span>
                      </button>
                      <input
                        id="dishImageFile"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setSelectedImageFile(file);
                          if (file) {
                            setSelectedImagePreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSavingDish} className="gap-1.5">
                    {isSavingDish && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {isSavingDish ? "Đang lưu..." : "Lưu món ăn"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Dishes Card */}
      <Card className="gap-0 py-0">
        <CardHeader className="px-5 pt-5 pb-4 border-b border-border">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm món ăn..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Tất cả danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="px-0 py-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Utensils className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Không tìm thấy món ăn</p>
              <p className="text-xs text-muted-foreground mt-1">
                {search || filterCategory !== "all" ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm" : "Thêm món đầu tiên để bắt đầu"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5 w-12"></TableHead>
                  <TableHead>Tên món</TableHead>
                  <TableHead className="hidden sm:table-cell">Danh mục</TableHead>
                  <TableHead className="hidden md:table-cell">Trạng thái</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead className="text-right pr-5">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((dish) => (
                  <TableRow key={dish.id} className="group">
                    <TableCell className="pl-5">
                      {dish.imageUrl ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0 relative">
                          <Image
                            src={dish.imageUrl}
                            alt={dish.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0 border border-border/10">
                          <Utensils className="w-5 h-5 text-muted-foreground/60" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm text-foreground">{dish.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 hidden md:block">{dish.description}</p>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="secondary" className="text-xs font-medium">
                        {dish.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {dish.is_available !== false ? (
                        <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/10 text-xs font-medium">
                          Còn món
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs font-medium text-muted-foreground">
                          Tạm hết
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium tabular-nums text-sm">
                      {dish.price.toLocaleString('vi-VN')}đ
                    </TableCell>
                    <TableCell className="text-right pr-5">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => { setEditingDish(dish); setIsDishDialogOpen(true); }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteDish(dish.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Categories Card */}
      <Card className="gap-0 py-0">
        <CardHeader className="px-5 pt-5 pb-4 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Danh mục thực đơn</p>
              <p className="text-xs text-muted-foreground mt-0.5">{categories.length} danh mục</p>
            </div>
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <Input
                placeholder="Tên danh mục mới..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-48"
              />
              <Button type="submit" size="sm" variant="outline" className="gap-1.5 shrink-0">
                <Plus className="w-3.5 h-3.5" />
                Thêm
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent className="px-5 py-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary/50 text-sm font-medium text-foreground group"
              >
                {cat.name}
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
