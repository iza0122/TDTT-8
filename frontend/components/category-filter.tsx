"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { categories } from "@/lib/data";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  activeCategory: string;
  onCategoryChange: (id: string) => void;
}

export function CategoryFilter({ activeCategory, onCategoryChange }: CategoryFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftBtn, setShowLeftBtn] = useState(false);
  const [showRightBtn, setShowRightBtn] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    
    // Show left button if we've scrolled right
    setShowLeftBtn(el.scrollLeft > 2);
    
    // Show right button if we can scroll more right
    const maxScroll = el.scrollWidth - el.clientWidth;
    setShowRightBtn(el.scrollLeft < maxScroll - 2);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScroll();
    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    // Initial check after paint/layout renders
    const timer = setTimeout(checkScroll, 100);

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
      clearTimeout(timer);
    };
  }, []);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;

    const scrollAmount = 180;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth"
    });
  };

  return (
    <div className="bg-card border-b border-border relative group/filter">
      
      {/* Left scroll button with gradient fade */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-card via-card/90 to-transparent z-10 flex items-center pl-4 pointer-events-none transition-all duration-300 opacity-0",
        showLeftBtn && "opacity-100"
      )}>
        <button
          onClick={() => scroll("left")}
          className="w-7 h-7 rounded-full bg-background border border-border shadow-xs flex items-center justify-center pointer-events-auto hover:bg-muted hover:scale-105 active:scale-95 transition-all"
          aria-label="Cuộn sang trái"
        >
          <ChevronLeft className="w-4 h-4 text-foreground" />
        </button>
      </div>

      {/* Right scroll button with gradient fade */}
      <div className={cn(
        "absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-card via-card/90 to-transparent z-10 flex items-center justify-end pr-4 pointer-events-none transition-all duration-300 opacity-0",
        showRightBtn && "opacity-100"
      )}>
        <button
          onClick={() => scroll("right")}
          className="w-7 h-7 rounded-full bg-background border border-border shadow-xs flex items-center justify-center pointer-events-auto hover:bg-muted hover:scale-105 active:scale-95 transition-all"
          aria-label="Cuộn sang phải"
        >
          <ChevronRight className="w-4 h-4 text-foreground" />
        </button>
      </div>

      {/* Horizontal Scrollable Container */}
      <div
        ref={scrollRef}
        className="max-w-lg mx-auto px-4 py-2.5 overflow-x-auto scrollbar-hide scroll-smooth flex gap-2"
        onScroll={checkScroll}
      >
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 hover:scale-102 active:scale-98",
              activeCategory === category.id
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-secondary/60 text-secondary-foreground hover:bg-secondary"
            )}
          >
            <span className="text-base">{category.icon}</span>
            <span>{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
