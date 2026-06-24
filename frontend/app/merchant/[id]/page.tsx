// Reading this as: Restaurant details page for consumers/diners, with a modern lifestyle-editorial language, leaning toward high-contrast sans-display + nested card shapes + warm accents.
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  MapPin, 
  Star, 
  ChevronRight, 
  Utensils, 
  Tag, 
  Camera, 
  MessageCircle, 
  Plus, 
  Minus,
  Navigation,
  Loader2,
  Trash2
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/header";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getMerchant, submitReview, deleteReview } from "@/lib/services/merchant";

const mapRawMerchantToDetails = (data: any) => {
  const menus = data.menus || [];
  const mappedMenus = menus.map((m: any) => ({
    id: String(m.id),
    name: m.dish_name,
    price: `${m.price.toLocaleString('vi-VN')}đ`,
    imageUrl: m.image_url || undefined,
    description: m.description || "",
    is_available: m.is_available ?? true,
  }));

  return {
    id: String(data.id),
    name: data.name,
    lat: data.location ? data.location.lat : data.latitude,
    lng: data.location ? data.location.lng : data.longitude,
    slogan: data.description || "",
    imageUrl: data.image_url || undefined,
    rating: data.rating_avg ?? 0,
    category: data.category || "",
    address: data.address || "Chưa cập nhật địa chỉ",
    description: data.description || "",
    ownerId: data.owner_id,
    menuHighlights: mappedMenus.slice(0, 4),
    fullMenu: mappedMenus.slice(4),
    reviews: (data.reviews || []).map((r: any) => ({
      id: String(r.id),
      user: r.customerName,
      avatar: r.customerAvatar || undefined,
      rating: r.rating,
      comment: r.comment,
      date: r.date.split("T")[0],
      response: r.response || undefined,
      reviewerId: r.reviewerId,
      image: r.reviewImage || undefined
    })),
    promotions: (data.campaigns || []).map((c: any) => ({
      id: String(c.id),
      title: c.title,
      description: c.description || ""
    }))
  };
};

export default function MerchantPage() {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const [isFullMenuOpen, setIsFullMenuOpen] = useState(false);
  const params = useParams();
  const { id } = params as { id: string };

  const [merchant, setMerchant] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isDeletingReviewId, setIsDeletingReviewId] = useState<number | null>(null);
  
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (selectedImagePreview) {
        URL.revokeObjectURL(selectedImagePreview);
      }
    };
  }, [selectedImagePreview]);

  const handleReviewDelete = async (reviewId: number) => {
    if (!token) return;
    
    if (!confirm("Bạn có chắc chắn muốn xóa đánh giá này không?")) {
      return;
    }

    setIsDeletingReviewId(reviewId);
    try {
      await deleteReview(reviewId, token);
      toast({
        title: "Đã xóa đánh giá thành công! 🗑️",
        description: "Đánh giá đã được gỡ bỏ khỏi quán ăn.",
      });

      const updatedData = await getMerchant(Number(id));
      setMerchant(mapRawMerchantToDetails(updatedData));
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Lỗi xóa đánh giá 🙁",
        description: err.message || "Không thể xóa đánh giá. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingReviewId(null);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError(null);
    if (!token) {
      toast({
        title: "Yêu cầu đăng nhập 🔒",
        description: "Vui lòng đăng nhập để gửi đánh giá của bạn.",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) {
      setReviewError("Vui lòng nhập nội dung đánh giá.");
      return;
    }

    setIsSubmittingReview(true);
    try {
      let uploadedImageUrl = undefined;
      
      if (selectedImageFile) {
        const presignedRes = await fetch("/api/content/presigned-url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            file_name: selectedImageFile.name,
            content_type: selectedImageFile.type,
            folder: "images"
          })
        });

        if (!presignedRes.ok) {
          throw new Error("Không thể khởi tạo link tải ảnh lên hệ thống.");
        }

        const { upload_url, public_url } = await presignedRes.json();

        const uploadRes = await fetch(upload_url, {
          method: "PUT",
          headers: {
            "Content-Type": selectedImageFile.type
          },
          body: selectedImageFile
        });

        if (!uploadRes.ok) {
          throw new Error("Không thể tải ảnh lên kho lưu trữ đám mây.");
        }

        uploadedImageUrl = public_url;
      }

      await submitReview(Number(id), token, {
        rating: newRating,
        comment: newComment,
        thumbnail_url: uploadedImageUrl,
      });

      toast({
        title: "Đã gửi đánh giá thành công! 🎉",
        description: "Cảm ơn bạn đã đóng góp ý kiến chia sẻ trải nghiệm.",
        variant: "default",
      });

      const updatedData = await getMerchant(Number(id));
      setMerchant(mapRawMerchantToDetails(updatedData));
      
      setNewComment("");
      setNewRating(5);
      setSelectedImageFile(null);
      if (selectedImagePreview) {
        URL.revokeObjectURL(selectedImagePreview);
        setSelectedImagePreview(null);
      }
    } catch (err: any) {
      console.error(err);
      setReviewError(err.message || "Gửi đánh giá thất bại.");
      toast({
        title: "Lỗi gửi đánh giá 🙁",
        description: err.message || "Không thể lưu đánh giá của bạn. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    const merchantId = Number(id);
    if (isNaN(merchantId)) {
      setError("Mã quán ăn không hợp lệ.");
      setIsLoading(false);
      return;
    }
    const fetchMerchantData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getMerchant(merchantId);
        setMerchant(mapRawMerchantToDetails(data));
      } catch (err: any) {
        console.error("Error fetching merchant:", err);
        setError(err.message || "Không thể tải thông tin quán ăn.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchMerchantData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary animate-pulse" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-muted-foreground animate-pulse">Đang tải thông tin quán ăn...</p>
        </div>
      </div>
    );
  }

  if (error || !merchant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <Utensils className="w-16 h-16 text-muted-foreground/60 mb-6" strokeWidth={1.5} />
        <h2 className="text-2xl font-black text-foreground">Không tìm thấy quán ăn</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          {error || "Quán ăn này không tồn tại hoặc đã bị gỡ bỏ khỏi hệ thống."}
        </p>
        <Link href="/" className="mt-8">
          <Button variant="default" className="rounded-full px-6 font-bold">
            Quay lại trang chủ
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans select-none antialiased">
      <Header maxWidthClassName="max-w-7xl px-4 md:px-8" showBack={true} />
      {/* Custom Spring Kinetics CSS injected via Style Block */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up-slow {
          animation: slideUp 0.8s cubic-bezier(0.32, 0.72, 0, 1) both;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.97) translateY(16px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.6s cubic-bezier(0.32, 0.72, 0, 1) both;
        }
      `}} />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Hero Section */}
        <section 
          className="relative rounded-[2.5rem] overflow-hidden min-h-[55vh] flex items-end p-8 md:p-16 shadow-xl animate-fade-in"
          style={merchant.imageUrl ? { backgroundImage: `url(${merchant.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: 'linear-gradient(135deg, #f97316 0%, #d97706 50%, #ea580c 100%)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          <div className="relative z-10 text-white space-y-5 max-w-4xl">
            {merchant.category && (
              <Badge className="bg-orange-500/90 text-white text-xs px-3.5 py-1 rounded-full uppercase tracking-wider font-extrabold shadow-md backdrop-blur-md border border-orange-400/20">
                <Utensils className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.5} /> {merchant.category}
              </Badge>
            )}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-none text-white">
              {merchant.name}
            </h1>
            {merchant.slogan && (
              <p className="text-lg md:text-xl text-white/85 leading-relaxed max-w-2xl font-medium">
                {merchant.slogan}
              </p>
            )}
            <div className="flex items-center gap-6 flex-wrap pt-2">
              <div className="flex items-center gap-2 text-white/80 text-sm font-semibold transition-colors">
                <MapPin className="w-4.5 h-4.5 text-orange-400" strokeWidth={1.5} />
                <span>{merchant.address}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 pt-4 flex-wrap">
              <Button 
                onClick={() => {
                  if (merchant.lat && merchant.lng) {
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${merchant.lat},${merchant.lng}`;
                    window.open(url, "_blank");
                  }
                }}
                className="px-6 py-3 h-12 rounded-full text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] group flex items-center shadow-md border border-orange-400/20"
              >
                <span>Chỉ đường</span>
                <span className="ml-2.5 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-sm">
                  <Navigation className="w-3.5 h-3.5 fill-white text-white" strokeWidth={1.5} />
                </span>
              </Button>

              <div className="flex items-center gap-2 px-5 py-3 h-12 rounded-full text-sm font-black bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/10 text-white shadow-sm transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/20 select-none">
                <Star className="w-4.5 h-4.5 text-amber-400 fill-amber-400" strokeWidth={1.5} />
                <span>{merchant.rating > 0 ? merchant.rating : "0"}</span>
                {merchant.reviews && merchant.reviews.length > 0 ? (
                  <span className="text-white/60 font-semibold text-xs border-l border-white/10 pl-2 ml-1">
                    {merchant.reviews.length} đánh giá
                  </span>
                ) : (
                  <span className="text-white/60 font-semibold text-xs border-l border-white/10 pl-2 ml-1">
                    Chưa có đánh giá
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Stacked Layout Sections */}
        <div className="mt-8 space-y-0">
          
          {/* About Section */}
          {merchant.description && (
            <section className="py-20 md:py-24 animate-slide-up-slow border-b border-border/40">
              <div className="max-w-3xl mx-auto text-center md:text-left">
                <span className="text-[10px] uppercase tracking-[0.2em] font-black text-orange-500 bg-orange-500/10 px-3.5 py-1 rounded-full mb-6 inline-block">
                  Câu chuyện thương hiệu
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-6 text-foreground">
                  Câu chuyện về {merchant.name}
                </h2>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-normal">
                  {merchant.description}
                </p>
              </div>
            </section>
          )}

          {/* Menu Section */}
          <section className="py-20 md:py-24 animate-slide-up-slow">
            <div className="w-full">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-12 text-foreground text-center md:text-left">
                Thực đơn nổi bật
              </h2>
              {merchant.menuHighlights.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-[2rem] bg-secondary/5 shadow-inner">
                  <Utensils className="w-10 h-10 text-muted-foreground/60 mb-3" strokeWidth={1.5} />
                  <p className="text-base font-semibold text-foreground">Thực đơn chưa cập nhật</p>
                  <p className="text-sm text-muted-foreground mt-1">Quán ăn này hiện chưa thêm món nào vào thực đơn.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {merchant.menuHighlights.map((item: any) => (
                    <div 
                      key={item.id} 
                      className="p-2 bg-orange-500/[0.03] dark:bg-white/[0.02] border border-orange-500/10 dark:border-white/5 rounded-[2rem] shadow-xs relative overflow-hidden group transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-md hover:border-orange-500/20"
                    >
                      {item.is_available === false && (
                        <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] rounded-[2rem] flex items-center justify-center z-10">
                          <Badge variant="secondary" className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/80 shadow-sm">
                            Tạm ngưng phục vụ
                          </Badge>
                        </div>
                      )}
                      <div className="rounded-[calc(2rem-0.5rem)] bg-card border border-border/40 overflow-hidden flex flex-col justify-between h-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
                        {item.imageUrl ? (
                          <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
                            />
                          </div>
                        ) : (
                          <div className="relative aspect-[4/3] w-full bg-orange-500/5 dark:bg-white/5 flex items-center justify-center text-muted-foreground">
                            <Utensils className="w-8 h-8 text-orange-500/40" strokeWidth={1.5} />
                          </div>
                        )}
                        
                        <div className="p-6 flex-1 flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start gap-3">
                              <h3 className="font-extrabold text-lg text-foreground tracking-tight leading-tight group-hover:text-primary transition-colors duration-300">
                                {item.name}
                              </h3>
                              <p className="font-black text-lg text-orange-600 dark:text-orange-400 shrink-0">
                                {item.price}
                              </p>
                            </div>
                            {item.description && (
                              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 font-normal">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {merchant.fullMenu.length > 0 && (
                <Collapsible open={isFullMenuOpen} onOpenChange={setIsFullMenuOpen} className="w-full mt-8">
                  <CollapsibleContent className="CollapsibleContent">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {merchant.fullMenu.map((item: any) => (
                        <div 
                          key={item.id} 
                          className="p-2 bg-orange-500/[0.03] dark:bg-white/[0.02] border border-orange-500/10 dark:border-white/5 rounded-[2rem] shadow-xs relative overflow-hidden group transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-md hover:border-orange-500/20"
                        >
                          {item.is_available === false && (
                            <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] rounded-[2rem] flex items-center justify-center z-10">
                              <Badge variant="secondary" className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/80 shadow-sm">
                                Tạm ngưng phục vụ
                              </Badge>
                            </div>
                          )}
                          <div className="rounded-[calc(2rem-0.5rem)] bg-card border border-border/40 overflow-hidden flex flex-col justify-between h-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
                            {item.imageUrl ? (
                              <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                                <Image
                                  src={item.imageUrl}
                                  alt={item.name}
                                  fill
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                  className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
                                />
                              </div>
                            ) : (
                              <div className="relative aspect-[4/3] w-full bg-orange-500/5 dark:bg-white/5 flex items-center justify-center text-muted-foreground">
                                <Utensils className="w-8 h-8 text-orange-500/40" strokeWidth={1.5} />
                              </div>
                            )}
                            
                            <div className="p-6 flex-1 flex flex-col justify-between">
                              <div className="space-y-3">
                                <div className="flex justify-between items-start gap-3">
                                  <h3 className="font-extrabold text-lg text-foreground tracking-tight leading-tight group-hover:text-primary transition-colors duration-300">
                                    {item.name}
                                  </h3>
                                  <p className="font-black text-lg text-orange-600 dark:text-orange-400 shrink-0">
                                    {item.price}
                                  </p>
                                </div>
                                {item.description && (
                                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 font-normal">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                  <CollapsibleTrigger asChild>
                    <div className="text-center mt-12">
                      <Button variant="outline" className="px-6 py-3 h-auto rounded-full text-sm font-bold border-orange-500/30 text-orange-500 hover:bg-orange-500 hover:text-white transition-colors active:scale-95 group">
                        {isFullMenuOpen ? "Thu gọn thực đơn" : "Xem toàn bộ thực đơn"}
                        <span className="ml-2 w-7 h-7 rounded-full bg-orange-500/10 flex items-center justify-center group-hover:translate-x-1 group-hover:-translate-y-[1px] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
                          {isFullMenuOpen ? <Minus className="w-4 h-4 text-orange-500 group-hover:text-white" strokeWidth={1.5} /> : <Plus className="w-4 h-4 text-orange-500 group-hover:text-white" strokeWidth={1.5} />}
                        </span>
                      </Button>
                    </div>
                  </CollapsibleTrigger>
                </Collapsible>
              )}
            </div>
          </section>

          {/* Promotions Section */}
          {merchant.promotions && merchant.promotions.length > 0 && (
            <section className="py-20 md:py-24 animate-slide-up-slow border-t border-border/40">
              <div className="w-full">
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-12 text-foreground text-center md:text-left">
                  Ưu đãi đặc biệt
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {merchant.promotions.map((promo: any) => (
                    <div 
                      key={promo.id} 
                      className="p-2 bg-orange-500/[0.02] border border-orange-500/10 dark:border-white/5 rounded-[2rem] shadow-xs relative overflow-hidden group transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-md hover:border-orange-500/20"
                    >
                      <div className="p-6 rounded-[calc(2rem-0.5rem)] bg-card border border-border/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] space-y-4">
                        <h3 className="font-extrabold text-lg text-primary flex items-center gap-2">
                          <Tag className="w-5 h-5 text-orange-500" strokeWidth={1.5} /> {promo.title}
                        </h3>
                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed font-normal">{promo.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Reviews Section */}
          <section className="py-20 md:py-24 animate-slide-up-slow border-t border-border/40">
            <div className="w-full">
              <div className="mb-12">
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground text-center md:text-left">
                  Đánh giá từ khách hàng
                </h2>
                <p className="text-base text-muted-foreground mt-2 font-normal text-center md:text-left">
                  Ý kiến và cảm nhận thực tế từ cộng đồng ẩm thực
                </p>
              </div>

              {/* Form Viết đánh giá */}
              {token ? (
                <div className="p-2 bg-secondary/10 dark:bg-white/[0.02] border border-border rounded-[2.5rem] mb-16 shadow-xs relative overflow-hidden">
                  <div className="p-8 rounded-[calc(2.5rem-0.5rem)] bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] space-y-6">
                    <h3 className="font-black text-xl text-foreground">Viết đánh giá của bạn</h3>
                    <form onSubmit={handleReviewSubmit} className="space-y-6">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground font-semibold">Xếp hạng:</span>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setNewRating(star)}
                              className="hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                            >
                              <Star
                                className={cn(
                                  "w-6 h-6 transition-colors",
                                  star <= newRating 
                                    ? "fill-amber-400 text-amber-400" 
                                    : "text-muted-foreground/45 hover:text-amber-300"
                                )}
                                strokeWidth={1.5}
                              />
                            </button>
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground font-semibold ml-2">
                          {newRating === 5 ? "Rất tốt" : newRating === 4 ? "Tốt" : newRating === 3 ? "Bình thường" : newRating === 2 ? "Không ngon" : "Rất tệ"}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Hãy chia sẻ trải nghiệm thực tế của bạn về đồ ăn, chất lượng phục vụ và không gian quán..."
                          rows={4}
                          className="w-full rounded-2xl p-4 text-sm bg-background border border-border focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-muted-foreground/50 resize-none font-medium"
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Label htmlFor="review-image" className="cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-secondary/30 hover:bg-secondary/50 border border-border rounded-xl text-xs font-extrabold text-foreground transition-all">
                            <Camera className="w-4 h-4 text-orange-500" strokeWidth={1.5} />
                            Đính kèm ảnh
                          </Label>
                          <input
                            id="review-image"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              setSelectedImageFile(file);
                              if (file) {
                                setSelectedImagePreview(URL.createObjectURL(file));
                              } else {
                                if (selectedImagePreview) URL.revokeObjectURL(selectedImagePreview);
                                setSelectedImagePreview(null);
                              }
                            }}
                          />
                          {selectedImageFile && (
                            <span className="text-xs text-muted-foreground font-semibold truncate max-w-[200px]">
                              {selectedImageFile.name}
                            </span>
                          )}
                        </div>

                        {selectedImagePreview && (
                          <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-border mt-2 group animate-in fade-in zoom-in-95 duration-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={selectedImagePreview}
                              alt="Selected preview"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedImageFile(null);
                                if (selectedImagePreview) URL.revokeObjectURL(selectedImagePreview);
                                setSelectedImagePreview(null);
                              }}
                              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white text-xs hover:bg-black/80 transition-all font-bold cursor-pointer"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>

                      {reviewError && (
                        <p className="text-xs text-destructive font-semibold">{reviewError}</p>
                      )}

                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          disabled={isSubmittingReview}
                          className="rounded-full px-6 py-2.5 h-auto font-bold bg-primary hover:bg-primary/95 text-white transition-all shadow-sm active:scale-[0.98] flex items-center gap-2"
                        >
                          {isSubmittingReview ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                              Đang gửi...
                            </>
                          ) : (
                            "Gửi đánh giá"
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="p-8 bg-secondary/10 border border-dashed border-border rounded-[2.5rem] mb-16 text-center max-w-2xl mx-auto">
                  <p className="text-base font-semibold text-foreground">Bạn muốn chia sẻ cảm nhận?</p>
                  <p className="text-sm text-muted-foreground mt-1 mb-6">Vui lòng đăng nhập tài khoản để gửi đánh giá và chia sẻ trải nghiệm.</p>
                  <Link href="/login">
                    <Button variant="outline" className="rounded-full px-6 py-2.5 h-auto text-xs font-bold border-primary text-primary hover:bg-primary/5">
                      Đăng nhập để viết đánh giá
                    </Button>
                  </Link>
                </div>
              )}

              {/* Danh sách đánh giá */}
              {merchant.reviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-[2rem] bg-secondary/5 shadow-inner">
                  <MessageCircle className="w-10 h-10 text-muted-foreground/60 mb-3" strokeWidth={1.5} />
                  <p className="text-base font-semibold text-foreground">Chưa có đánh giá nào</p>
                  <p className="text-sm text-muted-foreground mt-1">Hãy là người đầu tiên chia sẻ cảm nhận về món ăn và dịch vụ tại đây!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {merchant.reviews.map((review: any) => (
                    <div 
                      key={review.id} 
                      className="p-2 bg-secondary/5 dark:bg-white/[0.02] border border-border/60 dark:border-white/5 rounded-[2rem] shadow-xs relative overflow-hidden group transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-md"
                    >
                      <div className="p-6 rounded-[calc(2rem-0.5rem)] bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col h-full justify-between gap-4">
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-11 h-11 ring-2 ring-primary/5">
                                {review.avatar ? <AvatarImage src={review.avatar} alt={review.user} /> : null}
                                <AvatarFallback className="font-bold">{review.user?.[0] || '?'}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-extrabold text-sm text-foreground">{review.user}</h3>
                                <div className="flex items-center gap-0.5 text-xs text-muted-foreground mt-0.5">
                                  {[...Array(review.rating)].map((_, i) => (
                                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" strokeWidth={1.5} />
                                  ))}
                                  {[...Array(5 - review.rating)].map((_, i) => (
                                    <Star key={i} className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                                  ))}
                                  <span className="ml-2 font-medium text-[11px] text-muted-foreground/85">{review.date}</span>
                                </div>
                              </div>
                            </div>

                            {/* Nút xóa đánh giá */}
                            {user && (user.id === Number(review.reviewerId) || user.id === Number(merchant.ownerId) || user.role === 'admin') && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleReviewDelete(Number(review.id))}
                                disabled={isDeletingReviewId === Number(review.id)}
                                className="w-8 h-8 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0 cursor-pointer transition-colors"
                              >
                                {isDeletingReviewId === Number(review.id) ? (
                                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                                ) : (
                                  <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                                )}
                              </Button>
                            )}
                          </div>
                          <p className="text-sm italic leading-relaxed text-foreground/90 mt-4 font-normal">"{review.comment}"</p>
                        </div>

                        <div className="space-y-4">
                          {review.image && (
                            <div className="relative w-28 h-28 rounded-2xl overflow-hidden border border-border/60 hover:border-primary/50 transition-all cursor-pointer group bg-muted flex items-center justify-center shadow-xs">
                              <Image
                                src={review.image}
                                alt="Review image"
                                fill
                                sizes="112px"
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                onClick={() => setZoomedImage(review.image)}
                              />
                            </div>
                          )}

                          {review.response && (
                            <div className="p-4 bg-orange-500/[0.03] dark:bg-orange-500/[0.08] rounded-2xl border border-orange-500/10 space-y-1.5 animate-fade-in">
                              <p className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest">Phản hồi từ chủ quán</p>
                              <p className="text-xs text-foreground/90 leading-relaxed italic">"{review.response}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

        </div>
      </div>

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
