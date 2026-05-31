"use client";

import Link from "next/link";
import { Mail, ChefHat, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useForgotPasswordForm } from "@/hooks/use-forgot-password-form";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const { email, setEmail, isLoading, isSubmitted, error, emailError, handleSubmit } = useForgotPasswordForm();

  return (
    <div className="min-h-[100dvh] bg-neutral-50 dark:bg-[#050505] flex items-center justify-center p-4 md:p-8 relative overflow-hidden transition-all duration-300">
      {/* Ambient Glowing Orbs */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-orange-500/10 blur-[100px]" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-rose-500/15 blur-[120px]" />
      </div>

      {/* Double Bezel Glass Wrapper */}
      <div className="rounded-[2.5rem] bg-white/40 dark:bg-neutral-900/10 border border-neutral-200/50 dark:border-neutral-800/40 p-2.5 shadow-2xl backdrop-blur-xl max-w-md w-full transition-all duration-500 hover:shadow-orange-500/5">
        <div className="rounded-[calc(2.5rem-10px)] bg-card border border-neutral-100/70 dark:border-neutral-800/60 p-6 md:p-8 space-y-6 shadow-inner">
          
          {/* Header Identity */}
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center shadow-inner text-orange-500">
              <ChefHat className="w-6 h-6 stroke-[1.5] animate-pulse" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black tracking-wide bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent">FOODIEGRAM</h2>
              <div className="inline-block rounded-full bg-orange-500/5 border border-orange-500/10 text-orange-500 text-[8px] uppercase tracking-[0.25em] font-extrabold px-3 py-1">
                FOODIEGRAM SECURITY
              </div>
            </div>
          </div>

          {isSubmitted ? (
            /* Success State */
            <div className="text-center py-4 space-y-6 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-neutral-800 dark:text-neutral-100">Kiểm tra hộp thư!</h3>
                <p className="text-muted-foreground text-xs leading-relaxed max-w-[280px] mx-auto">
                  Chúng tôi đã gửi một email hướng dẫn thiết lập lại mật khẩu tới địa chỉ <strong className="text-neutral-800 dark:text-neutral-200">{email}</strong>.
                </p>
                <p className="text-[10px] text-muted-foreground/60 leading-relaxed pt-2">
                  Vui lòng kiểm tra cả thư mục Spam/Hộp thư rác nếu không tìm thấy trong Hộp thư đến nhé!
                </p>
              </div>

              <div className="pt-2">
                <Link href="/login" className="w-full">
                  <Button className="w-full rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-100 font-bold py-6 text-sm hover:scale-[1.01] active:scale-[0.98] transition-all duration-300">
                    Quay lại Đăng nhập
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* Input State */
            <>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-black text-neutral-800 dark:text-neutral-100">Quên mật khẩu?</h3>
                <p className="text-muted-foreground text-xs leading-relaxed max-w-[280px] mx-auto">
                  Nhập email đăng ký của bạn. Chúng tôi sẽ gửi một liên kết để thiết lập lại mật khẩu mới.
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 animate-shake">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-red-500">Gửi yêu cầu thất bại</p>
                    <p className="text-[11px] text-red-500/80 leading-relaxed">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2.5">
                  <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Địa chỉ Email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-orange-500 transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      className={cn(
                        "pl-11 rounded-2xl border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-orange-500 py-6 transition-all duration-300",
                        emailError && "border-red-500 focus-visible:ring-red-500/20 focus-visible:border-red-500 bg-red-500/5"
                      )}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  {emailError && (
                    <p className="text-xs text-red-500 mt-1 font-medium animate-in fade-in duration-200">
                      {emailError}
                    </p>
                  )}
                </div>

                {/* Submit Action Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-7 text-sm shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35 hover:scale-[1.01] active:scale-[0.98] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex items-center justify-center gap-2 group relative overflow-hidden"
                >
                  {isLoading ? (
                    <span>Đang gửi yêu cầu...</span>
                  ) : (
                    <>
                      <span>Gửi yêu cầu reset</span>
                      <span className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center transition-all duration-500 group-hover:translate-x-1 group-hover:scale-105 shadow-sm">
                        <ArrowLeft className="w-4 h-4 text-white rotate-180" />
                      </span>
                    </>
                  )}
                </Button>
              </form>

              {/* Back to Login */}
              <div className="text-center pt-2">
                <Link href="/login" className="inline-flex items-center gap-2 text-xs text-neutral-500 hover:text-orange-500 transition-colors font-bold group">
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                  <span>Quay lại đăng nhập</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

