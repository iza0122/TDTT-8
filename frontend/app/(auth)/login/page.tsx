"use client";

import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, ChefHat, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useLoginForm } from "@/hooks/use-login-form";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const {
    formData,
    setFormData,
    showPassword,
    setShowPassword,
    isLoading,
    error,
    fieldErrors,
    handleSubmit,
    handleGoogleLogin,
  } = useLoginForm();


  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header decorative */}
      <div className="relative h-48 bg-gradient-to-br from-primary to-primary/80 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-8 w-20 h-20 rounded-full bg-white/30" />
          <div className="absolute top-12 right-12 w-32 h-32 rounded-full bg-white/20" />
          <div className="absolute bottom-0 left-1/4 w-16 h-16 rounded-full bg-white/25" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-primary-foreground">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-3">
            <ChefHat className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold">FoodieGram</h1>
        </div>
      </div>

      {/* Form container */}
      <div className="flex-1 -mt-6 bg-background rounded-t-3xl px-6 pt-8 pb-6">
        <div className="max-w-sm mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground">Chào mừng trở lại!</h2>
            <p className="text-muted-foreground mt-2">
              Đăng nhập để khám phá ẩm thực
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6 border-destructive/30 bg-destructive/5 text-destructive rounded-xl animate-in fade-in-50 slide-in-from-top-2 duration-200">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <AlertTitle className="font-bold">Đăng nhập thất bại</AlertTitle>
              <AlertDescription className="text-sm">
                {error}
                {error.includes("Mật khẩu không chính xác") && (
                  <span className="block mt-1">
                    Bạn quên mật khẩu?{" "}
                    <Link href="/forgot-password" className="underline font-semibold hover:text-destructive/80 transition-colors">
                      Nhấp vào đây để lấy lại.
                    </Link>
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  className={cn(
                    "pl-10 h-12 rounded-xl transition-all duration-200",
                    fieldErrors.email && "border-destructive focus-visible:ring-destructive bg-destructive/5 text-destructive"
                  )}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
              {fieldErrors.email && (
                <p className="text-xs text-destructive mt-1 font-medium animate-in fade-in duration-200">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu"
                  className={cn(
                    "pl-10 pr-10 h-12 rounded-xl transition-all duration-200",
                    fieldErrors.password && "border-destructive focus-visible:ring-destructive bg-destructive/5 text-destructive"
                  )}
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
              {fieldErrors.password && (
                <p className="text-xs text-destructive mt-1 font-medium animate-in fade-in duration-200">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={formData.remember}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, remember: checked as boolean })
                  }
                />
                <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                  Ghi nhớ đăng nhập
                </Label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-sm text-muted-foreground">
                hoặc tiếp tục với
              </span>
            </div>
          </div>

          {/* Social login */}
          <Button 
            variant="outline" 
            className="w-full h-12 rounded-xl"
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
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

          {/* Sign up link */}
          <p className="text-center mt-8 text-muted-foreground">
            Chưa có tài khoản?{" "}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

