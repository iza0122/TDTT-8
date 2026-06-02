"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Star } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  response?: string;
}

const mockReviews: Review[] = [
  {
    id: "1",
    customerName: "Alice Smith",
    rating: 5,
    comment: "Absolutely loved the Classic Burger! Best in town.",
    date: "2026-05-28",
    response: "Thank you, Alice! We're thrilled you enjoyed it!",
  },
  {
    id: "2",
    customerName: "Bob Johnson",
    rating: 4,
    comment: "Great Caesar Salad, but the croutons were a bit soft.",
    date: "2026-05-29",
  },
  {
    id: "3",
    customerName: "Charlie Brown",
    rating: 5,
    comment: "The service was impeccable and the food was fantastic.",
    date: "2026-05-30",
  },
  {
    id: "4",
    customerName: "Diana Prince",
    rating: 3,
    comment: "Food was okay, but waited a bit too long for the order.",
    date: "2026-05-31",
  },
];

export default function ReviewsManagementPage() {
  const [reviews, setReviews] = useState<Review[]>(mockReviews);
  const [filterRating, setFilterRating] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("dateDesc");
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [respondingToReview, setRespondingToReview] = useState<Review | null>(null);
  const [reviewResponse, setReviewResponse] = useState("");

  const filteredReviews = reviews.filter((review) => {
    if (filterRating === "all") return true;
    return review.rating === parseInt(filterRating);
  }).sort((a, b) => {
    if (sortBy === "dateDesc") return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortBy === "dateAsc") return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sortBy === "ratingDesc") return b.rating - a.rating;
    if (sortBy === "ratingAsc") return a.rating - b.rating;
    return 0;
  });

  const handleRespondToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (respondingToReview && reviewResponse.trim()) {
      setReviews(
        reviews.map((review) =>
          review.id === respondingToReview.id
            ? { ...review, response: reviewResponse.trim() }
            : review
        )
      );
      setIsResponseDialogOpen(false);
      setRespondingToReview(null);
      setReviewResponse("");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Review & Rating Management</h1>

      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
          <CardDescription>View and manage feedback from your customers.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <Label htmlFor="filterRating">Filter by Rating:</Label>
            <Select value={filterRating} onValueChange={setFilterRating}>
              <SelectTrigger id="filterRating" className="w-[180px]">
                <SelectValue placeholder="All Ratings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>

            <Label htmlFor="sortBy">Sort By:</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger id="sortBy" className="w-[180px]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dateDesc">Date (Newest first)</SelectItem>
                <SelectItem value="dateAsc">Date (Oldest first)</SelectItem>
                <SelectItem value="ratingDesc">Rating (High to Low)</SelectItem>
                <SelectItem value="ratingAsc">Rating (Low to High)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="font-medium">{review.customerName}</TableCell>
                  <TableCell className="flex items-center">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />
                    ))}
                  </TableCell>
                  <TableCell>{review.comment}</TableCell>
                  <TableCell>{review.date}</TableCell>
                  <TableCell className="text-right">
                    <Dialog open={isResponseDialogOpen && respondingToReview?.id === review.id} onOpenChange={setIsResponseDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setRespondingToReview(review);
                            setReviewResponse(review.response || "");
                            setIsResponseDialogOpen(true);
                          }}
                        >
                          {review.response ? "Edit Response" : "Respond"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Respond to {respondingToReview?.customerName}</DialogTitle>
                          <DialogDescription>Your response will be visible to the customer.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleRespondToReview} className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="reviewResponse">Your Response</Label>
                            <Textarea
                              id="reviewResponse"
                              value={reviewResponse}
                              onChange={(e) => setReviewResponse(e.target.value)}
                              placeholder="Type your response here..."
                              rows={4}
                            />
                          </div>
                          <DialogFooter>
                            <Button type="submit">Submit Response</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
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
