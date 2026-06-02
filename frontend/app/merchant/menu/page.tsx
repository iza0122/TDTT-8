"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
}

interface Category {
  id: string;
  name: string;
}

const mockDishes: Dish[] = [
  {
    id: "1",
    name: "Classic Burger",
    description: "A juicy beef patty with lettuce, tomato, and cheese.",
    price: 12.99,
    category: "Main Course",
    imageUrl: "/placeholder.jpg",
  },
  {
    id: "2",
    name: "Caesar Salad",
    description: "Fresh romaine lettuce with Caesar dressing, croutons, and parmesan cheese.",
    price: 9.50,
    category: "Appetizer",
    imageUrl: "/placeholder.jpg",
  },
  {
    id: "3",
    name: "Orange Juice",
    description: "Freshly squeezed orange juice.",
    price: 4.00,
    category: "Drinks",
    imageUrl: "/placeholder.jpg",
  },
];

const mockCategories: Category[] = [
  { id: "1", name: "Appetizer" },
  { id: "2", name: "Main Course" },
  { id: "3", name: "Drinks" },
  { id: "4", name: "Desserts" },
];

export default function MenuManagementPage() {
  const [dishes, setDishes] = useState<Dish[]>(mockDishes);
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [isDishDialogOpen, setIsDishDialogOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");

  const handleAddEditDish = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle adding or editing a dish
    console.log("Add/Edit Dish");
    setIsDishDialogOpen(false);
  };

  const handleDeleteDish = (id: string) => {
    setDishes(dishes.filter((dish) => dish.id !== id));
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim()) {
      setCategories([
        ...categories,
        { id: String(categories.length + 1), name: newCategoryName.trim() },
      ]);
      setNewCategoryName("");
    }
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(categories.filter((category) => category.id !== id));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Menu Management</h1>

      {/* Dish List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Dishes</CardTitle>
          <Dialog open={isDishDialogOpen} onOpenChange={setIsDishDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingDish(null)}>Add New Dish</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingDish ? "Edit Dish" : "Add New Dish"}</DialogTitle>
                <DialogDescription>
                  {editingDish
                    ? "Make changes to your dish here." 
                    : "Add a new dish to your menu."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddEditDish} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="dishName">Dish Name</Label>
                  <Input
                    id="dishName"
                    defaultValue={editingDish?.name || ""}
                    placeholder="e.g., Spicy Noodles"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dishDescription">Description</Label>
                  <Textarea
                    id="dishDescription"
                    defaultValue={editingDish?.description || ""}
                    placeholder="A brief description of the dish..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dishPrice">Price</Label>
                  <Input
                    id="dishPrice"
                    type="number"
                    step="0.01"
                    defaultValue={editingDish?.price.toString() || ""}
                    placeholder="e.g., 15.99"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dishCategory">Category</Label>
                  <Select defaultValue={editingDish?.category || ""}>
                    <SelectTrigger id="dishCategory">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dishImage">Image URL</Label>
                  <Input
                    id="dishImage"
                    defaultValue={editingDish?.imageUrl || ""}
                    placeholder="e.g., /dishes/spicy-noodles.jpg"
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">Save Dish</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dishes.map((dish) => (
                <TableRow key={dish.id}>
                  <TableCell className="font-medium">{dish.name}</TableCell>
                  <TableCell>{dish.category}</TableCell>
                  <TableCell>${dish.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mr-2"
                      onClick={() => {
                        setEditingDish(dish);
                        setIsDishDialogOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteDish(dish.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Categories Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Menu Categories</CardTitle>
          <form onSubmit={handleAddCategory} className="flex space-x-2">
            <Input
              placeholder="New Category Name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
            <Button type="submit">Add Category</Button>
          </form>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex justify-between items-center p-2 border rounded-md"
              >
                <span>{category.name}</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteCategory(category.id)}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
