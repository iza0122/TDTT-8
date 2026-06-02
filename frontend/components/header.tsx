import { Button } from "@/components/ui/button";
import { MobileSidebar } from "@/components/sidebar";
import { LogOut } from "lucide-react";

export function Header() {
  // Placeholder for restaurant name (dynamic later)
  const restaurantName = "Delicious Bites";

  return (
    <div className="flex items-center justify-between w-full">
      <div className="md:hidden flex items-center space-x-2">
        <MobileSidebar />
        <h1 className="text-lg font-bold">{restaurantName}</h1>
      </div>
      <div className="hidden md:flex flex-1 items-center justify-end space-x-4">
        <h1 className="text-xl font-bold">{restaurantName}</h1>
        <Button variant="ghost">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
