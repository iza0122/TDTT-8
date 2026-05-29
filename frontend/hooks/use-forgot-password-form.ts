"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function useForgotPasswordForm() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        variant: "destructive",
        title: "Thiếu thông tin ❌",
        description: "Vui lòng nhập địa chỉ email của bạn.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { auth, sendPasswordResetEmail } = await import("@/lib/firebase");
      
      // Send reset password email via Firebase Client SDK
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      
      setIsSubmitted(true);
      toast({
        title: "Đã gửi yêu cầu thành công! 📬",
        description: "Một liên kết đặt lại mật khẩu đã được gửi đến email của bạn.",
      });
    } catch (err: any) {
      console.error(err);
      
      let errorMessage = "Đã xảy ra lỗi trong quá trình gửi yêu cầu reset mật khẩu.";
      if (err.code === "auth/user-not-found") {
        errorMessage = "Email này chưa được đăng ký trong hệ thống.";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Địa chỉ email không đúng định dạng.";
      }

      toast({
        variant: "destructive",
        title: "Gửi yêu cầu thất bại ❌",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    isLoading,
    isSubmitted,
    handleSubmit,
  };
}
