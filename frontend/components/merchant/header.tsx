"use client";

import { Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileSidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { getMerchantsByOwner } from "@/lib/services/merchant";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { token, logout } = useAuth();
  const [restaurantName, setRestaurantName] = useState("Kênh đối tác");

  useEffect(() => {
    const fetchActiveMerchantName = async () => {
      if (!token) return;
      try {
        const userMerchants = await getMerchantsByOwner(token);
        if (userMerchants.length > 0) {
          const savedId = localStorage.getItem("selected_merchant_id");
          const active = userMerchants.find(m => String(m.id) === savedId) || userMerchants[0];
          setRestaurantName(active.name);
        }
      } catch (err) {
        console.error("Failed to load merchant name for header:", err);
      }
    };
    fetchActiveMerchantName();
    
    // Check local storage selection changes
    const interval = setInterval(fetchActiveMerchantName, 1500);

    return () => {
      clearInterval(interval);
    };
  }, [token]);

  return (
    <div className="flex items-center justify-between w-full gap-4">
      {/* Mobile: hamburger + name */}
      <div className="flex items-center gap-2 md:hidden">
        <MobileSidebar />
        <span className="text-sm font-bold text-foreground">{restaurantName}</span>
      </div>

      {/* Desktop: restaurant name left-of-actions */}
      <div className="hidden md:flex flex-1 items-center justify-end gap-2">
        <span className="text-sm font-semibold text-foreground mr-2">{restaurantName}</span>

        {/* Notification bell */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <Bell className="w-4 h-4" />
              {/* Unread dot — remove when no notifications */}
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b">
              Notifications
            </div>
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
              No new notifications
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme toggle (compact icon) */}
        <ThemeToggle compact />

        {/* Logout */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={logout}
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>

      {/* Mobile: actions on right */}
      <div className="flex items-center gap-1 md:hidden">
        <ThemeToggle compact />
        <Button variant="ghost" size="icon" className="relative text-muted-foreground">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={logout}
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
