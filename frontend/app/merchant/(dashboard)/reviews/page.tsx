"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageHeader } from "@/components/merchant/page-header";
import { Star, MessageSquare, StarOff } from "lucide-react";
import { useState } from "react";

interface Review {
  id: string;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  response?: string;
}

const mockReviews: Review[] = [
  {
    id: "1",
    customerName: "Alice Smith",
    customerAvatar: "https://i.pravatar.cc/40?u=alice",
    rating: 5,
    comment: "Absolutely loved the Classic Burger! Best in town.",
    date: "2026-05-28",
    response: "Thank you, Alice! We're thrilled you enjoyed it.",
  },
  {
    id: "2",
    customerName: "Bob Johnson",
    customerAvatar: "https://i.pravatar.cc/40?u=bob",
    rating: 4,
    comment: "Great Caesar Salad, but the croutons were a bit soft.",
    date: "2026-05-29",
  },
  {
    id: "3",
    customerName: "Charlie Brown",
    customerAvatar: "https://i.pravatar.cc/40?u=charlie",
    rating: 5,
    comment: "The service was impeccable and the food was fantastic.",
    date: "2026-05-30",
  },
  {
    id: "4",
    customerName: "Diana Prince",
    customerAvatar: "https://i.pravatar.cc/40?u=diana",
    rating: 3,
    comment: "Food was okay, but waited a bit too long for the order.",
    date: "2026-05-31",
  },
  {
    id: "5",
    customerName: "Evan Wright",
    customerAvatar: "https://i.pravatar.cc/40?u=evan",
    rating: 2,
    comment: "Disappointed with the portion size, expected more for the price.",
    date: "2026-06-01",
  },
];

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

export default function ReviewsManagementPage() {
  const [reviews, setReviews] = useState<Review[]>(mockReviews);
  const [filterRating, setFilterRating] = useState("all");
  const [sortBy, setSortBy] = useState("dateDesc");
  const [respondingTo, setRespondingTo] = useState<Review | null>(null);
  const [responseText, setResponseText] = useState("");

  const filtered = reviews
    .filter((r) => filterRating === "all" || r.rating === parseInt(filterRating))
    .sort((a, b) => {
      if (sortBy === "dateDesc") return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === "dateAsc") return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === "ratingDesc") return b.rating - a.rating;
      if (sortBy === "ratingAsc") return a.rating - b.rating;
      return 0;
    });

  const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: (reviews.filter((r) => r.rating === star).length / reviews.length) * 100,
  }));

  const handleSubmitResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondingTo || !responseText.trim()) return;
    setReviews(reviews.map((r) =>
      r.id === respondingTo.id ? { ...r, response: responseText.trim() } : r
    ));
    setRespondingTo(null);
    setResponseText("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews"
        description="Xem và phản hồi đánh giá từ khách hàng"
      />

      {/* Rating Summary */}
      <Card className="gap-0 py-0">
        <CardContent className="px-5 py-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Big avg number */}
            <div className="text-center shrink-0">
              <p className="text-5xl font-black tabular-nums text-foreground leading-none">
                {avgRating.toFixed(1)}
              </p>
              <div className="flex items-center justify-center gap-0.5 mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(avgRating)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-transparent text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">{reviews.length} đánh giá</p>
            </div>

            <div className="w-px h-16 bg-border hidden sm:block shrink-0" />

            {/* Breakdown bars */}
            <div className="flex-1 w-full space-y-2">
              {ratingCounts.map(({ star, count, pct }) => (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground w-4 tabular-nums text-right">{star}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                  <Progress value={pct} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground tabular-nums w-4">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Table */}
      <Card className="gap-0 py-0">
        <CardHeader className="px-5 pt-4 pb-4 border-b border-border">
          <div className="flex flex-wrap gap-3">
            <Select value={filterRating} onValueChange={setFilterRating}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tất cả sao" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả sao</SelectItem>
                {[5, 4, 3, 2, 1].map((s) => (
                  <SelectItem key={s} value={String(s)}>{s} sao</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dateDesc">Mới nhất trước</SelectItem>
                <SelectItem value="dateAsc">Cũ nhất trước</SelectItem>
                <SelectItem value="ratingDesc">Sao cao → thấp</SelectItem>
                <SelectItem value="ratingAsc">Sao thấp → cao</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="px-0 py-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <StarOff className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Không có đánh giá nào</p>
              <p className="text-xs text-muted-foreground mt-1">Thử thay đổi bộ lọc</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">Khách hàng</TableHead>
                  <TableHead>Đánh giá</TableHead>
                  <TableHead className="hidden lg:table-cell">Nhận xét</TableHead>
                  <TableHead className="hidden md:table-cell">Ngày</TableHead>
                  <TableHead className="text-right pr-5">Phản hồi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((review) => (
                  <TableRow key={review.id} className="group align-top">
                    <TableCell className="pl-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarImage src={review.customerAvatar} alt={review.customerName} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                            {review.customerName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-foreground whitespace-nowrap">
                          {review.customerName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <StarRow rating={review.rating} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell py-4 max-w-xs">
                      <p className="text-sm text-foreground line-clamp-2">{review.comment}</p>
                      {review.response && (
                        <div className="mt-2 px-3 py-2 bg-muted rounded-lg border-l-2 border-primary/30">
                          <p className="text-xs text-muted-foreground italic line-clamp-2">
                            Phản hồi: {review.response}
                          </p>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell py-4 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                      {new Date(review.date).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-right pr-5 py-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setRespondingTo(review);
                          setResponseText(review.response ?? "");
                        }}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        {review.response ? "Sửa" : "Phản hồi"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Response Dialog */}
      <Dialog open={!!respondingTo} onOpenChange={(open) => { if (!open) { setRespondingTo(null); setResponseText(""); } }}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Phản hồi {respondingTo?.customerName}</DialogTitle>
            <DialogDescription>Phản hồi của bạn sẽ hiển thị công khai bên dưới đánh giá.</DialogDescription>
          </DialogHeader>
          {respondingTo && (
            <div className="px-3 py-2.5 bg-muted rounded-lg text-sm text-muted-foreground italic border-l-2 border-amber-400/50">
              <div className="flex items-center gap-1 mb-1 not-italic">
                <StarRow rating={respondingTo.rating} />
              </div>
              "{respondingTo.comment}"
            </div>
          )}
          <form onSubmit={handleSubmitResponse} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="response">Phản hồi của bạn</Label>
              <Textarea
                id="response"
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Cảm ơn bạn đã đánh giá..."
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!responseText.trim()}>Gửi phản hồi</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
