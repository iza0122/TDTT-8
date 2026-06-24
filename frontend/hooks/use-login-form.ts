"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export function useLoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  
  const [formData, setFormDataRaw] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const setFormData = (value: any) => {
    setError(null);
    if (typeof value === "function") {
      setFormDataRaw((prev) => {
        const next = value(prev);
        const updatedErrors = { ...fieldErrors };
        if (next.email !== prev.email) delete updatedErrors.email;
        if (next.password !== prev.password) delete updatedErrors.password;
        setFieldErrors(updatedErrors);
        return next;
      });
    } else {
      setFormDataRaw(value);
      setFieldErrors({});
    }
  };

  const handleSubmit = async (e: React.FormEvent, loginRole: "reviewer" | "merchant" = "reviewer") => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Client-side validation
    let hasError = false;
    const errors: { email?: string; password?: string } = {};

    const cleanEmail = formData.email.trim();

    if (!cleanEmail) {
      errors.email = "Vui lòng nhập địa chỉ email.";
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = "Địa chỉ email không đúng định dạng (ví dụ: ten@example.com).";
      hasError = true;
    }

    if (!formData.password) {
      errors.password = "Vui lòng nhập mật khẩu.";
      hasError = true;
    }

    if (hasError) {
      setFieldErrors(errors);
      setError("Vui lòng sửa các thông tin chưa hợp lệ.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          password: formData.password
        })
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        throw new Error("Không nhận được phản hồi hợp lệ từ máy chủ.");
      }

      if (!response.ok) {
        if (response.status === 404) {
          setFieldErrors({ email: "Email này chưa được đăng ký trong hệ thống." });
          throw new Error("Tài khoản không tồn tại.");
        } else if (response.status === 401) {
          setFieldErrors({ password: "Mật khẩu không chính xác." });
          throw new Error("Mật khẩu không chính xác.");
        } else if (response.status === 403) {
          throw new Error("Tài khoản của bạn hiện đang bị khóa.");
        } else {
          throw new Error(data.detail || "Đăng nhập thất bại. Vui lòng kiểm tra lại.");
        }
      }

      if (loginRole === "merchant" && data.user?.role !== "merchant" && data.user?.role !== "admin") {
        throw new Error("Tài khoản của bạn không phải là tài khoản Đối tác (Merchant).");
      }

      login(data.access_token, data.user, data.refresh_token);

      toast({
        title: "Đăng nhập thành công! 🎉",
        description: `Chào mừng ${data.user.full_name || 'bạn'} quay trở lại!`,
      });

      if (data.user?.role === "admin") {
        router.push("/admin");
      } else if (loginRole === "merchant" && data.user?.role === "merchant") {
        router.push("/merchant");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (loginRole: "reviewer" | "merchant" = "reviewer") => {
    setIsLoading(true);
    setError(null);
    setFieldErrors({});
    try {
      const { auth: clientAuth, googleProvider, signInWithPopup } = await import("@/lib/firebase");
      const result = await signInWithPopup(clientAuth, googleProvider);
      const idToken = await result.user.getIdToken();

      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: idToken })
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error("Đồng bộ tài khoản với backend thất bại.");
      }

      if (!response.ok) {
        throw new Error(data.detail || "Đồng bộ tài khoản Google thất bại.");
      }

      if (loginRole === "merchant" && data.user?.role !== "merchant" && data.user?.role !== "admin") {
        throw new Error("Tài khoản của bạn không phải là tài khoản Đối tác (Merchant).");
      }

      login(data.access_token, data.user, data.refresh_token || result.user.refreshToken);

      toast({
        title: "Đăng nhập Google thành công! 🚀",
        description: `Chào mừng ${data.user.full_name || 'bạn'} đã tham gia cộng đồng!`,
      });

      if (data.user?.role === "admin") {
        router.push("/admin");
      } else if (loginRole === "merchant" && data.user?.role === "merchant") {
        router.push("/merchant");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      console.error(err);
      // Hủy bỏ popup Google hoặc đóng popup không được xem là lỗi nghiêm trọng cần cảnh báo to
      const isPopupClosed = err.code === "auth/popup-closed-by-user" || err.message?.includes("closed");
      const errorMsg = isPopupClosed
        ? "Đăng nhập Google đã bị hủy."
        : (err.message || "Đã xảy ra lỗi trong quá trình xác thực tài khoản Google.");
      
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    setFormData,
    showPassword,
    setShowPassword,
    isLoading,
    error,
    fieldErrors,
    handleSubmit,
    handleGoogleLogin,
  };
}

