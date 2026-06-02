"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

interface Promotion {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const mockPromotions: Promotion[] = [
  {
    id: "1",
    title: "Summer Sale!",
    description: "20% off all main courses.",
    startDate: "2026-06-01",
    endDate: "2026-06-30",
    isActive: true,
  },
  {
    id: "2",
    title: "Happy Hour",
    description: "Buy one get one free on all drinks from 3 PM - 5 PM.",
    startDate: "2026-06-01",
    endDate: "2026-08-31",
    isActive: false,
  },
];

export default function PromotionsManagementPage() {
  const [promotions, setPromotions] = useState<Promotion[]>(mockPromotions);
  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);

  const handleAddEditPromotion = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle adding or editing a promotion
    console.log("Add/Edit Promotion");
    setIsPromotionDialogOpen(false);
  };

  const handleDeletePromotion = (id: string) => {
    setPromotions(promotions.filter((promo) => promo.id !== id));
  };

  const handleToggleActive = (id: string) => {
    setPromotions(
      promotions.map((promo) =>
        promo.id === id ? { ...promo, isActive: !promo.isActive } : promo
      )
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Promotions & Offers Management</h1>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Promotions</CardTitle>
          <Dialog open={isPromotionDialogOpen} onOpenChange={setIsPromotionDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingPromotion(null)}>Create New Promotion</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingPromotion ? "Edit Promotion" : "Create New Promotion"}</DialogTitle>
                <DialogDescription>
                  {editingPromotion
                    ? "Make changes to your promotion here." 
                    : "Add a new promotion to your restaurant."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddEditPromotion} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="promoTitle">Title</Label>
                  <Input
                    id="promoTitle"
                    defaultValue={editingPromotion?.title || ""}
                    placeholder="e.g., Summer Sale!"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="promoDescription">Description</Label>
                  <Textarea
                    id="promoDescription"
                    defaultValue={editingPromotion?.description || ""}
                    placeholder="A brief description of the promotion..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    defaultValue={editingPromotion?.startDate || ""}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    defaultValue={editingPromotion?.endDate || ""}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={editingPromotion?.isActive || false}
                    onCheckedChange={(checked) =>
                      setEditingPromotion((prev) =>
                        prev ? { ...prev, isActive: checked } : { ...editingPromotion!, isActive: checked }
                      )
                    }
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                <DialogFooter>
                  <Button type="submit">Save Promotion</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Starts</TableHead>
                <TableHead>Ends</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotions.map((promo) => (
                <TableRow key={promo.id}>
                  <TableCell className="font-medium">{promo.title}</TableCell>
                  <TableCell>{promo.description}</TableCell>
                  <TableCell>{promo.startDate}</TableCell>
                  <TableCell>{promo.endDate}</TableCell>
                  <TableCell>
                    <Switch
                      checked={promo.isActive}
                      onCheckedChange={() => handleToggleActive(promo.id)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mr-2"
                      onClick={() => {
                        setEditingPromotion(promo);
                        setIsPromotionDialogOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeletePromotion(promo.id)}
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
    </div>
  );
}
