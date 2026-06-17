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
import { useState, useEffect } from "react";
import Image from "next/image";
import { Star, MessageSquare, StarOff, Loader2, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  getMerchantsByOwner,
  getReviews,
  respondToReview,
  deleteReview,
  MerchantResponse,
  ReviewResponse
} from "@/lib/services/merchant";

interface Review {
  id: string;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  response?: string;
  image?: string;
}

const mapBackendReviewToReview = (r: ReviewResponse): Review => ({
  id: String(r.id),
  customerName: r.customerName,
  customerAvatar: r.customerAvatar || undefined,
  rating: r.rating,
  comment: r.comment,
  date: r.date.split("T")[0],
  response: r.response || undefined,
  image: r.reviewImage || undefined
});

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
  const { token, user } = useAuth();
  const { toast } = useToast();

  const [merchant, setMerchant] = useState<MerchantResponse | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterRating, setFilterRating] = useState("all");
  const [sortBy, setSortBy] = useState("dateDesc");
  const [respondingTo, setRespondingTo] = useState<Review | null>(null);
  const [responseText, setResponseText] = useState("");
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const handleDeleteReview = async (reviewId: number) => {
    if (!token || !merchant) return;

    if (!confirm("Bạn có chắc chắn muốn xóa đánh giá này không?")) {
      return;
    }

    setIsDeletingId(reviewId);
    try {
      await deleteReview(reviewId, token);
      setReviews(reviews.filter((r) => Number(r.id) !== reviewId));
      toast({
        title: "Thành công 🎉",
        description: "Đã xóa đánh giá thành công."
      });
    } catch (err: any) {
      toast({
        title: "Lỗi 🙁",
        description: err.message || "Không thể xóa đánh giá.",
        variant: "destructive"
      });
    } finally {
      setIsDeletingId(null);
    }
  };

  useEffect(() => {
    const fetchReviews = async () => {
      if (!token || !user) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const userMerchants = await getMerchantsByOwner(token);
        if (userMerchants.length > 0) {
          const activeMerchant = userMerchants[0];
          setMerchant(activeMerchant);
          const reviewsList = await getReviews(activeMerchant.id, token);
          setReviews(reviewsList.map(mapBackendReviewToReview));
        }
      } catch (error: any) {
        console.error("Failed to fetch reviews:", error);
        toast({
          title: "Lỗi 🙁",
          description: error.message || "Không thể tải danh sách đánh giá.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [token, user]);

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !merchant || !respondingTo || !responseText.trim()) return;

    try {
      const updated = await respondToReview(merchant.id, Number(respondingTo.id), token, responseText.trim());
      setReviews(reviews.map((r) =>
        r.id === respondingTo.id ? mapBackendReviewToReview(updated) : r
      ));
      toast({
        title: "Thành công 🎉",
        description: "Đã gửi phản hồi cho đánh giá."
      });
      setRespondingTo(null);
      setResponseText("");
    } catch (err: any) {
      toast({
        title: "Lỗi 🙁",
        description: err.message || "Không thể gửi phản hồi.",
        variant: "destructive"
      });
    }
  };

  const filtered = reviews
    .filter((r) => filterRating === "all" || r.rating === parseInt(filterRating))
    .sort((a, b) => {
      if (sortBy === "dateDesc") return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === "dateAsc") return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === "ratingDesc") return b.rating - a.rating;
      if (sortBy === "ratingAsc") return a.rating - b.rating;
      return 0;
    });

  const avgRating = reviews.length > 0 
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length 
    : 5.0;

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
    return { star, count, pct };
  });

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

        <CardContent className="p-6 bg-secondary/5 border-t border-border/20">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <StarOff className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Không có đánh giá nào</p>
              <p className="text-xs text-muted-foreground mt-1">Thử thay đổi bộ lọc hoặc đợi đánh giá từ khách hàng.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filtered.map((review) => (
                <Card key={review.id} className="p-1.5 bg-white/5 dark:bg-black/15 border border-white/10 dark:border-white/5 rounded-2xl shadow-md transition-all duration-300 hover:shadow-lg hover:border-primary/25 group flex flex-col justify-between">
                  <div className="p-4 rounded-[calc(1rem-2px)] bg-card/65 dark:bg-card/45 shadow-inner flex flex-col flex-1 h-full">
                    {/* Header: Avatar, Name, Stars, Date */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 ring-2 ring-primary/10">
                          <AvatarImage src={review.customerAvatar} alt={review.customerName} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                            {review.customerName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-extrabold text-sm text-foreground">{review.customerName}</h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <StarRow rating={review.rating} />
                            <span className="text-[10px] text-muted-foreground font-semibold">
                              {new Date(review.date).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Body: Comment text */}
                    <p className="text-sm leading-relaxed text-foreground/90 italic flex-grow mb-4 bg-secondary/10 dark:bg-neutral-800/10 p-3.5 rounded-xl border border-border/20">
                      "{review.comment}"
                    </p>

                    {review.image && (
                      <div className="mb-4 relative w-24 h-24 rounded-xl overflow-hidden border border-border/60 hover:border-primary/50 transition-all cursor-pointer group bg-muted flex items-center justify-center shadow-xs">
                        <Image
                          src={review.image}
                          alt="Review image"
                          fill
                          sizes="96px"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          onClick={() => setZoomedImage(review.image)}
                        />
                      </div>
                    )}

                    {/* Owner's response bubble if exists */}
                    {review.response ? (
                      <div className="mb-4 p-3.5 bg-primary/5 rounded-xl border border-primary/10 space-y-1.5 relative group/response animate-in fade-in duration-200">
                        <p className="text-[10px] font-extrabold text-primary uppercase tracking-wider">Phản hồi của bạn:</p>
                        <p className="text-xs text-foreground/90 leading-relaxed italic">"{review.response}"</p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic mb-4">Chưa có phản hồi từ cửa hàng</p>
                    )}

                    {/* Action footer */}
                    <div className="flex justify-between items-center pt-2 border-t border-border/20">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full text-xs font-bold text-destructive hover:bg-destructive/10 hover:text-destructive px-3 gap-1.5 cursor-pointer h-8"
                        onClick={() => handleDeleteReview(Number(review.id))}
                        disabled={isDeletingId === Number(review.id)}
                      >
                        {isDeletingId === Number(review.id) ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        Xóa đánh giá
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full text-xs font-bold border-primary/20 text-primary hover:bg-primary/5 px-4 gap-1.5 cursor-pointer h-8"
                        onClick={() => {
                          setRespondingTo(review);
                          setResponseText(review.response ?? "");
                        }}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        {review.response ? "Sửa phản hồi" : "Viết phản hồi"}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
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

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
      `}} />

      {zoomedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-black/40" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center text-xl transition-all border border-white/10 font-bold cursor-pointer"
            >
              ×
            </button>
            <div className="relative w-full h-full flex items-center justify-center min-w-[300px] min-h-[200px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={zoomedImage}
                alt="Zoomed review image"
                className="max-w-full max-h-[85vh] object-contain select-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
