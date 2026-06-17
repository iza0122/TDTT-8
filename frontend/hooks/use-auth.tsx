"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ChefHat } from "lucide-react";

interface User {
  id: number;
  firebase_uid: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  meta_data?: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User, refreshToken?: string) => void;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Capture browser's native window.fetch once globally to prevent recursive stack overflows/memory leaks
const nativeFetch = typeof window !== "undefined" ? window.fetch : null;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const publicPaths = ["/", "/reels", "/map", "/login", "/register", "/forgot-password", "/terms", "/privacy"];
  
  const isMerchantDashboardPath = [
    "/merchant",
    "/merchant/menu",
    "/merchant/profile",
    "/merchant/promotions",
    "/merchant/reviews",
    "/merchant/settings",
    "/merchant/add-restaurant"
  ].some(path => (pathname || "").startsWith(path));

  const isPublicPath = publicPaths.includes(pathname || "") || ((pathname || "").startsWith("/merchant/") && !isMerchantDashboardPath);

  useEffect(() => {
    // Load state from localStorage on mount
    try {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");
      
      if (storedToken && storedUser) {
        // Check if token is expired on mount
        try {
          if (!storedToken.startsWith("mock_token_")) {
            const base64Url = storedToken.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(window.atob(base64));
            const exp = payload.exp * 1000;
            const isExpired = exp < Date.now();

            if (isExpired) {
              const storedRefreshToken = localStorage.getItem("refresh_token");
              if (!storedRefreshToken) {
                console.warn("[useAuth] Token is expired on mount and no refresh token, clearing session...");
                localStorage.removeItem("token");
                localStorage.removeItem("refresh_token");
                localStorage.removeItem("user");
                setToken(null);
                setUser(null);
                router.replace("/login");
                return;
              }
            }
          }
        } catch (e) {
          console.error("[useAuth] Error parsing token on mount:", e);
        }

        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error reading auth state from localStorage:", error);
    } finally {
      setLoading(false);
    }
  }, [pathname]);

  // Overriding window.fetch globally to intercept API requests and refresh expired tokens
  useEffect(() => {
    if (!nativeFetch) return;

    window.fetch = async (input, init) => {
      const storedToken = localStorage.getItem("token");
      const storedRefreshToken = localStorage.getItem("refresh_token");

      if (storedToken) {
        if (storedToken.startsWith("mock_token_")) {
          return nativeFetch(input, init);
        }
        try {
          // Parse JWT expiration without external libraries
          const base64Url = storedToken.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(window.atob(base64));
          
          const exp = payload.exp * 1000;
          const isExpiredOrExpiringSoon = exp < Date.now() + 5 * 60 * 1000; // Expired or expiring within 5 minutes

          if (isExpiredOrExpiringSoon) {
            if (storedRefreshToken) {
              console.log("[useAuth] Token is expired or expiring soon, refreshing...");
              
              const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBRfhmp9BLcXtc2N2q4okE6TUyXihi18cc";
              
              // Request fresh token via Firebase Securetoken REST API
              const response = await nativeFetch(`https://securetoken.googleapis.com/v1/token?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                  grant_type: "refresh_token",
                  refresh_token: storedRefreshToken
                })
              });

              if (response.ok) {
                const data = await response.json();
                const newToken = data.id_token;
                const newRefreshToken = data.refresh_token;

                console.log("[useAuth] Token refreshed successfully!");

                // Save new tokens to localStorage and React state
                localStorage.setItem("token", newToken);
                localStorage.setItem("refresh_token", newRefreshToken);
                setToken(newToken);

                // Rewrite the Authorization header in the request if present
                if (init && init.headers) {
                  if (init.headers instanceof Headers) {
                    init.headers.set("Authorization", `Bearer ${newToken}`);
                  } else if (Array.isArray(init.headers)) {
                    const idx = init.headers.findIndex(([key]) => key.toLowerCase() === "authorization");
                    if (idx !== -1) {
                      init.headers[idx] = ["Authorization", `Bearer ${newToken}`];
                    }
                  } else {
                    (init.headers as any)["Authorization"] = `Bearer ${newToken}`;
                    (init.headers as any)["authorization"] = `Bearer ${newToken}`;
                  }
                }
              } else {
                console.error("[useAuth] Failed to refresh token, logging out...");
                localStorage.removeItem("token");
                localStorage.removeItem("refresh_token");
                localStorage.removeItem("user");
                setToken(null);
                setUser(null);
                
                toast({
                  title: "Phiên làm việc hết hạn 🔒",
                  description: "Vui lòng đăng nhập lại để tiếp tục.",
                  variant: "destructive"
                });
                router.replace("/login");
                
                // Return a mock 401 response directly to avoid hitting the backend with expired tokens
                return new Response(JSON.stringify({ detail: "Xác thực Firebase Token thất bại: Phiên làm việc hết hạn." }), {
                  status: 401,
                  statusText: "Unauthorized",
                  headers: { "Content-Type": "application/json" }
                });
              }
            } else {
              console.warn("[useAuth] Token is expired but no refresh token is present, logging out...");
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              setToken(null);
              setUser(null);
              
              toast({
                title: "Phiên làm việc hết hạn 🔒",
                description: "Vui lòng đăng nhập lại để tiếp tục.",
                variant: "destructive"
              });
              router.replace("/login");
              
              // Return a mock 401 response directly
              return new Response(JSON.stringify({ detail: "Xác thực Firebase Token thất bại: Phiên làm việc hết hạn." }), {
                status: 401,
                statusText: "Unauthorized",
                headers: { "Content-Type": "application/json" }
              });
            }
          }
        } catch (e) {
          console.error("[useAuth] Error during token refresh interception:", e);
        }
      }

      return nativeFetch(input, init);
    };

    return () => {
      window.fetch = nativeFetch;
    };
  }, [router, toast]);

  useEffect(() => {
    if (!loading) {
      if (!token && !isPublicPath) {
        router.replace("/login");
      }
    }
  }, [token, loading, pathname, router, isPublicPath]);

  const login = (newToken: string, newUser: User, refreshToken?: string) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    if (refreshToken) {
      localStorage.setItem("refresh_token", refreshToken);
    }
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    toast({
      title: "Đã đăng xuất 👋",
      description: "Hẹn gặp lại bạn lần sau nhé!",
    });
    router.push("/login");
  };

  const updateUser = (updatedUser: Partial<User>) => {
    if (!user) return;
    const newUserData = { ...user, ...updatedUser };
    localStorage.setItem("user", JSON.stringify(newUserData));
    setUser(newUserData);
  };

  // Prevent flash of protected page content while checking or redirecting
  if (loading || (!token && !isPublicPath)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="flex flex-col items-center space-y-4 animate-pulse">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-lg border border-primary/20">
            <ChefHat className="w-9 h-9 animate-bounce" />
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-xl font-black bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
              FoodieGram
            </h2>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              Đang xác thực tài khoản...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
