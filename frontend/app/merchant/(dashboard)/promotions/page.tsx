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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/merchant/page-header";
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Megaphone, Loader2, Utensils } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  getMerchantsByOwner,
  getCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  MerchantResponse,
  CampaignResponse
} from "@/lib/services/merchant";

interface Promotion {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const mapCampaignToPromotion = (c: CampaignResponse): Promotion => ({
  id: String(c.id),
  title: c.title,
  description: c.description || "",
  startDate: c.start_date ? c.start_date.split("T")[0] : c.created_at.split("T")[0],
  endDate: c.end_date ? c.end_date.split("T")[0] : new Date(new Date(c.created_at).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  isActive: c.is_active
});

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
  const { token, user } = useAuth();
  const { toast } = useToast();

  const [merchant, setMerchant] = useState<MerchantResponse | null>(null);
  const [merchants, setMerchants] = useState<MerchantResponse[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [formActive, setFormActive] = useState(false);

  useEffect(() => {
    const fetchPromotions = async () => {
      if (!token || !user) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const userMerchants = await getMerchantsByOwner(token);
        setMerchants(userMerchants);
        if (userMerchants.length > 0) {
          const savedId = localStorage.getItem("selected_merchant_id");
          const activeMerchant = userMerchants.find(m => String(m.id) === savedId) || userMerchants[0];
          setMerchant(activeMerchant);
          localStorage.setItem("selected_merchant_id", String(activeMerchant.id));
          localStorage.setItem("selected_merchant_name", activeMerchant.name);

          const campaignsList = await getCampaigns(activeMerchant.id, token);
          setPromotions(campaignsList.map(mapCampaignToPromotion));
        }
      } catch (error: any) {
        console.error("Failed to fetch promotions:", error);
        toast({
          title: "Lỗi 🙁",
          description: error.message || "Không thể tải danh sách khuyến mãi.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPromotions();
  }, [token, user]);

  const handleMerchantChange = async (merchantIdStr: string) => {
    if (!token) return;
    const selected = merchants.find(m => String(m.id) === merchantIdStr);
    if (selected) {
      setMerchant(selected);
      localStorage.setItem("selected_merchant_id", merchantIdStr);
      localStorage.setItem("selected_merchant_name", selected.name);
      setIsLoading(true);
      try {
        const campaignsList = await getCampaigns(selected.id, token);
        setPromotions(campaignsList.map(mapCampaignToPromotion));
      } catch (error: any) {
        console.error("Failed to change merchant promotions:", error);
        toast({
          title: "Lỗi 🙁",
          description: error.message || "Không thể tải khuyến mãi cho quán ăn này.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleOpenAdd = () => {
    setEditingPromo(null);
    setFormActive(true);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (promo: Promotion) => {
    setEditingPromo(promo);
    setFormActive(promo.isActive);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !merchant) return;

    const target = e.target as HTMLFormElement;
    const title = (target.elements.namedItem("promoTitle") as HTMLInputElement).value;
    const description = (target.elements.namedItem("promoDescription") as HTMLTextAreaElement).value;
    const startDate = (target.elements.namedItem("startDate") as HTMLInputElement).value || null;
    const endDate = (target.elements.namedItem("endDate") as HTMLInputElement).value || null;

    if (!title.trim()) {
      toast({
        title: "Lỗi",
        description: "Tiêu đề không được để trống.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingPromo) {
        const updated = await updateCampaign(merchant.id, Number(editingPromo.id), token, {
          title,
          description,
          start_date: startDate,
          end_date: endDate,
          is_active: formActive
        });
        setPromotions(promotions.map(p => p.id === editingPromo.id ? mapCampaignToPromotion(updated) : p));
        toast({
          title: "Thành công 🎉",
          description: "Đã cập nhật chiến dịch khuyến mãi."
        });
      } else {
        const created = await createCampaign(merchant.id, token, {
          title,
          description,
          start_date: startDate,
          end_date: endDate,
          is_active: formActive
        });
        setPromotions([mapCampaignToPromotion(created), ...promotions]);
        toast({
          title: "Thành công 🎉",
          description: "Đã tạo chiến dịch khuyến mãi mới."
        });
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      toast({
        title: "Lỗi 🙁",
        description: err.message || "Không thể lưu chiến dịch.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !merchant) return;
    try {
      await deleteCampaign(merchant.id, Number(id), token);
      setPromotions(promotions.filter((p) => p.id !== id));
      toast({
        title: "Thành công 🎉",
        description: "Đã xóa chiến dịch khuyến mãi."
      });
    } catch (err: any) {
      toast({
        title: "Lỗi 🙁",
        description: err.message || "Không thể xóa chiến dịch.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-2 mt-2 text-primary font-medium text-sm animate-pulse">Đang tải danh sách khuyến mãi...</p>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Promotions"
          description="Quản lý các chương trình khuyến mãi và ưu đãi"
        />
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-center p-6 border border-dashed border-border rounded-2xl bg-secondary/10">
          <Megaphone className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">Bạn chưa đăng ký quán ăn nào</p>
          <p className="text-xs text-muted-foreground mt-1">Vui lòng đăng ký quán ăn mới để quản lý khuyến mãi.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chương trình khuyến mãi"
        description="Quản lý các chương trình khuyến mãi và ưu đãi"
        action={
          <Button onClick={handleOpenAdd} className="gap-2">
            <Plus className="w-4 h-4" />
            Tạo khuyến mãi
          </Button>
        }
      />

      {merchants.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card shadow-xs">
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-primary animate-pulse" />
            <div>
              <span className="font-semibold text-sm block">Đang quản lý khuyến mãi của nhà hàng:</span>
              <span className="text-xs text-muted-foreground font-medium">{merchant.name} ({merchant.category || "Chưa phân loại"})</span>
            </div>
          </div>
          {merchants.length > 1 && (
            <div className="flex items-center gap-2">
              <label htmlFor="merchant-select" className="text-xs text-muted-foreground font-medium shrink-0">
                Chuyển nhà hàng:
              </label>
              <Select value={String(merchant.id)} onValueChange={handleMerchantChange}>
                <SelectTrigger id="merchant-select" className="w-56 h-9 bg-background">
                  <SelectValue placeholder="Chọn nhà hàng" />
                </SelectTrigger>
                <SelectContent>
                  {merchants.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

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
