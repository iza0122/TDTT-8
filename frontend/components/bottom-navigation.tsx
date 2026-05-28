"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Play, Map, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "Trang chủ" },
  { href: "/reels", icon: Play, label: "Reels" },
  { href: "/map", icon: Map, label: "Bản đồ" },
  { href: "/profile", icon: User, label: "Hồ sơ" },
];

export function BottomNavigation() {
  return null;
}
