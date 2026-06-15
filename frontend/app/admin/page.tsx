"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { getAdminStats, getAdminVideos, getAdminUsers, AdminStats, AdminVideo, AdminUser } from "@/lib/services/admin";
import { StatCard } from "@/components/merchant/stat-card";
import { PageHeader } from "@/components/merchant/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Store, Video, Megaphone, Clock, ChevronRight, AlertCircle } from "lucide-react";

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingVideos, setPendingVideos] = useState<AdminVideo[]>([]);
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      getAdminStats(token),
      getAdminVideos(token, { limit: 5, status: "pending" }),
      getAdminUsers(token, { limit: 5, sort: "newest" }),
    ])
      .then(([statsData, videosData, usersData]) => {
        setStats(statsData);
        setPendingVideos(videosData.items ?? []);
        setRecentUsers(usersData.items ?? []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Tổng quan hoạt động nền tảng FoodieGram"
      />

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error} — dữ liệu hiển thị bên dưới là mock.</span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tổng người dùng"
          value={loading ? "..." : (stats?.total_users ?? 0)}
          icon={Users}
          iconClassName="bg-blue-500/10 text-blue-500"
          description="Toàn hệ thống"
        />
        <StatCard
          label="Video chờ duyệt"
          value={loading ? "..." : (stats?.pending_videos ?? 0)}
          icon={Video}
          iconClassName="bg-amber-500/10 text-amber-500"
          description="Cần xem xét"
        />
        <StatCard
          label="Quán đang hoạt động"
          value={loading ? "..." : (stats?.active_merchants ?? 0)}
          icon={Store}
          iconClassName="bg-green-500/10 text-green-600"
          description="is_active = true"
        />
        <StatCard
          label="Campaign đang chạy"
          value={loading ? "..." : (stats?.active_campaigns ?? 0)}
          icon={Megaphone}
          iconClassName="bg-primary/10 text-primary"
          description="Đang chạy"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="gap-0 py-0">
          <CardHeader className="px-5 pt-5 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Video className="w-4 h-4 text-amber-500" />
                Video chờ duyệt
                {(stats?.pending_videos ?? 0) > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 h-4 bg-amber-500/20 text-amber-600 border-amber-500/30">
                    {stats?.pending_videos}
                  </Badge>
                )}
              </CardTitle>
              <Link href="/admin/videos">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1 h-7 px-2">
                  Xem tất cả <ChevronRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-5 py-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 rounded-md bg-muted animate-pulse" />
                ))}
              </div>
            ) : pendingVideos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Không có video nào chờ duyệt.
              </p>
            ) : (
              <div className="space-y-0">
                {pendingVideos.map((video, i) => (
                  <div
                    key={video.id}
                    className={`flex items-center gap-3 py-3 ${
                      i < pendingVideos.length - 1 ? "border-b border-border/60" : ""
                    }`}
                  >
                    <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                      {video.thumbnail_url ? (
                        <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Video className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{video.title ?? "Không có tiêu đề"}</p>
                      <p className="text-xs text-muted-foreground">
                        {video.reviewer?.full_name ?? `User #${video.reviewer_id}`}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0 bg-amber-500/10 text-amber-600 border-amber-500/20">
                      pending
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="gap-0 py-0">
          <CardHeader className="px-5 pt-5 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Tài khoản mới đăng ký
              </CardTitle>
              <Link href="/admin/users">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1 h-7 px-2">
                  Xem tất cả <ChevronRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-5 py-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 rounded-md bg-muted animate-pulse" />
                ))}
              </div>
            ) : recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Không có dữ liệu.
              </p>
            ) : (
              <div className="space-y-0">
                {recentUsers.map((u, i) => (
                  <div
                    key={u.id}
                    className={`flex items-center gap-3 py-3 ${
                      i < recentUsers.length - 1 ? "border-b border-border/60" : ""
                    }`}
                  >
                    <Avatar className="w-8 h-8 shrink-0">
                      {u.avatar_url && <AvatarImage src={u.avatar_url} alt={u.full_name ?? ""} />}
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {u.full_name?.[0] ?? u.email?.[0] ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.full_name ?? u.email ?? `User #${u.id}`}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] shrink-0 ${
                        u.role === "admin"
                          ? "bg-red-500/10 text-red-600 border-red-500/20"
                          : u.role === "merchant"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                      }`}
                    >
                      {u.role}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="gap-0 py-0">
        <CardHeader className="px-5 pt-5 pb-4 border-b border-border">
          <CardTitle className="text-sm font-semibold">Truy cập nhanh</CardTitle>
        </CardHeader>
        <CardContent className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: "/admin/users", icon: Users, label: "Quản lý Người dùng", color: "bg-blue-500/10 text-blue-500" },
            { href: "/admin/merchants", icon: Store, label: "Quản lý Quán ăn", color: "bg-green-500/10 text-green-600" },
            { href: "/admin/videos", icon: Video, label: "Kiểm duyệt Video", color: "bg-amber-500/10 text-amber-500" },
            { href: "/admin/campaigns", icon: Megaphone, label: "Quản lý Quảng cáo", color: "bg-primary/10 text-primary" },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <Button variant="outline" className="w-full justify-start gap-3 h-10 text-sm">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${item.color}`}>
                  <item.icon className="w-3.5 h-3.5" />
                </div>
                <span className="truncate">{item.label}</span>
                <ChevronRight className="w-3.5 h-3.5 ml-auto text-muted-foreground shrink-0" />
              </Button>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
