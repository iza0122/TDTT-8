"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  getAdminReports,
  patchReportAction,
  AdminReport,
} from "@/lib/services/admin";
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
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  XCircle,
  Eye,
  Video,
  ImageIcon,
  ShieldAlert,
  Trash2,
  Play,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Flag,
} from "lucide-react";

const LIMIT = 10;

type StatusTab = "pending" | "resolved" | "dismissed";

function ReportStatusBadge({ status }: { status: string }) {
  if (status === "pending")
    return (
      <Badge variant="outline" className="text-[11px] bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold px-2 py-0.5">
        Chờ xử lý
      </Badge>
    );
  if (status === "resolved")
    return (
      <Badge variant="outline" className="text-[11px] bg-green-500/10 text-green-600 border-green-500/20 font-bold px-2 py-0.5">
        Đã xóa bài
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-[11px] bg-neutral-500/10 text-neutral-500 border-neutral-500/20 font-bold px-2 py-0.5">
      Đã bỏ qua
    </Badge>
  );
}

export default function AdminReportsPage() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<StatusTab>("pending");
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pendingCount, setPendingCount] = useState(0);
  const [previewReport, setPreviewReport] = useState<AdminReport | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminReports(token, {
        limit: LIMIT,
        offset: page * LIMIT,
        status: activeTab,
      });
      setReports(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, page, activeTab]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    if (!token) return;
    getAdminReports(token, { limit: 1, status: "pending" })
      .then((d) => setPendingCount(d.total ?? 0))
      .catch(() => {});
  }, [token, reports]);

  function handleTabChange(tab: string) {
    setActiveTab(tab as StatusTab);
    setPage(0);
  }

  async function handleReportAction(report: AdminReport, statusVal: "resolved" | "dismissed", actionTaken?: "delete" | "keep") {
    if (!token) return;
    setActionLoading(true);

    const originalReports = [...reports];
    const originalTotal = total;
    const originalPendingCount = pendingCount;

    // Optimistic Update: instantly remove/update report in UI
    setReports((prev) => prev.filter((r) => r.id !== report.id));
    setTotal((t) => Math.max(0, t - 1));
    if (activeTab === "pending") setPendingCount((c) => Math.max(0, c - 1));
    setPreviewReport(null);

    try {
      await patchReportAction(token, report.id, { status: statusVal, action_taken: actionTaken });
      toast({
        title: statusVal === "resolved" ? "Đã xóa bài viết vi phạm" : "Đã bỏ qua báo cáo",
        description: `Báo cáo #${report.id.substring(0, 8)} đã được xử lý.`,
      });
    } catch (err: any) {
      // Rollback on failure
      setReports(originalReports);
      setTotal(originalTotal);
      setPendingCount(originalPendingCount);
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6">
      <PageHeader title="Kiểm duyệt Báo cáo vi phạm" description="Xử lý các báo cáo vi phạm nội dung từ người dùng" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl border border-border bg-card shadow-xs">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-auto">
          <TabsList>
            <TabsTrigger value="pending" className="gap-1.5">
              Chờ xử lý
              {pendingCount > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="resolved">Đã xóa bài</TabsTrigger>
            <TabsTrigger value="dismissed">Đã bỏ qua</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-5 space-y-3">
                <div className="h-4 w-1/4 rounded bg-muted animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
                <div className="h-10 rounded bg-muted animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground text-sm">
            Không có báo cáo vi phạm nào trong mục này.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id} className="overflow-hidden hover:shadow-md transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-3 flex-1 min-w-0">
                    {/* Reporter Info */}
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        {report.reporter?.avatar_url && <AvatarImage src={report.reporter.avatar_url} />}
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {report.reporter?.full_name?.[0] ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-semibold">
                        {report.reporter?.full_name ?? `User #${report.reporter_id}`}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        Báo cáo ngày {report.created_at ? new Date(report.created_at).toLocaleDateString("vi-VN") : "—"}
                      </span>
                    </div>

                    {/* Violation Reason */}
                    <div className="flex items-start gap-2 bg-red-500/5 border border-red-500/10 rounded-xl p-3">
                      <Flag className="w-4 h-4 text-red-500 shrink-0 mt-0.5 fill-red-500/10" />
                      <div>
                        <p className="text-xs font-bold text-red-600">Lý do báo cáo vi phạm:</p>
                        <p className="text-xs font-medium text-foreground mt-0.5">{report.reason}</p>
                      </div>
                    </div>

                    {/* Reported Content Summary */}
                    {report.reported_video ? (
                      <div className="flex items-center gap-3 p-2.5 rounded-xl border bg-muted/30">
                        <div className="relative w-16 aspect-video bg-muted rounded-lg overflow-hidden shrink-0">
                          {report.reported_video.thumbnail_url || (report.reported_video.post_type === "image" && report.reported_video.video_url) ? (
                            <img
                              src={report.reported_video.thumbnail_url || report.reported_video.video_url || ""}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              {report.reported_video.post_type === "video" ? <Video className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                            </div>
                          )}
                          {report.reported_video.post_type === "video" && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                              <Play className="w-3 h-3 text-white fill-white" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate">{report.reported_video.title ?? "Không có tiêu đề"}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            Bởi blogger @{report.reported_video.reviewer?.full_name ?? `User #${report.reported_video.reviewer_id}`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs gap-1"
                          onClick={() => setPreviewReport(report)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Xem bài viết
                        </Button>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground italic bg-muted/40 p-3 rounded-lg border border-dashed">
                        Bài viết bị báo cáo đã bị xóa khỏi hệ thống.
                      </div>
                    )}
                  </div>

                  {/* Actions (only for pending) */}
                  <div className="flex flex-row md:flex-col items-center justify-end gap-2 shrink-0 self-stretch md:self-start">
                    {report.status === "pending" && report.reported_video ? (
                      <>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1 md:w-36 h-8 text-xs gap-1"
                          onClick={() => handleReportAction(report, "resolved", "delete")}
                          disabled={actionLoading}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Xóa bài viết
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 md:w-36 h-8 text-xs gap-1 border-muted-foreground/20 hover:bg-secondary"
                          onClick={() => handleReportAction(report, "dismissed", "keep")}
                          disabled={actionLoading}
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-neutral-500" />
                          Bỏ qua báo cáo
                        </Button>
                      </>
                    ) : report.status === "pending" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 md:w-36 h-8 text-xs gap-1 border-muted-foreground/20"
                        onClick={() => handleReportAction(report, "dismissed", "keep")}
                        disabled={actionLoading}
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-neutral-500" />
                        Bỏ qua báo cáo
                      </Button>
                    ) : (
                      <ReportStatusBadge status={report.status} />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Trang {page + 1} / {totalPages} — {total} báo cáo vi phạm
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

      {/* Content Preview Dialog */}
      <Dialog open={!!previewReport} onOpenChange={(open) => !open && setPreviewReport(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="line-clamp-1">
              {previewReport?.reported_video?.title ?? "Xem trước nội dung báo cáo"}
            </DialogTitle>
            <DialogDescription className="line-clamp-2">
              {previewReport?.reported_video?.description ?? "Không có mô tả"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {previewReport?.reported_video?.post_type === "video" && previewReport?.reported_video?.video_url ? (
              <video
                src={previewReport.reported_video.video_url}
                controls
                className="w-full rounded-lg aspect-video bg-muted"
              />
            ) : (previewReport?.reported_video?.post_type === "image" && previewReport?.reported_video?.video_url) || previewReport?.reported_video?.thumbnail_url ? (
              <img
                src={previewReport?.reported_video?.video_url || previewReport?.reported_video?.thumbnail_url || ""}
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
                <span className="text-muted-foreground w-28 shrink-0">Blogger đăng tải:</span>
                <span className="font-semibold">
                  {previewReport?.reported_video?.reviewer?.full_name ?? `User #${previewReport?.reported_video?.reviewer_id}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-28 shrink-0">Người báo cáo:</span>
                <span className="font-semibold">
                  {previewReport?.reporter?.full_name ?? `User #${previewReport?.reporter_id}`}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-muted-foreground w-28 shrink-0">Lý do báo cáo:</span>
                <span className="font-medium text-red-600 bg-red-500/5 px-2 py-0.5 rounded-md border border-red-500/10 text-xs">
                  {previewReport?.reason}
                </span>
              </div>
            </div>
          </div>

          {previewReport?.status === "pending" && previewReport?.reported_video && (
            <DialogFooter className="gap-2 pt-2 border-t">
              <Button
                variant="destructive"
                className="gap-1 mr-auto text-xs h-9"
                onClick={() => previewReport && handleReportAction(previewReport, "resolved", "delete")}
                disabled={actionLoading}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Xóa bài viết
              </Button>
              <Button
                variant="outline"
                className="gap-1 text-xs h-9 border-muted-foreground/20"
                onClick={() => previewReport && handleReportAction(previewReport, "dismissed", "keep")}
                disabled={actionLoading}
              >
                <CheckCircle className="w-3.5 h-3.5 text-neutral-500" />
                Bỏ qua báo cáo
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
