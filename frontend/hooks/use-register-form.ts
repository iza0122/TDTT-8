"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export function useRegisterForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  
  const [formData, setFormDataRaw] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const setFormData = (value: any) => {
    setError(null);
    if (typeof value === "function") {
      setFormDataRaw((prev) => {
        const next = value(prev);
        const updatedErrors = { ...fieldErrors };
        if (next.name !== prev.name) delete updatedErrors.name;
        if (next.email !== prev.email) delete updatedErrors.email;
        if (next.password !== prev.password) delete updatedErrors.password;
        if (next.confirmPassword !== prev.confirmPassword) delete updatedErrors.confirmPassword;
        setFieldErrors(updatedErrors);
        return next;
      });
    } else {
      setFormDataRaw(value);
      setFieldErrors({});
    }
  };

  const passwordRequirements = [
    { label: "Ít nhất 8 ký tự", met: formData.password.length >= 8 },
    { label: "Chứa chữ hoa", met: /[A-Z]/.test(formData.password) },
    { label: "Chứa chữ số", met: /[0-9]/.test(formData.password) },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    let hasError = false;
    const errors: typeof fieldErrors = {};

    const cleanName = formData.name.trim();
    const cleanEmail = formData.email.trim();

    if (!cleanName) {
      errors.name = "Họ và tên không được để trống.";
      hasError = true;
    }

    if (!cleanEmail) {
      errors.email = "Vui lòng nhập địa chỉ email.";
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = "Địa chỉ email không đúng định dạng (ví dụ: ten@example.com).";
      hasError = true;
    }

    // Password validation
    if (!formData.password) {
      errors.password = "Vui lòng tạo mật khẩu.";
      hasError = true;
    } else {
      const isLengthMet = formData.password.length >= 8;
      const isUpperMet = /[A-Z]/.test(formData.password);
      const isNumberMet = /[0-9]/.test(formData.password);
      
      if (!isLengthMet || !isUpperMet || !isNumberMet) {
        errors.password = "Mật khẩu chưa đáp ứng đầy đủ yêu cầu bảo mật.";
        hasError = true;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Mật khẩu xác nhận không khớp.";
      hasError = true;
    }

    if (!formData.agreeTerms) {
      setError("Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách bảo mật để tiếp tục.");
      return;
    }

    if (hasError) {
      setFieldErrors(errors);
      setError("Vui lòng hoàn thiện chính xác các thông tin đăng ký.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          password: formData.password,
          full_name: cleanName
        })
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        throw new Error("Không nhận được phản hồi đăng ký hợp lệ từ máy chủ.");
      }

      if (!response.ok) {
        if (response.status === 400 && (data.detail?.includes("đã được đăng ký") || data.detail?.includes("exists"))) {
          setFieldErrors({ email: "Email này đã được sử dụng." });
          throw new Error("Tài khoản đã tồn tại.");
        } else {
          throw new Error(data.detail || "Đăng ký tài khoản thất bại.");
        }
      }

      toast({
        title: "Đăng ký thành công! 🎉",
        description: "Tài khoản đã được khởi tạo. Đang tự động đăng nhập...",
      });

      // Tự động đăng nhập sau khi đăng ký thành công
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          password: formData.password
        })
      });

      let loginData;
      try {
        loginData = await loginResponse.json();
      } catch (e) {
        router.push("/login");
        return;
      }

      if (loginResponse.ok) {
        login(loginData.access_token, loginData.user, loginData.refresh_token);
        router.push("/");
      } else {
        router.push("/login");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
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

      login(data.access_token, data.user, data.refresh_token);

      toast({
        title: "Đăng nhập Google thành công! 🚀",
        description: `Chào mừng ${data.user.full_name || 'bạn'} đã tham gia cộng đồng!`,
      });

      router.push("/");
    } catch (err: any) {
      console.error(err);
      const isPopupClosed = err.code === "auth/popup-closed-by-user" || err.message?.includes("closed");
      const errorMsg = isPopupClosed
        ? "Đăng ký bằng Google đã bị hủy."
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
    showConfirmPassword,
    setShowConfirmPassword,
    isLoading,
    passwordRequirements,
    error,
    fieldErrors,
    handleSubmit,
    handleGoogleLogin,
  };
}
