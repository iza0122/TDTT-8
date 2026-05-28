"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, SlidersHorizontal } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  compact?: boolean;
}

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={cn("w-10 h-10 rounded-full bg-card/90 border border-border/80", !compact && "w-full h-11 rounded-full bg-secondary dark:bg-muted/80")} />;
  }

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-10 h-10 rounded-full bg-card/90 backdrop-blur-md border border-border/80 shadow-xs flex items-center justify-center hover:bg-orange-500 hover:text-white hover:border-orange-500 active:scale-95 transition-all duration-300 text-foreground"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Chuyển giao diện</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setTheme("light")} className={theme === "light" ? "bg-accent" : ""}>
            <Sun className="mr-2 h-4 w-4" />
            Sáng
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")} className={theme === "dark" ? "bg-accent" : ""}>
            <Moon className="mr-2 h-4 w-4" />
            Tối
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")} className={theme === "system" ? "bg-accent" : ""}>
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Hệ thống
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Full-width Premium Segmented Pill Slider with 100% pixel-perfect symmetric alignment inside an inner flex wrapper
  return (
    <div className="relative flex items-center bg-secondary dark:bg-muted/80 rounded-full p-1 w-full h-11 border border-border/60 shadow-xs select-none">
      {/* Inner flex container to completely isolate padding and guarantee absolute alignment */}
      <div className="relative w-full h-full flex">
        {/* Sliding background indicator (The pure white/card handle taking exactly 1/3 of the active inner width) */}
        <div 
          className="absolute top-0 bottom-0 bg-card rounded-full shadow-sm border border-border/10 transition-all duration-300 ease-in-out z-0"
          style={{
            left: theme === "system" 
              ? "0%" 
              : theme === "dark" 
                ? "33.3333%" 
                : "66.6667%",
            right: theme === "system" 
              ? "66.6667%" 
              : theme === "dark" 
                ? "33.3333%" 
                : "0%"
          }}
        />

        {/* Clickable Icons Layer on Top (flex-1 buttons inside the same inner flex container for sub-pixel perfect symmetry) */}
        <button 
          onClick={() => setTheme("system")}
          className={cn(
            "flex-1 h-full flex items-center justify-center rounded-full cursor-pointer z-10 transition-all duration-300",
            theme === "system" 
              ? "text-orange-500 scale-110 drop-shadow-[0_0_8px_rgba(249,115,22,0.2)]" 
              : "text-muted-foreground/60 hover:text-foreground"
          )}
          title="Hệ thống"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        <button 
          onClick={() => setTheme("dark")}
          className={cn(
            "flex-1 h-full flex items-center justify-center rounded-full cursor-pointer z-10 transition-all duration-300",
            theme === "dark" 
              ? "text-orange-500 scale-110 drop-shadow-[0_0_8px_rgba(249,115,22,0.2)]" 
              : "text-muted-foreground/60 hover:text-foreground"
          )}
          title="Tối"
        >
          <Moon className={cn("w-4 h-4", theme === "dark" && "fill-orange-500/10")} />
        </button>

        <button 
          onClick={() => setTheme("light")}
          className={cn(
            "flex-1 h-full flex items-center justify-center rounded-full cursor-pointer z-10 transition-all duration-300",
            theme === "light" 
              ? "text-orange-500 scale-110 drop-shadow-[0_0_8px_rgba(249,115,22,0.2)]" 
              : "text-muted-foreground/60 hover:text-foreground"
          )}
          title="Sáng"
        >
          <Sun className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
