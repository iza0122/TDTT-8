"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function useForgotPasswordForm() {
  const { toast } = useToast();
  const [email, setEmailRaw] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const setEmail = (val: string) => {
    setEmailRaw(val);
    setEmailError(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailError(null);

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setEmailError("Vui lòng nhập địa chỉ email.");
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setEmailError("Địa chỉ email không đúng định dạng (ví dụ: ten@example.com).");
      setError("Vui lòng nhập email hợp lệ.");
      return;
    }

    setIsLoading(true);
    try {
      const { auth, sendPasswordResetEmail } = await import("@/lib/firebase");
      
      // Send reset password email via Firebase Client SDK
      await sendPasswordResetEmail(auth, cleanEmail.toLowerCase());
      
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
        setEmailError("Email không tồn tại trong hệ thống.");
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Địa chỉ email không đúng định dạng.";
        setEmailError("Email không đúng định dạng.");
      } else if (err.code === "auth/too-many-requests") {
        errorMessage = "Yêu cầu bị chặn do gửi quá nhiều lần liên tiếp. Vui lòng thử lại sau.";
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    isLoading,
    isSubmitted,
    error,
    emailError,
    handleSubmit,
  };
}

