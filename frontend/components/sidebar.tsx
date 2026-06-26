"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Store,
  Utensils,
  Star,
  Settings,
  Megaphone,
  Menu,
  LogOut,
  ChefHat,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const navItems = [
  { name: "Dashboard", href: "/merchant", icon: Home },
  { name: "Restaurant Profile", href: "/merchant/profile", icon: Store },
  { name: "Menu", href: "/merchant/menu", icon: Utensils },
  { name: "Promotions", href: "/merchant/promotions", icon: Megaphone },
  { name: "Reviews", href: "/merchant/reviews", icon: Star },
  { name: "Settings", href: "/merchant/settings", icon: Settings },
];

const restaurantName = "Delicious Bites";

interface SidebarProps {
  onClose?: () => void;
}

function NavigationContent({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const isActive = (href: string) => {
    if (href === "/merchant") return pathname === "/merchant";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo / Branding */}
      <div className="flex items-center gap-2.5 px-3 py-4 mb-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <ChefHat className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-bold text-sidebar-foreground leading-none">FoodieGram</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-0.5">Merchant</p>
        </div>
      </div>

      <div className="px-2 mb-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold px-2 mb-1">Navigation</p>
      </div>

      {/* Nav Items */}
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
                  className={cn(
                    "w-4 h-4 shrink-0",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <span>{item.name}</span>
                {active && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom: restaurant info + logout */}
      <div className="px-2 pt-2 pb-3 border-t border-sidebar-border mt-2">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-colors duration-150">
          <Avatar className="w-7 h-7 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {restaurantName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">{restaurantName}</p>
            <p className="text-[10px] text-muted-foreground">Merchant account</p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Logout"
            onClick={() => {
              logout();
              if (onClose) onClose();
            }}
          >
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  return <NavigationContent />;
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64 bg-sidebar border-sidebar-border">
        <NavigationContent onClose={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
