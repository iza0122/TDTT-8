"use client";

import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, User, ChefHat, Check, AlertCircle, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useRegisterForm } from "@/hooks/use-register-form";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const {
    formData,
    setFormData,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    isLoading,
    passwordRequirements,
    error,
    fieldErrors,
    handleSubmit,
    handleGoogleLogin,
  } = useRegisterForm();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-black flex items-center justify-center p-4 overflow-hidden relative select-none antialiased">
      
      {/* Background glowing orb */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[350px] md:w-[450px] h-[350px] md:h-[450px] rounded-full bg-gradient-to-tr from-orange-500/10 via-amber-500/15 to-red-500/10 blur-[80px] md:blur-[100px] pointer-events-none z-0" />

      {/* Auth Card - Double-Bezel Architecture */}
      <div className="relative w-full max-w-md bg-white/40 dark:bg-neutral-900/10 border border-neutral-200/50 dark:border-white/5 rounded-[2.5rem] p-5 backdrop-blur-xl shadow-2xl z-10 animate-in fade-in slide-in-from-bottom-6 duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] my-6">
        
        {/* Inner Core */}
        <div className="bg-white dark:bg-neutral-950/45 border border-neutral-100/70 dark:border-white/5 rounded-[calc(2.5rem-0.75rem)] p-6 space-y-5 shadow-[inset_0_1px_2px_rgba(255,255,255,0.08)]">
          
          {/* Header Branding */}
          <div className="text-center space-y-3">
            <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-sm animate-bounce duration-[2000ms]">
              <ChefHat className="w-8 h-8 text-orange-500" />
            </div>
            
            <div className="space-y-1">
              <span className="text-[9px] uppercase tracking-[0.25em] font-black text-orange-500 block">Foodiegram Community</span>
              <h2 className="text-2xl font-black tracking-tight text-foreground bg-gradient-to-b from-neutral-800 to-neutral-600 dark:from-white dark:to-neutral-400 bg-clip-text text-transparent">Tạo tài khoản mới</h2>
              <p className="text-xs text-muted-foreground/80 font-semibold">Khám phá và chia sẻ tinh hoa ẩm thực cùng bạn bè</p>
            </div>
          </div>

          {/* Failure Alert */}
          {error && (
            <Alert variant="destructive" className="border-red-500/30 bg-red-500/5 text-red-500 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <AlertTitle className="font-extrabold text-[11px] uppercase tracking-wider leading-none">Đăng ký thất bại</AlertTitle>
              <AlertDescription className="text-xs leading-relaxed font-semibold mt-1">
                {error}
                {error.includes("Tài khoản đã tồn tại") && (
                  <span className="block mt-1.5 pt-1.5 border-t border-red-500/15">
                    Đã có tài khoản?{" "}
                    <Link href="/login" className="underline font-bold hover:text-red-600 transition-colors">
                      Đăng nhập ngay tại đây.
                    </Link>
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            
            {/* Họ và tên field */}
            <div className="space-y-1">
              <Label htmlFor="name" className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground/75 px-1">Họ và tên</Label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/60" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  className={cn(
                    "pl-10.5 h-11.5 rounded-2xl bg-secondary/35 hover:bg-secondary/50 dark:bg-white/5 border border-border/40 focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all duration-300 font-semibold text-xs",
                    fieldErrors.name && "border-red-500/50 focus:border-red-500/60 focus:ring-red-500/10 bg-red-500/5 text-red-500"
                  )}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              {fieldErrors.name && (
                <p className="text-[10px] text-red-500 px-1 font-bold animate-in fade-in duration-200">
                  {fieldErrors.name}
                </p>
              )}
            </div>

            {/* Email field */}
            <div className="space-y-1">
              <Label htmlFor="email" className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground/75 px-1">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/60" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  className={cn(
                    "pl-10.5 h-11.5 rounded-2xl bg-secondary/35 hover:bg-secondary/50 dark:bg-white/5 border border-border/40 focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all duration-300 font-semibold text-xs",
                    fieldErrors.email && "border-red-500/50 focus:border-red-500/60 focus:ring-red-500/10 bg-red-500/5 text-red-500"
                  )}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
              {fieldErrors.email && (
                <p className="text-[10px] text-red-500 px-1 font-bold animate-in fade-in duration-200">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password field */}
            <div className="space-y-1">
              <Label htmlFor="password" className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground/75 px-1">Mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/60" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Tạo mật khẩu mạnh"
                  className={cn(
                    "pl-10.5 pr-10.5 h-11.5 rounded-2xl bg-secondary/35 hover:bg-secondary/50 dark:bg-white/5 border border-border/40 focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all duration-300 font-semibold text-xs",
                    fieldErrors.password && "border-red-500/50 focus:border-red-500/60 focus:ring-red-500/10 bg-red-500/5 text-red-500"
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
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-[10px] text-red-500 px-1 font-bold animate-in fade-in duration-200">
                  {fieldErrors.password}
                </p>
              )}

              {/* Password dynamic requirements - High-end check capsules */}
              {formData.password && (
                <div className="flex flex-wrap gap-1.5 mt-2 px-0.5">
                  {passwordRequirements.map((req, index) => (
                    <span
                      key={index}
                      className={cn(
                        "text-[9px] px-2.5 py-0.5 rounded-full flex items-center gap-1 border transition-all duration-300 font-extrabold tracking-wide uppercase",
                        req.met
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-secondary/60 dark:bg-white/5 text-muted-foreground/50 border-transparent"
                      )}
                    >
                      {req.met && <Check className="w-2.5 h-2.5" />}
                      <span>{req.label}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm password field */}
            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground/75 px-1">Xác nhận mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/60" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu"
                  className={cn(
                    "pl-10.5 pr-10.5 h-11.5 rounded-2xl bg-secondary/35 hover:bg-secondary/50 dark:bg-white/5 border border-border/40 focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all duration-300 font-semibold text-xs",
                    fieldErrors.confirmPassword && "border-red-500/50 focus:border-red-500/60 focus:ring-red-500/10 bg-red-500/5 text-red-500"
                  )}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-[10px] text-red-500 px-1 font-bold animate-in fade-in duration-200">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* Terms and Privacy checkbox */}
            <div className="flex items-start gap-2.5 px-1.5 pt-1.5">
              <Checkbox
                id="terms"
                checked={formData.agreeTerms}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, agreeTerms: checked as boolean })
                }
                className="w-4.5 h-4.5 mt-0.5 rounded-md border-border/80 text-orange-500 focus:ring-orange-500/10"
              />
              <Label htmlFor="terms" className="text-[11px] font-semibold text-muted-foreground/80 cursor-pointer leading-relaxed select-none">
                Tôi đồng ý với{" "}
                <Link href="/terms" className="text-orange-500 font-bold hover:underline">
                  Điều khoản
                </Link>{" "}
                và{" "}
                <Link href="/privacy" className="text-orange-500 font-bold hover:underline">
                  Chính sách bảo mật
                </Link>
              </Label>
            </div>

            {/* Primary Submit Button-in-Button */}
            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg flex items-center justify-between rounded-full pl-6 pr-2.5 py-5 font-extrabold text-[11px] select-none transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 group cursor-pointer mt-2"
              disabled={isLoading}
            >
              <span>{isLoading ? "Đang đăng ký..." : "Tạo tài khoản"}</span>
              <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center transition-all duration-300 group-hover:translate-x-0.5">
                <ChevronRight className="w-4 h-4 text-white" />
              </div>
            </Button>
          </form>

          {/* Glass Divider */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/30 dark:border-white/5" />
            </div>
            <div className="relative flex justify-center z-10 px-4 bg-white dark:bg-neutral-950 text-[10px] font-black uppercase tracking-wider text-muted-foreground/60 select-none">
              hoặc
            </div>
          </div>

          {/* Social Continue with Google */}
          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full border border-border/85 bg-card hover:bg-secondary/40 text-foreground flex items-center justify-between rounded-full pl-6 pr-2.5 py-2 font-extrabold text-[11px] select-none transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
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
              <span>Đăng ký với Google</span>
            </div>
            
            <div className="w-7 h-7 bg-secondary dark:bg-white/10 rounded-full flex items-center justify-center transition-all duration-300 group-hover:translate-x-0.5">
              <ArrowRight className="w-3.5 h-3.5 text-foreground/80" />
            </div>
          </button>

          {/* Navigation link to login */}
          <p className="text-center mt-5 text-xs text-muted-foreground/80 font-semibold select-none">
            Đã có tài khoản?{" "}
            <Link href="/login" className="text-orange-500 font-extrabold hover:underline">
              Đăng nhập ngay
            </Link>
          </p>

        </div>
      </div>
      
    </div>
  );
}
