"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getAdminMerchants, patchMerchantActive, AdminMerchant } from "@/lib/services/admin";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Search, ToggleLeft, ToggleRight, ChevronLeft, ChevronRight, Star, AlertCircle } from "lucide-react";

const LIMIT = 20;

export default function AdminMerchantsPage() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [merchants, setMerchants] = useState<AdminMerchant[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");

  const [toggleTarget, setToggleTarget] = useState<AdminMerchant | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  const fetchMerchants = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminMerchants(token, {
        limit: LIMIT,
        offset: page * LIMIT,
        search,
        category: categoryFilter,
        is_active: activeFilter,
      });
      setMerchants(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, page, search, categoryFilter, activeFilter]);

  useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(0);
    setSearch(searchInput);
  }

  async function handleToggleConfirm() {
    if (!token || !toggleTarget) return;
    setToggleLoading(true);
    try {
      const updated = await patchMerchantActive(token, toggleTarget.id, !toggleTarget.is_active);
      setMerchants((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      toast({
        title: toggleTarget.is_active ? "Đã tắt quán ăn" : "Đã bật quán ăn",
        description: toggleTarget.name,
      });
      setToggleTarget(null);
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    } finally {
      setToggleLoading(false);
    }
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý Quán ăn" description={`${total} quán ăn trên hệ thống`} />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên quán, địa chỉ..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" size="sm">Tìm</Button>
            </form>
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(0); }}>
                <SelectTrigger className="w-36 h-9 text-sm">
                  <SelectValue placeholder="Danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  <SelectItem value="Phở">Phở</SelectItem>
                  <SelectItem value="Bún">Bún</SelectItem>
                  <SelectItem value="Cơm">Cơm</SelectItem>
                  <SelectItem value="Cafe">Cafe</SelectItem>
                  <SelectItem value="Trà sữa">Trà sữa</SelectItem>
                  <SelectItem value="Bánh">Bánh</SelectItem>
                </SelectContent>
              </Select>
              <Select value={activeFilter} onValueChange={(v) => { setActiveFilter(v); setPage(0); }}>
                <SelectTrigger className="w-36 h-9 text-sm">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="true">Đang hoạt động</SelectItem>
                  <SelectItem value="false">Đã tắt</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              <TableHead>Tên quán</TableHead>
              <TableHead>Địa chỉ</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Đánh giá TB</TableHead>
              <TableHead>Chủ sở hữu</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
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
            ) : merchants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground text-sm">
                  Không tìm thấy quán ăn nào.
                </TableCell>
              </TableRow>
            ) : (
              merchants.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-xs text-muted-foreground font-mono">{m.id}</TableCell>
                  <TableCell className="font-medium text-sm">{m.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">{m.address}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[11px]">{m.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{m.rating_avg?.toFixed(1) ?? "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {m.owner?.full_name ?? `#${m.owner_id}`}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[11px] ${
                        m.is_active
                          ? "bg-green-500/10 text-green-600 border-green-500/20"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {m.is_active ? "Hoạt động" : "Đã tắt"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {m.created_at ? new Date(m.created_at).toLocaleDateString("vi-VN") : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`w-8 h-8 ${
                          m.is_active
                            ? "text-destructive hover:bg-destructive/10"
                            : "text-green-600 hover:bg-green-500/10"
                        }`}
                        title={m.is_active ? "Tắt quán" : "Bật quán"}
                        onClick={() => setToggleTarget(m)}
                      >
                        {m.is_active ? (
                          <ToggleRight className="w-4 h-4" />
                        ) : (
                          <ToggleLeft className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Trang {page + 1} / {totalPages} — {total} quán ăn
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

      <Dialog open={!!toggleTarget} onOpenChange={(open) => !open && setToggleTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {toggleTarget?.is_active ? "Tắt quán ăn?" : "Bật quán ăn?"}
            </DialogTitle>
            <DialogDescription>
              {toggleTarget?.is_active
                ? `Quán "${toggleTarget?.name}" sẽ bị ẩn khỏi ứng dụng.`
                : `Quán "${toggleTarget?.name}" sẽ hiển thị trở lại trên ứng dụng.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToggleTarget(null)}>Hủy</Button>
            <Button
              variant={toggleTarget?.is_active ? "destructive" : "default"}
              onClick={handleToggleConfirm}
              disabled={toggleLoading}
            >
              {toggleLoading ? "Đang xử lý..." : toggleTarget?.is_active ? "Tắt" : "Bật"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
