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
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const publicPaths = ["/login", "/register", "/forgot-password", "/terms", "/privacy"];
  const isPublicPath = publicPaths.includes(pathname || "");

  useEffect(() => {
    // Load state from localStorage on mount
    try {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error reading auth state from localStorage:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!token && !isPublicPath) {
        router.replace("/login");
      }
    }
  }, [token, loading, pathname, router, isPublicPath]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
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
