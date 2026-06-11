"use client";

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
import { useState } from "react";
import { Plus, Pencil, Trash2, Search, X, Utensils } from "lucide-react";
import Image from "next/image";

interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
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
  const [dishes, setDishes] = useState<Dish[]>(mockDishes);
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [isDishDialogOpen, setIsDishDialogOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const filtered = dishes.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "all" || d.category === filterCategory;
    return matchSearch && matchCat;
  });

  const handleAddEditDish = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDishDialogOpen(false);
  };

  const handleDeleteDish = (id: string) => {
    setDishes(dishes.filter((d) => d.id !== id));
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
                    <Label htmlFor="dishPrice">Giá (USD)</Label>
                    <Input id="dishPrice" type="number" step="0.01" defaultValue={editingDish?.price.toString() ?? ""} placeholder="0.00" />
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
                <div className="grid gap-2">
                  <Label htmlFor="dishImage">URL hình ảnh</Label>
                  <Input id="dishImage" defaultValue={editingDish?.imageUrl ?? ""} placeholder="https://..." />
                </div>
                <DialogFooter>
                  <Button type="submit">Lưu món ăn</Button>
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
                  <TableHead>Giá</TableHead>
                  <TableHead className="text-right pr-5">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((dish) => (
                  <TableRow key={dish.id} className="group">
                    <TableCell className="pl-5">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                        <Image
                          src={dish.imageUrl}
                          alt={dish.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      </div>
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
                    <TableCell className="font-medium tabular-nums text-sm">
                      ${dish.price.toFixed(2)}
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
