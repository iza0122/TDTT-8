import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/merchant/stat-card";
import { PageHeader } from "@/components/merchant/page-header";
import Link from "next/link";
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
} from "lucide-react";

const mockMetrics = {
  averageRating: 4.5,
  totalReviews: 120,
  popularDishes: [
    { name: "Spicy Noodles", likes: 350 },
    { name: "Vegan Burger", likes: 280 },
    { name: "Sushi Platter", likes: 210 },
    { name: "Miso Ramen", likes: 174 },
  ],
  activePromos: 2,
  notifications: [
    { id: "1", type: "review", message: "Trần Văn Đức để lại đánh giá 4 sao mới", time: "2 phút trước", unread: true },
    { id: "2", type: "promo", message: "Khuyến mãi \"Summer Sale\" còn 3 ngày nữa hết hạn", time: "1 giờ trước", unread: true },
    { id: "3", type: "review", message: "Nguyễn Thị Hoa để lại đánh giá 5 sao", time: "3 giờ trước", unread: false },
  ],
};

const maxLikes = mockMetrics.popularDishes[0].likes;

export default function MerchantDashboardOverviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Tổng quan hoạt động nhà hàng của bạn"
      />

      {/* Row 1 — Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Average Rating"
          value={`${mockMetrics.averageRating} ★`}
          icon={Star}
          iconClassName="bg-amber-500/10 text-amber-500"
          description={`${mockMetrics.totalReviews} đánh giá`}
          trend={{ value: "+0.2 tháng này", direction: "up" }}
        />
        <StatCard
          label="Total Reviews"
          value={mockMetrics.totalReviews}
          icon={MessageSquare}
          iconClassName="bg-blue-500/10 text-blue-500"
          description="Từ khách hàng"
          trend={{ value: "+8 tuần này", direction: "up" }}
        />
        <StatCard
          label="Top Dish Likes"
          value={maxLikes}
          icon={Utensils}
          iconClassName="bg-primary/10 text-primary"
          description={mockMetrics.popularDishes[0].name}
        />
        <StatCard
          label="Active Promos"
          value={mockMetrics.activePromos}
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
              <CardTitle className="text-sm font-semibold">Món ăn phổ biến</CardTitle>
              <Link href="/merchant/menu">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1 h-7 px-2">
                  Xem menu <ChevronRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-5 py-4 space-y-4">
            {mockMetrics.popularDishes.map((dish, i) => (
              <div key={dish.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-muted-foreground/60 w-4 tabular-nums">
                      {i + 1}
                    </span>
                    <span className="font-medium text-foreground">{dish.name}</span>
                  </div>
                  <span className="text-xs font-bold tabular-nums text-muted-foreground">
                    {dish.likes} likes
                  </span>
                </div>
                <Progress
                  value={(dish.likes / maxLikes) * 100}
                  className="h-1.5"
                />
              </div>
            ))}
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
                {mockMetrics.notifications.filter((n) => n.unread).length} mới
              </Badge>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7 px-2">
              Xem tất cả
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-5 py-2">
          {mockMetrics.notifications.map((notif, i) => (
            <div
              key={notif.id}
              className={`flex items-start gap-3 py-3.5 ${
                i < mockMetrics.notifications.length - 1 ? "border-b border-border/60" : ""
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
