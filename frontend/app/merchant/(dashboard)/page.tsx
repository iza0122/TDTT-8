"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/merchant/stat-card";
import { PageHeader } from "@/components/merchant/page-header";
import Link from "next/link";
import MerchantList from "@/components/merchant/merchant-list";
import {
  Star,
  MessageSquare,
  Utensils,
  Megaphone,
  Plus,
  ArrowRight,
  Bell,
  Clock,
  ChevronRight,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  getMerchantsByOwner, 
  getMerchant, 
  getMerchantStats, 
  MerchantResponse, 
  MerchantStats 
} from "@/lib/services/merchant";

export default function MerchantDashboardOverviewPage() {
  const { token, user } = useAuth();
  const { toast } = useToast();

  const [merchant, setMerchant] = useState<MerchantResponse | null>(null);
  const [merchants, setMerchants] = useState<MerchantResponse[]>([]);
  const [stats, setStats] = useState<MerchantStats | null>(null);
  const [dishes, setDishes] = useState<{ name: string; price: number; isAvailable: boolean }[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMerchantData = async (merchantId: number) => {
    try {
      const [statsData, detailsData] = await Promise.all([
        getMerchantStats(merchantId, token!),
        getMerchant(merchantId)
      ]);

      setStats(statsData);

      const mappedDishes = (detailsData.menus || []).map((m: any) => ({
        name: m.dish_name,
        price: m.price,
        isAvailable: m.is_available ?? true
      }));
      setDishes(mappedDishes);

      const generatedNotifs = [];
      const realReviews = detailsData.reviews || [];
      if (realReviews.length > 0) {
        realReviews.slice(0, 4).forEach((rev: any, idx: number) => {
          generatedNotifs.push({
            id: `notif-rev-${rev.id}`,
            type: "review",
            message: `${rev.customerName || "Khách hàng"} để lại đánh giá ${rev.rating} sao về nhà hàng: "${rev.comment}"`,
            time: rev.date ? new Date(rev.date).toLocaleDateString("vi-VN") : "Vừa xong",
            unread: idx === 0
          });
        });
      }
      if (statsData.active_promos > 0) {
        generatedNotifs.push({
          id: "notif-promo",
          type: "promo",
          message: `Chiến dịch quảng cáo của bạn đang hoạt động và thu hút lượt tiếp cận`,
          time: "1 ngày trước",
          unread: false
        });
      }
      if (generatedNotifs.length === 0) {
        generatedNotifs.push({
          id: "notif-empty",
          type: "general",
          message: "Chào mừng bạn đến với FoodieGram! Hãy bắt đầu bằng cách thêm món mới.",
          time: "Vừa xong",
          unread: true
        });
      }
      setNotifications(generatedNotifs);
    } catch (error: any) {
      console.error("Failed to load details for merchant:", error);
      toast({
        title: "Lỗi 🙁",
        description: "Không thể tải chi tiết dữ liệu thống kê cho nhà hàng.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
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

          await loadMerchantData(activeMerchant.id);
        }
      } catch (error: any) {
        console.error("Failed to load dashboard data:", error);
        toast({
          title: "Lỗi 🙁",
          description: error.message || "Không thể tải dữ liệu thống kê.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [token, user]);

  const handleMerchantChange = async (merchantIdStr: string) => {
    if (!token) return;
    const selected = merchants.find(m => String(m.id) === merchantIdStr);
    if (selected) {
      setMerchant(selected);
      localStorage.setItem("selected_merchant_id", merchantIdStr);
      setIsLoading(true);
      await loadMerchantData(selected.id);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-2 mt-2 text-primary font-medium text-sm animate-pulse">Đang tải dữ liệu tổng quan...</p>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Tổng quan hoạt động nhà hàng của bạn"
        />
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-center p-6 border border-dashed border-border rounded-2xl bg-secondary/10">
          <Utensils className="w-10 h-10 text-muted-foreground mb-3 animate-bounce" />
          <p className="text-sm font-medium text-foreground">Bạn chưa đăng ký quán ăn nào</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Vui lòng đăng ký quán ăn mới để xem báo cáo thống kê.</p>
          <Link href="/merchant/add-restaurant">
            <Button className="rounded-full px-6">Đăng ký quán ăn</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tổng quan hoạt động"
        description="Xem báo cáo thống kê và quản lý nhà hàng của bạn"
      />

      {merchants.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card shadow-xs">
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-primary animate-pulse" />
            <div>
              <span className="font-semibold text-sm block">Đang xem báo cáo của nhà hàng:</span>
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

      {/* Row 1 — Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Average Rating"
          value={`${stats ? stats.rating_avg.toFixed(1) : merchant.rating_avg.toFixed(1)} ★`}
          icon={Star}
          iconClassName="bg-amber-500/10 text-amber-500"
          description={`${stats ? stats.total_reviews : 0} đánh giá`}
        />
        <StatCard
          label="Total Reviews"
          value={stats ? stats.total_reviews : 0}
          icon={MessageSquare}
          iconClassName="bg-blue-500/10 text-blue-500"
          description="Từ khách hàng"
        />
        <StatCard
          label="Menu Items"
          value={dishes.length}
          icon={Utensils}
          iconClassName="bg-primary/10 text-primary"
          description="Món ăn trong thực đơn"
        />
        <StatCard
          label="Active Promos"
          value={stats ? stats.active_promos : 0}
          icon={Megaphone}
          iconClassName="bg-green-500/10 text-green-600"
          description="Đang chạy"
        />
      </div>

      {/* Row 2 — Popular Dishes + Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Popular Dishes */}
        <Card className="md:col-span-2 gap-0 py-0">
          <CardHeader className="px-5 pt-5 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Danh sách món ăn</CardTitle>
              <Link href="/merchant/menu">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1 h-7 px-2">
                  Xem menu <ChevronRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-5 py-4 space-y-4">
            {dishes.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                Thực đơn của bạn đang trống. Hãy thêm món mới.
              </div>
            ) : (
              dishes.slice(0, 4).map((dish, i) => (
                <div key={dish.name} className="flex items-center justify-between py-1 border-b border-border/40 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-muted-foreground/60 w-4 tabular-nums">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{dish.name}</p>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 mt-0.5 font-medium">
                        {dish.isAvailable ? "Còn món" : "Tạm dừng"}
                      </Badge>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-primary tabular-nums">
                    {dish.price.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="gap-0 py-0">
          <CardHeader className="px-5 pt-5 pb-4 border-b border-border">
            <CardTitle className="text-sm font-semibold">Thao tác nhanh</CardTitle>
          </CardHeader>
          <CardContent className="px-5 py-4 space-y-2">
            <Link href="/merchant/add-restaurant" className="block">
              <Button variant="outline" className="w-full justify-start gap-3 h-10 text-sm">
                <div className="w-6 h-6 rounded-md bg-orange-500/10 flex items-center justify-center shrink-0">
                  <Plus className="w-3.5 h-3.5 text-orange-500" />
                </div>
                Thêm Quán Ăn Mới
                <ArrowRight className="w-3.5 h-3.5 ml-auto text-muted-foreground" />
              </Button>
            </Link>
            <Link href="/merchant/menu" className="block">
              <Button variant="outline" className="w-full justify-start gap-3 h-10 text-sm">
                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Plus className="w-3.5 h-3.5 text-primary" />
                </div>
                Thêm món mới
                <ArrowRight className="w-3.5 h-3.5 ml-auto text-muted-foreground" />
              </Button>
            </Link>
            <Link href="/merchant/promotions" className="block">
              <Button variant="outline" className="w-full justify-start gap-3 h-10 text-sm">
                <div className="w-6 h-6 rounded-md bg-green-500/10 flex items-center justify-center shrink-0">
                  <Megaphone className="w-3.5 h-3.5 text-green-600" />
                </div>
                Tạo khuyến mãi
                <ArrowRight className="w-3.5 h-3.5 ml-auto text-muted-foreground" />
              </Button>
            </Link>
            <Link href="/merchant/reviews" className="block">
              <Button variant="outline" className="w-full justify-start gap-3 h-10 text-sm">
                <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Star className="w-3.5 h-3.5 text-blue-500" />
                </div>
                Xem đánh giá mới
                <ArrowRight className="w-3.5 h-3.5 ml-auto text-muted-foreground" />
              </Button>
            </Link>
            <Link href="/merchant/profile" className="block">
              <Button variant="outline" className="w-full justify-start gap-3 h-10 text-sm">
                <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Utensils className="w-3.5 h-3.5 text-amber-500" />
                </div>
                Cập nhật hồ sơ
                <ArrowRight className="w-3.5 h-3.5 ml-auto text-muted-foreground" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Row 3 — Notifications */}
      <Card className="gap-0 py-0">
        <CardHeader className="px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold">Thông báo</CardTitle>
              <Badge className="text-[10px] px-1.5 py-0 h-4">
                {notifications.filter((n) => n.unread).length} mới
              </Badge>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7 px-2">
              Xem tất cả
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-5 py-2">
          {notifications.map((notif, i) => (
            <div
              key={notif.id}
              className={`flex items-start gap-3 py-3.5 ${
                i < notifications.length - 1 ? "border-b border-border/60" : ""
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  notif.type === "review"
                    ? "bg-blue-500/10"
                    : "bg-amber-500/10"
                }`}
              >
                {notif.type === "review" ? (
                  <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                ) : (
                  <Bell className="w-3.5 h-3.5 text-amber-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${notif.unread ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                  {notif.message}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3 text-muted-foreground/60" />
                  <span className="text-[11px] text-muted-foreground/60">{notif.time}</span>
                </div>
              </div>
              {notif.unread && (
                <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
