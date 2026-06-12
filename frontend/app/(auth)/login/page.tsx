"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, ChefHat, Store, AlertCircle, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useLoginForm } from "@/hooks/use-login-form";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [loginRole, setLoginRole] = useState<"reviewer" | "merchant">("reviewer");
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
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-black flex items-center justify-center p-4 overflow-hidden relative select-none antialiased">
      
      {/* Background glowing orb - transitions color based on selected mode */}
      <div 
        className={cn(
          "absolute top-1/4 left-1/2 -translate-x-1/2 w-[350px] md:w-[450px] h-[350px] md:h-[450px] rounded-full blur-[80px] md:blur-[100px] pointer-events-none z-0 transition-all duration-700 ease-in-out",
          loginRole === "reviewer"
            ? "bg-gradient-to-tr from-orange-500/10 via-amber-500/15 to-red-500/10"
            : "bg-gradient-to-tr from-blue-500/10 via-cyan-500/15 to-teal-500/10"
        )} 
      />

      {/* Auth Card - Double-Bezel Architecture */}
      <div className="relative w-full max-w-md bg-white/40 dark:bg-neutral-900/10 border border-neutral-200/50 dark:border-white/5 rounded-[2.5rem] p-5 backdrop-blur-xl shadow-2xl z-10 animate-in fade-in slide-in-from-bottom-6 duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
        
        {/* Inner Core */}
        <div className="bg-white dark:bg-neutral-950/45 border border-neutral-100/70 dark:border-white/5 rounded-[calc(2.5rem-0.75rem)] p-6 space-y-6 shadow-[inset_0_1px_2px_rgba(255,255,255,0.08)]">
          
          {/* Tab Switcher - sliding pill layout */}
          <div className="grid grid-cols-2 p-1 bg-neutral-100 dark:bg-neutral-900/50 border border-neutral-200/30 dark:border-neutral-800/35 rounded-2xl relative select-none">
            {/* Sliding background indicator */}
            <div
              className={cn(
                "absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-0 shadow-sm border border-neutral-200/25 dark:border-white/5",
                loginRole === "reviewer"
                  ? "translate-x-0 bg-white dark:bg-neutral-900"
                  : "translate-x-full bg-white dark:bg-neutral-900"
              )}
            />
            
            <button
              type="button"
              onClick={() => setLoginRole("reviewer")}
              className={cn(
                "py-2 px-3 text-[11px] font-black uppercase tracking-wider rounded-xl transition-colors duration-300 relative z-10 cursor-pointer select-none outline-none border-none",
                loginRole === "reviewer"
                  ? "text-orange-500"
                  : "text-muted-foreground/75 hover:text-foreground"
              )}
            >
              Khách hàng
            </button>
            <button
              type="button"
              onClick={() => setLoginRole("merchant")}
              className={cn(
                "py-2 px-3 text-[11px] font-black uppercase tracking-wider rounded-xl transition-colors duration-300 relative z-10 cursor-pointer select-none outline-none border-none",
                loginRole === "merchant"
                  ? "text-blue-500"
                  : "text-muted-foreground/75 hover:text-foreground"
              )}
            >
              Đối tác quán
            </button>
          </div>

          {/* Header Branding */}
          <div className="text-center space-y-3.5">
            <div 
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-sm animate-bounce duration-[2000ms] border transition-all duration-500",
                loginRole === "reviewer"
                  ? "bg-orange-500/10 border-orange-500/20"
                  : "bg-blue-500/10 border-blue-500/20"
              )}
            >
              {loginRole === "reviewer" ? (
                <ChefHat className="w-8 h-8 text-orange-500" />
              ) : (
                <Store className="w-8 h-8 text-blue-500" />
              )}
            </div>
            
            <div className="space-y-1">
              <span 
                className={cn(
                  "text-[9px] uppercase tracking-[0.25em] font-black block transition-colors duration-500",
                  loginRole === "reviewer" ? "text-orange-500" : "text-blue-500"
                )}
              >
                {loginRole === "reviewer" ? "Foodiegram Community" : "Foodiegram Business"}
              </span>
              <h2 className="text-2xl font-black tracking-tight text-foreground bg-gradient-to-b from-neutral-800 to-neutral-600 dark:from-white dark:to-neutral-400 bg-clip-text text-transparent">
                {loginRole === "reviewer" ? "Chào mừng trở lại!" : "Chào mừng Đối tác!"}
              </h2>
              <p className="text-xs text-muted-foreground/80 font-semibold px-2 transition-all duration-500">
                {loginRole === "reviewer" 
                  ? "Đăng nhập để tiếp tục khám phá tinh hoa ẩm thực"
                  : "Quản lý cửa hàng và theo dõi đánh giá khách hàng hiệu quả cùng FoodieGram Business"
                }
              </p>
            </div>
          </div>

          {/* Destructive Failure Alert */}
          {error && (
            <Alert variant="destructive" className="border-red-500/30 bg-red-500/5 text-red-500 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <AlertTitle className="font-extrabold text-[11px] uppercase tracking-wider leading-none">Đăng nhập thất bại</AlertTitle>
              <AlertDescription className="text-xs leading-relaxed font-semibold mt-1">
                {error}
                {error.includes("Mật khẩu không chính xác") && (
                  <span className="block mt-1.5 pt-1.5 border-t border-red-500/15">
                    Quên mật khẩu?{" "}
                    <Link href="/forgot-password" className="underline font-bold hover:text-red-600 transition-colors">
                      Nhấp vào đây để lấy lại.
                    </Link>
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={(e) => handleSubmit(e, loginRole)} className="space-y-4">
            
            {/* Email field */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground/75 px-1">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/60" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  className={cn(
                    "pl-10.5 h-11.5 rounded-2xl bg-secondary/35 hover:bg-secondary/50 dark:bg-white/5 border border-border/40 focus:ring-4 focus:outline-none transition-all duration-300 font-semibold text-xs",
                    loginRole === "reviewer"
                      ? "focus:border-orange-500/50 focus:ring-orange-500/10"
                      : "focus:border-blue-500/50 focus:ring-blue-500/10",
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
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground/75 px-1">Mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/60" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu"
                  className={cn(
                    "pl-10.5 pr-10.5 h-11.5 rounded-2xl bg-secondary/35 hover:bg-secondary/50 dark:bg-white/5 border border-border/40 focus:ring-4 focus:outline-none transition-all duration-300 font-semibold text-xs",
                    loginRole === "reviewer"
                      ? "focus:border-orange-500/50 focus:ring-orange-500/10"
                      : "focus:border-blue-500/50 focus:ring-blue-500/10",
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
            </div>

            {/* Remember & Forgot options */}
            <div className="flex items-center justify-between px-1.5 pt-1 text-xs">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={formData.remember}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, remember: checked as boolean })
                  }
                  className={cn(
                    "w-4.5 h-4.5 rounded-md border-border/80 transition-all duration-300",
                    loginRole === "reviewer"
                      ? "text-orange-500 focus:ring-orange-500/10 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                      : "text-blue-500 focus:ring-blue-500/10 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                  )}
                />
                <Label htmlFor="remember" className="font-semibold text-muted-foreground/80 cursor-pointer select-none text-[11px]">
                  Ghi nhớ tôi
                </Label>
              </div>
              <Link
                href="/forgot-password"
                className={cn(
                  "font-extrabold hover:underline text-[11px] transition-colors duration-500",
                  loginRole === "reviewer" ? "text-orange-500" : "text-blue-500"
                )}
              >
                Quên mật khẩu?
              </Link>
            </div>

            {/* Primary Submit Button-in-Button */}
            <Button
              type="submit"
              className={cn(
                "w-full text-white shadow-md hover:shadow-lg flex items-center justify-between rounded-full pl-6 pr-2.5 py-5 font-extrabold text-[11px] select-none transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 group cursor-pointer border-0",
                loginRole === "reviewer"
                  ? "bg-orange-500 hover:bg-orange-600 hover:shadow-orange-500/10"
                  : "bg-blue-500 hover:bg-blue-600 hover:shadow-blue-500/10"
              )}
              disabled={isLoading}
            >
              <span>{isLoading ? "Đang đăng nhập..." : "Đăng nhập"}</span>
              <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center transition-all duration-300 group-hover:translate-x-0.5">
                <ChevronRight className="w-4 h-4 text-white" />
              </div>
            </Button>
          </form>

          {/* Beautiful Glass Divider */}
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
            onClick={() => handleGoogleLogin(loginRole)}
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
              <span>Tiếp tục với Google</span>
            </div>
            
            <div className="w-7 h-7 bg-secondary dark:bg-white/10 rounded-full flex items-center justify-center transition-all duration-300 group-hover:translate-x-0.5">
              <ArrowRight className="w-3.5 h-3.5 text-foreground/80" />
            </div>
          </button>

          {/* Navigation link to register */}
          <p className="text-center mt-6 text-xs text-muted-foreground/80 font-semibold select-none">
            Chưa có tài khoản?{" "}
            <Link 
              href={loginRole === "reviewer" ? "/register" : "/register?role=merchant"} 
              className={cn(
                "font-extrabold hover:underline transition-colors duration-500",
                loginRole === "reviewer" ? "text-orange-500" : "text-blue-500"
              )}
            >
              Đăng ký ngay
            </Link>
          </p>

        </div>
      </div>
      
    </div>
  );
}
