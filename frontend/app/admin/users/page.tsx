"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  getAdminUsers,
  patchUserRole,
  patchUserDisable,
  AdminUser,
} from "@/lib/services/admin";
import { PageHeader } from "@/components/merchant/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Search, UserCog, Ban, CheckCircle, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";

const LIMIT = 20;

function roleBadgeClass(role: string) {
  if (role === "admin") return "bg-red-500/10 text-red-600 border-red-500/20";
  if (role === "merchant") return "bg-primary/10 text-primary border-primary/20";
  return "bg-blue-500/10 text-blue-600 border-blue-500/20";
}

export default function AdminUsersPage() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("newest");

  const [editRoleUser, setEditRoleUser] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState("");
  const [roleLoading, setRoleLoading] = useState(false);

  const [disableUser, setDisableUser] = useState<AdminUser | null>(null);
  const [disableLoading, setDisableLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminUsers(token, {
        limit: LIMIT,
        offset: page * LIMIT,
        search,
        role: roleFilter,
        status: statusFilter,
        sort,
      });
      setUsers(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, page, search, roleFilter, statusFilter, sort]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(0);
    setSearch(searchInput);
  }

  async function handleRoleSave() {
    if (!token || !editRoleUser || !newRole) return;
    setRoleLoading(true);
    try {
      const updated = await patchUserRole(token, editRoleUser.id, newRole);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast({ title: "Đã cập nhật role", description: `${updated.full_name ?? updated.email} → ${newRole}` });
      setEditRoleUser(null);
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    } finally {
      setRoleLoading(false);
    }
  }

  async function handleDisableConfirm() {
    if (!token || !disableUser) return;
    const isCurrentlyDisabled = !!disableUser.meta_data?.disabled;
    setDisableLoading(true);
    try {
      const updated = await patchUserDisable(token, disableUser.id, !isCurrentlyDisabled);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast({
        title: isCurrentlyDisabled ? "Đã kích hoạt tài khoản" : "Đã vô hiệu hóa tài khoản",
        description: updated.full_name ?? updated.email ?? `User #${updated.id}`,
      });
      setDisableUser(null);
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    } finally {
      setDisableLoading(false);
    }
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý Người dùng" description={`${total} tài khoản trên hệ thống`} />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên hoặc email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" size="sm">Tìm</Button>
            </form>
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(0); }}>
                <SelectTrigger className="w-36 h-9 text-sm">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả role</SelectItem>
                  <SelectItem value="reviewer">Reviewer</SelectItem>
                  <SelectItem value="merchant">Merchant</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
                <SelectTrigger className="w-36 h-9 text-sm">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={(v) => { setSort(v); setPage(0); }}>
                <SelectTrigger className="w-36 h-9 text-sm">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Mới nhất</SelectItem>
                  <SelectItem value="oldest">Cũ nhất</SelectItem>
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
              <TableHead>Người dùng</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Ngày tham gia</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-5 rounded bg-muted animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                  Không tìm thấy người dùng nào.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => {
                const isDisabled = !!u.meta_data?.disabled;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="text-xs text-muted-foreground font-mono">{u.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-7 h-7 shrink-0">
                          {u.avatar_url && <AvatarImage src={u.avatar_url} />}
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                            {u.full_name?.[0] ?? u.email?.[0] ?? "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{u.full_name ?? "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[11px] ${roleBadgeClass(u.role)}`}>
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString("vi-VN") : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[11px] ${
                          isDisabled
                            ? "bg-muted text-muted-foreground border-border"
                            : "bg-green-500/10 text-green-600 border-green-500/20"
                        }`}
                      >
                        {isDisabled ? "Disabled" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 text-muted-foreground hover:text-foreground"
                          title="Đổi role"
                          onClick={() => { setEditRoleUser(u); setNewRole(u.role); }}
                        >
                          <UserCog className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`w-8 h-8 ${
                            isDisabled
                              ? "text-green-600 hover:bg-green-500/10"
                              : "text-destructive hover:bg-destructive/10"
                          }`}
                          title={isDisabled ? "Kích hoạt" : "Vô hiệu hóa"}
                          onClick={() => setDisableUser(u)}
                        >
                          {isDisabled ? <CheckCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
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
              Trang {page + 1} / {totalPages} — {total} người dùng
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

      <Dialog open={!!editRoleUser} onOpenChange={(open) => !open && setEditRoleUser(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Đổi Role</DialogTitle>
            <DialogDescription>
              Thay đổi vai trò của{" "}
              <span className="font-semibold">{editRoleUser?.full_name ?? editRoleUser?.email}</span>
            </DialogDescription>
          </DialogHeader>
          <Select value={newRole} onValueChange={setNewRole}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reviewer">Reviewer</SelectItem>
              <SelectItem value="merchant">Merchant</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRoleUser(null)}>Hủy</Button>
            <Button onClick={handleRoleSave} disabled={roleLoading || newRole === editRoleUser?.role}>
              {roleLoading ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!disableUser} onOpenChange={(open) => !open && setDisableUser(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {disableUser?.meta_data?.disabled ? "Kích hoạt tài khoản?" : "Vô hiệu hóa tài khoản?"}
            </DialogTitle>
            <DialogDescription>
              {disableUser?.meta_data?.disabled
                ? `Tài khoản của ${disableUser?.full_name ?? disableUser?.email} sẽ được kích hoạt lại.`
                : `Tài khoản của ${disableUser?.full_name ?? disableUser?.email} sẽ bị vô hiệu hóa và không thể đăng nhập.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisableUser(null)}>Hủy</Button>
            <Button
              variant={disableUser?.meta_data?.disabled ? "default" : "destructive"}
              onClick={handleDisableConfirm}
              disabled={disableLoading}
            >
              {disableLoading
                ? "Đang xử lý..."
                : disableUser?.meta_data?.disabled
                ? "Kích hoạt"
                : "Vô hiệu hóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
