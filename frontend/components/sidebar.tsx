import Link from "next/link";
import { Home, Store, Utensils, Star, Settings, Megaphone, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "Dashboard", href: "/merchant", icon: Home },
  { name: "Restaurant Profile", href: "/merchant/profile", icon: Store },
  { name: "Menu", href: "/merchant/menu", icon: Utensils },
  { name: "Promotions", href: "/merchant/promotions", icon: Megaphone },
  { name: "Reviews", href: "/merchant/reviews", icon: Star },
  { name: "Settings", href: "/merchant/settings", icon: Settings },
];

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

function NavigationContent({ isMobile, onClose }: SidebarProps) {
  return (
    <nav className="flex flex-col space-y-2">
      {navItems.map((item) => (
        <Link key={item.name} href={item.href}>
          <Button
            variant="ghost"
            className="w-full justify-start text-base"
            onClick={onClose}
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.name}
          </Button>
        </Link>
      ))}
    </nav>
  );
}

export function Sidebar() {
  return <NavigationContent />;
}

export function MobileSidebar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Home className="h-5 w-5" /> {/* Placeholder icon for hamburger */}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64">
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900 p-4">
          <h2 className="text-2xl font-bold mb-6 text-center">FoodieGram</h2>
          <NavigationContent onClose={() => {}} isMobile />
        </div>
      </SheetContent>
    </Sheet>
  );
}
