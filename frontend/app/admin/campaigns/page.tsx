"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getAdminCampaigns, patchCampaignActive, AdminCampaign } from "@/lib/services/admin";
import { StatCard } from "@/components/merchant/stat-card";
import { PageHeader } from "@/components/merchant/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  MousePointerClick,
  Eye,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

const LIMIT = 20;

export default function AdminCampaignsPage() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [campaigns, setCampaigns] = useState<AdminCampaign[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [merchantSearch, setMerchantSearch] = useState("");
  const [merchantSearchInput, setMerchantSearchInput] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchCampaigns = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminCampaigns(token, {
        limit: LIMIT,
        offset: page * LIMIT,
        is_active: activeFilter,
        merchant_search: merchantSearch,
      });
      setCampaigns(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, page, activeFilter, merchantSearch]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(0);
    setMerchantSearch(merchantSearchInput);
  }

  async function handleToggle(campaign: AdminCampaign) {
    if (!token) return;
    setTogglingId(campaign.id);
    try {
      const updated = await patchCampaignActive(token, campaign.id, !campaign.is_active);
      setCampaigns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      toast({
        title: campaign.is_active ? "Đã tạm dừng campaign" : "Đã bật campaign",
        description: campaign.title,
      });
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    } finally {
      setTogglingId(null);
    }
  }

  const activeCampaigns = campaigns.filter((c) => c.is_active);
  const totalImpressions = campaigns.reduce((s, c) => s + (c.impressions_count ?? 0), 0);
  const totalClicks = campaigns.reduce((s, c) => s + (c.clicks_count ?? 0), 0);
  const avgCtr =
    totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00";

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý Quảng cáo" description={`${total} chiến dịch trên hệ thống`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Đang chạy"
          value={activeCampaigns.length}
          icon={Megaphone}
          iconClassName="bg-green-500/10 text-green-600"
          description="Campaign active"
        />
        <StatCard
          label="Lượt hiển thị"
          value={totalImpressions.toLocaleString("vi-VN")}
          icon={Eye}
          iconClassName="bg-blue-500/10 text-blue-500"
          description="Tổng trang hiện tại"
        />
        <StatCard
          label="Lượt click"
          value={totalClicks.toLocaleString("vi-VN")}
          icon={MousePointerClick}
          iconClassName="bg-primary/10 text-primary"
          description="Tổng trang hiện tại"
        />
        <StatCard
          label="CTR trung bình"
          value={`${avgCtr}%`}
          icon={TrendingUp}
          iconClassName="bg-amber-500/10 text-amber-500"
          description="Trang hiện tại"
        />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên quán ăn..."
                  value={merchantSearchInput}
                  onChange={(e) => setMerchantSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" size="sm">Tìm</Button>
            </form>
            <Select value={activeFilter} onValueChange={(v) => { setActiveFilter(v); setPage(0); }}>
              <SelectTrigger className="w-40 h-9 text-sm">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="true">Đang chạy</SelectItem>
                <SelectItem value="false">Tạm dừng</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">ID</TableHead>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Quán ăn</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Lượt hiển thị</TableHead>
              <TableHead className="text-right">Lượt click</TableHead>
              <TableHead className="text-right">CTR</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="text-right">Bật/Tắt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-5 rounded bg-muted animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : campaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground text-sm">
                  Không tìm thấy chiến dịch nào.
                </TableCell>
              </TableRow>
            ) : (
              campaigns.map((c) => {
                const ctr =
                  c.impressions_count > 0
                    ? ((c.clicks_count / c.impressions_count) * 100).toFixed(2)
                    : "0.00";
                return (
                  <TableRow key={c.id}>
                    <TableCell className="text-xs text-muted-foreground font-mono">{c.id}</TableCell>
                    <TableCell className="font-medium text-sm max-w-[180px] truncate">{c.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.merchant?.name ?? `Merchant #${c.merchant_id}`}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[11px] ${
                          c.is_active
                            ? "bg-green-500/10 text-green-600 border-green-500/20"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {c.is_active ? "Đang chạy" : "Tạm dừng"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {c.impressions_count.toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {c.clicks_count.toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums font-medium">
                      {ctr}%
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString("vi-VN") : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`w-8 h-8 ${
                            c.is_active
                              ? "text-destructive hover:bg-destructive/10"
                              : "text-green-600 hover:bg-green-500/10"
                          }`}
                          title={c.is_active ? "Tạm dừng" : "Bật lại"}
                          disabled={togglingId === c.id}
                          onClick={() => handleToggle(c)}
                        >
                          {c.is_active ? (
                            <ToggleRight className="w-4 h-4" />
                          ) : (
                            <ToggleLeft className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Trang {page + 1} / {totalPages} — {total} chiến dịch
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
      </Card>
    </div>
  );
}
