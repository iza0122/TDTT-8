"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, User, ChefHat, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const passwordRequirements = [
    { label: "Ít nhất 8 ký tự", met: formData.password.length >= 8 },
    { label: "Chứa chữ hoa", met: /[A-Z]/.test(formData.password) },
    { label: "Chứa chữ số", met: /[0-9]/.test(formData.password) },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Mật khẩu không khớp!");
      return;
    }
    setIsLoading(true);
    // Simulate registration
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header decorative */}
      <div className="relative h-40 bg-gradient-to-br from-primary to-primary/80 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-8 w-16 h-16 rounded-full bg-white/30" />
          <div className="absolute top-8 right-12 w-24 h-24 rounded-full bg-white/20" />
          <div className="absolute bottom-2 left-1/3 w-12 h-12 rounded-full bg-white/25" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-primary-foreground">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-2">
            <ChefHat className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold">FoodieGram</h1>
        </div>
      </div>

      {/* Form container */}
      <div className="flex-1 -mt-6 bg-background rounded-t-3xl px-6 pt-6 pb-6">
        <div className="max-w-sm mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">Tạo tài khoản</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Tham gia cộng đồng yêu ẩm thực
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Họ và tên</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  className="pl-10 h-12 rounded-xl"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  className="pl-10 h-12 rounded-xl"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Tạo mật khẩu"
                  className="pl-10 pr-10 h-12 rounded-xl"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {/* Password requirements */}
              {formData.password && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {passwordRequirements.map((req, index) => (
                    <span
                      key={index}
                      className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                        req.met
                          ? "bg-accent/20 text-accent"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {req.met && <Check className="w-3 h-3" />}
                      {req.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu"
                  className="pl-10 pr-10 h-12 rounded-xl"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-destructive mt-1">Mật khẩu không khớp</p>
              )}
            </div>

            <div className="flex items-start gap-2 pt-2">
              <Checkbox
                id="terms"
                checked={formData.agreeTerms}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, agreeTerms: checked as boolean })
                }
                className="mt-0.5"
              />
              <Label htmlFor="terms" className="text-sm font-normal cursor-pointer leading-tight">
                Tôi đồng ý với{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  Điều khoản dịch vụ
                </Link>{" "}
                và{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Chính sách bảo mật
                </Link>
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-semibold mt-2"
              disabled={isLoading || !formData.agreeTerms}
            >
              {isLoading ? "Đang tạo tài khoản..." : "Đăng ký"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-sm text-muted-foreground">
                hoặc đăng ký với
              </span>
            </div>
          </div>

          {/* Social registration */}
          <Button variant="outline" className="w-full h-12 rounded-xl">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Tiếp tục với Google
          </Button>

          {/* Login link */}
          <p className="text-center mt-6 text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
