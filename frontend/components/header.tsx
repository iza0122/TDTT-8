"use client";

import { 
  Bell, 
  Search, 
  Menu, 
  Home, 
  Play, 
  MapPin, 
  User, 
  Bookmark, 
  Heart, 
  Star, 
  Settings, 
  LogOut, 
  Sparkles,
  LogIn,
  Camera,
  UserCheck,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface HeaderProps {
  className?: string;
  maxWidthClassName?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function Header({ className, maxWidthClassName = "max-w-lg", showBack = false, onBack }: HeaderProps = {}) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const displayName = user?.full_name || "Khách";
  const displayUsername = user?.email ? user.email.split('@')[0] : "guest";
  const displayAvatar = user?.avatar_url || "";

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className={`${maxWidthClassName} mx-auto flex items-center justify-between px-4 py-3 ${className || ""}`}>
        <div className="flex items-center gap-2">
          {showBack ? (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleBack} 
              className="rounded-full hover:bg-foreground/5 dark:hover:bg-white/5 transition-colors mr-1"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Button>
          ) : (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-foreground/5 dark:hover:bg-white/5 transition-colors lg:hidden">
                  <Menu className="w-5 h-5 text-foreground" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-0 flex flex-col border-r border-border bg-card">
                <SheetHeader className="sr-only">
                  <SheetTitle>Menu điều hướng FoodieGram</SheetTitle>
                  <SheetDescription>
                    Menu điều hướng chính và quản lý tài khoản cá nhân.
                  </SheetDescription>
                </SheetHeader>
                {/* Header profile area with gradient background */}
                <div className="relative p-6 pb-8 border-b border-border bg-gradient-to-br from-primary/10 via-background to-background">
                  <div className="absolute top-4 right-4">
                    <ThemeToggle compact />
                  </div>
                  <Link href={user ? "/profile" : "/login"} className="flex items-center gap-4 group">
                    <Avatar className="w-14 h-14 ring-4 ring-primary/10 transition-transform duration-300 group-hover:scale-105">
                      <AvatarImage src={displayAvatar} alt={displayName} />
                      <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">
                        {displayName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-bold text-foreground group-hover:text-primary transition-colors truncate">
                        {displayName}
                      </h2>
                      <p className="text-xs text-muted-foreground truncate">
                        @{displayUsername}
                      </p>
                    </div>
                  </Link>
                  <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                    <div>
                      <span className="font-bold text-foreground">0</span> bài viết
                    </div>
                    <div>
                      <span className="font-bold text-foreground">0</span> người theo dõi
                    </div>
                  </div>
                </div>

                {/* Main Menu Links */}
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground px-3 mb-2 uppercase tracking-wider">Danh mục chính</p>
                    <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200 group">
                      <Home className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span>Trang chủ</span>
                    </Link>
                    <Link href="/?feed=following" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200 group">
                      <UserCheck className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span>Đã follow</span>
                    </Link>
                    <Link href="/reels" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200 group">
                      <Play className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span>Reels quán ngon</span>
                    </Link>
                    <Link href="/create" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200 group">
                      <Camera className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span>Đăng bài review</span>
                    </Link>
                    <Link href="/map" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200 group">
                      <MapPin className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span>Bản đồ ẩm thực</span>
                    </Link>
                    <Link href={user ? "/profile" : "/login"} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200 group">
                      <User className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span>Hồ sơ của tôi</span>
                    </Link>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground px-3 mb-2 uppercase tracking-wider">Cá nhân hóa</p>
                    <Link href={user ? "/profile" : "/login"} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200 group">
                      <Bookmark className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span>Bài viết đã lưu</span>
                    </Link>
                    <Link href={user ? "/profile" : "/login"} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200 group">
                      <Heart className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span>Quán ăn yêu thích</span>
                    </Link>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200 group text-left">
                      <Star className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span>Đánh giá đã viết</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200 group text-left">
                      <Sparkles className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span>Đặc quyền ẩm thực</span>
                    </button>
                  </div>
                </div>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-border bg-muted/40 space-y-3.5">
                  <div className="flex items-center justify-center p-2.5 rounded-2xl bg-card border border-border/80 shadow-xs">
                    <ThemeToggle />
                  </div>
                  <div className="space-y-1">
                    <Link href={user ? "/profile" : "/login"} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200 group">
                      <Settings className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span>Cài đặt</span>
                    </Link>
                    {user ? (
                      <button 
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all duration-200 group text-left"
                      >
                        <LogOut className="w-5 h-5 text-destructive/80 group-hover:text-destructive transition-colors" />
                        <span>Đăng xuất</span>
                      </button>
                    ) : (
                      <Link 
                        href="/login"
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-primary hover:bg-primary/10 transition-all duration-200 group text-left"
                      >
                        <LogIn className="w-5 h-5 text-primary/80 group-hover:text-primary transition-colors" />
                        <span>Đăng nhập</span>
                      </Link>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}
          
          <h1 className="text-xl font-bold text-primary">FoodieGram</h1>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Search className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          </Button>
          <ThemeToggle compact />
        </div>
      </div>
    </header>
  );
}

