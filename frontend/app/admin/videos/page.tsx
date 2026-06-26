"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getAdminVideos, patchVideoStatus, AdminVideo } from "@/lib/services/admin";
import { PageHeader } from "@/components/merchant/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CheckCircle,
  XCircle,
  Eye,
  Video,
  ImageIcon,
  Store,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Play,
} from "lucide-react";

const LIMIT = 12;

type StatusTab = "pending" | "approved" | "rejected";

function StatusBadge({ status }: { status: string }) {
  if (status === "pending")
    return (
      <Badge variant="outline" className="text-[11px] bg-amber-500/10 text-amber-600 border-amber-500/20">
        Chờ duyệt
      </Badge>
    );
  if (status === "approved")
    return (
      <Badge variant="outline" className="text-[11px] bg-green-500/10 text-green-600 border-green-500/20">
        Đã duyệt
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-[11px] bg-destructive/10 text-destructive border-destructive/20">
      Từ chối
    </Badge>
  );
}

export default function AdminVideosPage() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<StatusTab>("pending");
  const [postTypeFilter, setPostTypeFilter] = useState<string>("all");
  const [videos, setVideos] = useState<AdminVideo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pendingCount, setPendingCount] = useState(0);

  const [previewVideo, setPreviewVideo] = useState<AdminVideo | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectDialogVideo, setRejectDialogVideo] = useState<AdminVideo | null>(null);

  const fetchVideos = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminVideos(token, {
        limit: LIMIT,
        offset: page * LIMIT,
        status: activeTab,
        post_type: postTypeFilter,
      });
      setVideos(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, page, activeTab, postTypeFilter]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  useEffect(() => {
    if (!token) return;
    getAdminVideos(token, { limit: 1, status: "pending" })
      .then((d) => setPendingCount(d.total ?? 0))
      .catch(() => {});
  }, [token]);

  function handleTabChange(tab: string) {
    setActiveTab(tab as StatusTab);
    setPage(0);
  }

  function handlePostTypeFilterChange(val: string) {
    setPostTypeFilter(val);
    setPage(0);
  }

  async function handleApprove(video: AdminVideo) {
    if (!token) return;
    setActionLoading(true);
    try {
      const updated = await patchVideoStatus(token, video.id, "approved");
      setVideos((prev) => prev.filter((v) => v.id !== updated.id));
      setTotal((t) => t - 1);
      if (activeTab === "pending") setPendingCount((c) => Math.max(0, c - 1));
      toast({ title: "Đã duyệt bài đăng", description: video.title ?? `Video #${video.id}` });
      setPreviewVideo(null);
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRejectConfirm() {
    const video = rejectDialogVideo ?? previewVideo;
    if (!token || !video) return;
    setActionLoading(true);
    try {
      const updated = await patchVideoStatus(token, video.id, "rejected", rejectReason || undefined);
      setVideos((prev) => prev.filter((v) => v.id !== updated.id));
      setTotal((t) => t - 1);
      if (activeTab === "pending") setPendingCount((c) => Math.max(0, c - 1));
      toast({ title: "Đã từ chối bài đăng", description: video.title ?? `Video #${video.id}` });
      setRejectDialogVideo(null);
      setPreviewVideo(null);
      setRejectReason("");
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6">
      <PageHeader title="Kiểm duyệt Nội dung" description="Duyệt hoặc từ chối video/bài đăng trên nền tảng" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl border border-border bg-card shadow-xs">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-auto">
          <TabsList>
            <TabsTrigger value="pending" className="gap-1.5">
              Chờ duyệt
              {pendingCount > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">Đã duyệt</TabsTrigger>
            <TabsTrigger value="rejected">Đã từ chối</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-semibold shrink-0">Phân loại:</span>
          <Select value={postTypeFilter} onValueChange={handlePostTypeFilterChange}>
            <SelectTrigger className="w-40 h-9 bg-background">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="video">Bài video</SelectItem>
              <SelectItem value="image">Bài viết (Ảnh)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-video bg-muted animate-pulse" />
              <CardContent className="p-4 space-y-2">
                <div className="h-4 rounded bg-muted animate-pulse" />
                <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground text-sm">
            Không có nội dung nào trong mục này.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => (
            <Card key={video.id} className="overflow-hidden gap-0 py-0 group hover:shadow-md transition-all duration-300">
              <div className="relative aspect-video bg-muted flex items-center justify-center overflow-hidden">
                {video.thumbnail_url || (video.post_type === "image" && video.video_url) ? (
                  <img
                    src={video.thumbnail_url || video.video_url || ""}
                    alt={video.title ?? ""}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    {video.post_type === "video" ? (
                      <Video className="w-8 h-8" />
                    ) : (
                      <ImageIcon className="w-8 h-8" />
                    )}
                    <span className="text-xs">Không có thumbnail</span>
                  </div>
                )}
                {video.post_type === "video" && video.thumbnail_url && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/25 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-white/95 shadow-md flex items-center justify-center text-primary group-hover:scale-105 active:scale-95 transition-transform duration-300">
                      <Play className="w-4 h-4 fill-primary text-primary ml-0.5" />
                    </div>
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-black/60 text-white border-white/20 backdrop-blur-sm font-semibold px-2 py-0.5"
                  >
                    {video.post_type === "video" ? (
                      <Play className="w-2.5 h-2.5 mr-1" />
                    ) : (
                      <ImageIcon className="w-2.5 h-2.5 mr-1" />
                    )}
                    {video.post_type === "video" ? "Bài video" : "Bài viết (Ảnh)"}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-4 space-y-3">
                <div>
                  <p className="font-semibold text-sm line-clamp-1">{video.title ?? "Không có tiêu đề"}</p>
                  {video.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{video.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Avatar className="w-5 h-5 shrink-0">
                    {video.reviewer?.avatar_url && <AvatarImage src={video.reviewer.avatar_url} />}
                    <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                      {video.reviewer?.full_name?.[0] ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground truncate">
                    {video.reviewer?.full_name ?? `User #${video.reviewer_id}`}
                  </span>
                </div>

                {video.tagged_merchant && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Store className="w-3 h-3 shrink-0" />
                    <span className="truncate">{video.tagged_merchant.name}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {video.created_at ? new Date(video.created_at).toLocaleDateString("vi-VN") : "—"}
                  </span>
                  <StatusBadge status={video.status} />
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs gap-1"
                    onClick={() => setPreviewVideo(video)}
                  >
                    <Eye className="w-3 h-3" />
                    Xem
                  </Button>
                  {video.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        className="flex-1 h-8 text-xs gap-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleApprove(video)}
                        disabled={actionLoading}
                      >
                        <CheckCircle className="w-3 h-3" />
                        Duyệt
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1 h-8 text-xs gap-1"
                        onClick={() => { setRejectDialogVideo(video); setRejectReason(""); }}
                        disabled={actionLoading}
                      >
                        <XCircle className="w-3 h-3" />
                        Từ chối
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Trang {page + 1} / {totalPages} — {total} bài đăng
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!previewVideo} onOpenChange={(open) => !open && setPreviewVideo(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="line-clamp-1">{previewVideo?.title ?? "Xem trước nội dung"}</DialogTitle>
            <DialogDescription className="line-clamp-2">{previewVideo?.description ?? "Không có mô tả"}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {previewVideo?.post_type === "video" && previewVideo?.video_url ? (
              <video
                src={previewVideo.video_url}
                controls
                className="w-full rounded-lg aspect-video bg-muted"
              />
            ) : (previewVideo?.post_type === "image" && previewVideo?.video_url) || previewVideo?.thumbnail_url ? (
              <img
                src={previewVideo?.video_url || previewVideo?.thumbnail_url || ""}
                alt=""
                className="w-full rounded-lg aspect-video object-cover bg-muted"
              />
            ) : (
              <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">
                Không có media
              </div>
            )}

            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-24 shrink-0">Reviewer:</span>
                <span className="font-medium">{previewVideo?.reviewer?.full_name ?? `User #${previewVideo?.reviewer_id}`}</span>
              </div>
              {previewVideo?.tagged_merchant && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-24 shrink-0">Quán ăn:</span>
                  <span className="font-medium">{previewVideo.tagged_merchant.name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-24 shrink-0">Trạng thái:</span>
                {previewVideo && <StatusBadge status={previewVideo.status} />}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-24 shrink-0">Ngày đăng:</span>
                <span>{previewVideo?.created_at ? new Date(previewVideo.created_at).toLocaleDateString("vi-VN") : "—"}</span>
              </div>
            </div>
          </div>

          {previewVideo?.status === "pending" && (
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => { setRejectDialogVideo(previewVideo); setRejectReason(""); }}
                disabled={actionLoading}
                className="gap-1 text-destructive hover:bg-destructive/10 border-destructive/20"
              >
                <XCircle className="w-4 h-4" />
                Từ chối
              </Button>
              <Button
                className="gap-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => previewVideo && handleApprove(previewVideo)}
                disabled={actionLoading}
              >
                <CheckCircle className="w-4 h-4" />
                {actionLoading ? "Đang xử lý..." : "Phê duyệt"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectDialogVideo} onOpenChange={(open) => !open && setRejectDialogVideo(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Từ chối bài đăng</DialogTitle>
            <DialogDescription>
              Nhập lý do từ chối (không bắt buộc). Lý do sẽ được lưu vào meta_data của video.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Lý do từ chối</Label>
            <Textarea
              id="reject-reason"
              placeholder="Ví dụ: Nội dung không phù hợp, vi phạm chính sách..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogVideo(null)}>Hủy</Button>
            <Button variant="destructive" onClick={handleRejectConfirm} disabled={actionLoading}>
              {actionLoading ? "Đang xử lý..." : "Xác nhận từ chối"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
