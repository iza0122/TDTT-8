import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Star, Utensils, Megaphone, Bell } from "lucide-react";


const mockMetrics = {
  averageRating: 4.5,
  totalReviews: 120,
  popularDishes: [
    { name: "Spicy Noodles", likes: 350 },
    { name: "Vegan Burger", likes: 280 },
    { name: "Sushi Platter", likes: 210 },
  ],
  revenueData: [
    { name: "Jan", total: 4000 },
    { name: "Feb", total: 3000 },
    { name: "Mar", total: 5000 },
    { name: "Apr", total: 4500 },
    { name: "May", total: 6000 },
  ],
};

export default function MerchantDashboardOverviewPage() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Average Rating Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{mockMetrics.averageRating} / 5.0</div>
          <p className="text-xs text-muted-foreground">
            Based on {mockMetrics.totalReviews} reviews
          </p>
        </CardContent>
      </Card>

      {/* Popular Dishes Card */}
      <Card className="col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Popular Dishes</CardTitle>
          <Utensils className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {mockMetrics.popularDishes.map((dish) => (
              <li key={dish.name} className="flex justify-between items-center">
                <span>{dish.name}</span>
                <span className="text-sm text-muted-foreground">{dish.likes} likes</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Quick Links Card */}
      <Card className="col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          <Megaphone className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="grid gap-2">
          <Button variant="outline" className="justify-start" asChild>
            <Link href="/merchant/menu/new">Add New Dish</Link>
          </Button>
          <Button variant="outline" className="justify-start" asChild>
            <Link href="/merchant/promotions/new">Create New Promotion</Link>
          </Button>
          <Button variant="outline" className="justify-start" asChild>
            <Link href="/merchant/reviews">View New Reviews</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Notifications/Alerts Card */}
      <Card className="col-span-full lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Notifications & Alerts</CardTitle>
          <Bell className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No new notifications.</p>
          {/* Example notification: */}
          {/* <div className="mb-2 p-2 border rounded-md bg-amber-50 dark:bg-amber-950">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Promotion "Summer Sale" expires in 3 days!</p>
          </div> */}
        </CardContent>
      </Card>


    </div>
  );
}
