"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Store,
  Video,
  Megaphone,
  LogOut,
  ShieldCheck,
  Menu,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Người dùng", href: "/admin/users", icon: Users },
  { name: "Quán ăn", href: "/admin/merchants", icon: Store },
  { name: "Kiểm duyệt Video", href: "/admin/videos", icon: Video },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-3 py-4 mb-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-bold text-sidebar-foreground leading-none">FoodieGram</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-0.5">Admin Panel</p>
        </div>
      </div>

      <div className="px-2 mb-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold px-2 mb-1">
          Quản trị
        </p>
      </div>

      <nav className="flex flex-col gap-0.5 px-2 flex-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.name} href={item.href} onClick={onClose}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer",
                  active
                    ? "bg-accent text-accent-foreground font-semibold"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon
                  className={cn("w-4 h-4 shrink-0", active ? "text-primary" : "text-muted-foreground")}
                />
                <span>{item.name}</span>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="px-2 pt-2 pb-3 border-t border-sidebar-border mt-2">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-colors duration-150">
          <Avatar className="w-7 h-7 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {user?.full_name?.[0] ?? "A"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">
              {user?.full_name ?? user?.email ?? "Admin"}
            </p>
            <p className="text-[10px] text-muted-foreground">Admin account</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 w-7 h-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Đăng xuất"
            onClick={() => { logout(); onClose?.(); }}
          >
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!router) return; // Add this line
    if (!loading && user && user.role !== "admin") {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading) return null;
  if (!user || user.role !== "admin") return null;

  return (
    <div className="flex min-h-[100dvh] bg-background">
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-sidebar-border bg-sidebar">
        <SidebarContent />
      </aside>

      <div className="flex flex-col flex-1 min-w-0">
        <header className="sticky top-0 z-10 w-full border-b border-border bg-background/95 backdrop-blur-sm px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 bg-sidebar border-sidebar-border">
                <SidebarContent onClose={() => setSheetOpen(false)} />
              </SheetContent>
            </Sheet>
            <span className="text-sm font-semibold text-muted-foreground md:hidden">Admin Panel</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 border border-primary/20">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">Admin</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>

      <Toaster />
    </div>
  );
}
