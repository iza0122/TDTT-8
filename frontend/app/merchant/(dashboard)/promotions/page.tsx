"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/merchant/page-header";
import { useState } from "react";
import { Plus, Pencil, Trash2, Megaphone } from "lucide-react";

interface Promotion {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const mockPromotions: Promotion[] = [
  {
    id: "1",
    title: "Summer Sale",
    description: "Giảm 20% tất cả món chính.",
    startDate: "2026-06-01",
    endDate: "2026-06-30",
    isActive: true,
  },
  {
    id: "2",
    title: "Happy Hour",
    description: "Mua 1 tặng 1 đồ uống từ 15:00 - 17:00.",
    startDate: "2026-06-01",
    endDate: "2026-08-31",
    isActive: false,
  },
  {
    id: "3",
    title: "Khai trương tháng 5",
    description: "Giảm 15% cho hóa đơn trên 300.000đ.",
    startDate: "2026-05-01",
    endDate: "2026-05-31",
    isActive: false,
  },
];

function getPromoStatus(promo: Promotion): { label: string; variant: "default" | "secondary" | "destructive" | "outline" ; className: string } {
  const today = new Date();
  const end = new Date(promo.endDate);
  if (end < today) {
    return { label: "Đã hết hạn", variant: "outline", className: "border-destructive/40 text-destructive bg-destructive/5" };
  }
  if (!promo.isActive) {
    return { label: "Tạm dừng", variant: "secondary", className: "" };
  }
  return { label: "Đang hoạt động", variant: "outline", className: "border-green-500/40 text-green-600 bg-green-500/5" };
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function PromotionsManagementPage() {
  const [promotions, setPromotions] = useState<Promotion[]>(mockPromotions);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [formActive, setFormActive] = useState(false);

  const handleOpenAdd = () => {
    setEditingPromo(null);
    setFormActive(false);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (promo: Promotion) => {
    setEditingPromo(promo);
    setFormActive(promo.isActive);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setPromotions(promotions.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Promotions"
        description="Quản lý các chương trình khuyến mãi và ưu đãi"
        action={
          <Button onClick={handleOpenAdd} className="gap-2">
            <Plus className="w-4 h-4" />
            Tạo khuyến mãi
          </Button>
        }
      />

      <Card className="gap-0 py-0">
        <CardContent className="px-0 py-0">
          {promotions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Megaphone className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Chưa có khuyến mãi nào</p>
              <p className="text-xs text-muted-foreground mt-1">Tạo chương trình khuyến mãi đầu tiên để thu hút khách hàng</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">Tiêu đề</TableHead>
                  <TableHead className="hidden md:table-cell">Thời gian</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right pr-5">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotions.map((promo) => {
                  const status = getPromoStatus(promo);
                  return (
                    <TableRow key={promo.id} className="group">
                      <TableCell className="pl-5">
                        <p className="font-medium text-sm text-foreground">{promo.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 max-w-xs">{promo.description}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {formatDate(promo.startDate)} – {formatDate(promo.endDate)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className={status.className}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-5">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => handleOpenEdit(promo)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(promo.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>{editingPromo ? "Chỉnh sửa khuyến mãi" : "Tạo khuyến mãi mới"}</DialogTitle>
            <DialogDescription>
              {editingPromo ? "Cập nhật thông tin chương trình khuyến mãi." : "Thêm chương trình khuyến mãi mới cho nhà hàng."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="promoTitle">Tiêu đề</Label>
              <Input id="promoTitle" defaultValue={editingPromo?.title ?? ""} placeholder="Ví dụ: Summer Sale" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="promoDescription">Mô tả</Label>
              <Textarea id="promoDescription" defaultValue={editingPromo?.description ?? ""} placeholder="Mô tả chi tiết ưu đãi..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Ngày bắt đầu</Label>
                <Input id="startDate" type="date" defaultValue={editingPromo?.startDate ?? ""} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">Ngày kết thúc</Label>
                <Input id="endDate" type="date" defaultValue={editingPromo?.endDate ?? ""} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Kích hoạt ngay</p>
                <p className="text-xs text-muted-foreground mt-0.5">Khuyến mãi sẽ hiển thị với khách hàng</p>
              </div>
              <Switch checked={formActive} onCheckedChange={setFormActive} />
            </div>
            <DialogFooter>
              <Button type="submit">Lưu khuyến mãi</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
