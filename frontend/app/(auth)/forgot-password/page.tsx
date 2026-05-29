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
          {isSubmitted ? (
            /* Success State */
            <div className="text-center py-8 space-y-6">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Kiểm tra hộp thư!</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Chúng tôi đã gửi một email hướng dẫn thiết lập lại mật khẩu tới địa chỉ <strong>{email}</strong>.
                </p>
                <p className="text-xs text-muted-foreground/60 leading-relaxed pt-2">
                  Vui lòng kiểm tra cả thư mục Spam/Hộp thư rác nếu không tìm thấy trong Hộp thư đến nhé!
                </p>
              </div>

              <div className="pt-4">
                <Link href="/login" className="w-full">
                  <Button className="w-full h-12 rounded-xl text-base font-semibold">
                    Quay lại Đăng nhập
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* Input State */
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground">Quên mật khẩu?</h2>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  Nhập email đăng ký của bạn. Chúng tôi sẽ gửi một liên kết để thiết lập lại mật khẩu mới.
                </p>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-6 border-destructive/30 bg-destructive/5 text-destructive rounded-xl animate-in fade-in-50 slide-in-from-top-2 duration-200">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <AlertTitle className="font-bold">Gửi yêu cầu thất bại</AlertTitle>
                  <AlertDescription className="text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
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
                        emailError && "border-destructive focus-visible:ring-destructive bg-destructive/5 text-destructive"
                      )}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  {emailError && (
                    <p className="text-xs text-destructive mt-1 font-medium animate-in fade-in duration-200">
                      {emailError}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl text-base font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? "Đang gửi yêu cầu..." : "Gửi yêu cầu reset"}
                </Button>
              </form>

              {/* Back to Login */}
              <div className="text-center mt-8">
                <Link href="/login" className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:underline">
                  <ArrowLeft className="w-4 h-4" />
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

