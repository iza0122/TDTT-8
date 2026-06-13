"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/merchant/page-header";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2, TriangleAlert } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

function PasswordInput({ id, placeholder }: { id: string; placeholder?: string }) {
  const [show, setShow] = useState(false);
  const [value, setValue] = useState("");

  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        placeholder={placeholder ?? "••••••••"}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pr-10"
        autoComplete="new-password"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        tabIndex={-1}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

function SaveButton({ label = "Lưu thay đổi" }: { label?: string }) {
  const [saving, setSaving] = useState(false);
  return (
    <Button
      onClick={() => { setSaving(true); setTimeout(() => setSaving(false), 1500); }}
      disabled={saving}
      className="gap-2"
    >
      {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {saving ? "Đang lưu..." : label}
    </Button>
  );
}

interface NotificationRowProps {
  id: string;
  label: string;
  description: string;
  defaultChecked?: boolean;
}

function NotificationRow({ id, label, description, defaultChecked = false }: NotificationRowProps) {
  const [checked, setChecked] = useState(defaultChecked);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem(`pref_notif_${id}`);
    if (saved !== null) {
      setChecked(saved === "true");
    }
  }, [id]);

  const handleChange = (val: boolean) => {
    setChecked(val);
    localStorage.setItem(`pref_notif_${id}`, String(val));
  };

  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-border last:border-0">
      <div className="flex-1">
        <Label htmlFor={id} className="text-sm font-medium cursor-pointer">{label}</Label>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      {isMounted ? (
        <Switch id={id} checked={checked} onCheckedChange={handleChange} />
      ) : (
        <Switch id={id} checked={defaultChecked} disabled />
      )}
    </div>
  );
}

export default function MerchantSettingsPage() {
  const { token, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!token) {
      toast({
        title: "Lỗi",
        description: "Bạn chưa đăng nhập.",
        variant: "destructive"
      });
      return;
    }
    setIsDeleting(true);
    try {
      const response = await fetch("/api/auth/users/me", {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        toast({
          title: "Thành công 🎉",
          description: "Tài khoản của bạn đã được xóa vĩnh viễn.",
        });
        logout();
        router.push("/");
      } else {
        const errData = await response.json();
        throw new Error(errData.detail || "Không thể xóa tài khoản.");
      }
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.message || "Lỗi khi xóa tài khoản.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Quản lý tài khoản và tùy chọn thông báo"
      />

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle>Đổi mật khẩu</CardTitle>
          <CardDescription>Cập nhật mật khẩu đăng nhập của tài khoản merchant.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
            <PasswordInput id="currentPassword" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="newPassword">Mật khẩu mới</Label>
              <PasswordInput id="newPassword" placeholder="Tối thiểu 8 ký tự" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
              <PasswordInput id="confirmPassword" placeholder="Nhập lại mật khẩu mới" />
            </div>
          </div>
          <SaveButton label="Cập nhật mật khẩu" />
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Tùy chọn thông báo</CardTitle>
          <CardDescription>Chọn cách bạn muốn nhận thông báo từ hệ thống.</CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-2">
          <NotificationRow
            id="emailNotifications"
            label="Thông báo qua email"
            description="Nhận email khi có đánh giá mới hoặc khuyến mãi sắp hết hạn"
            defaultChecked
          />
          <NotificationRow
            id="pushNotifications"
            label="Thông báo đẩy (Push)"
            description="Nhận thông báo trực tiếp trên trình duyệt khi có hoạt động mới"
          />
          <NotificationRow
            id="reviewAlerts"
            label="Cảnh báo đánh giá thấp"
            description="Thông báo ngay khi nhận đánh giá 1–2 sao để xử lý kịp thời"
            defaultChecked
          />
          <NotificationRow
            id="promoReminders"
            label="Nhắc nhở khuyến mãi"
            description="Nhắc trước 3 ngày khi chương trình khuyến mãi sắp hết hạn"
            defaultChecked
          />
          <div className="pt-4">
            <SaveButton label="Lưu tùy chọn" />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TriangleAlert className="w-4 h-4 text-destructive" />
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Các thao tác bên dưới không thể hoàn tác. Hãy chắc chắn trước khi thực hiện.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
            <div>
              <p className="text-sm font-medium text-foreground">Xóa tài khoản merchant</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Xóa vĩnh viễn tài khoản, toàn bộ dữ liệu nhà hàng, thực đơn và đánh giá.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="shrink-0">
                  Xóa tài khoản
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận xóa tài khoản</AlertDialogTitle>
                  <AlertDialogDescription>
                    Hành động này không thể hoàn tác. Toàn bộ dữ liệu nhà hàng, thực đơn, khuyến mãi và đánh giá sẽ bị xóa vĩnh viễn.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-white hover:bg-destructive/90"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Đang xóa..." : "Xóa vĩnh viễn"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
