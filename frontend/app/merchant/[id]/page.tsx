"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  ChevronRight, 
  Utensils, 
  Clock, 
  Tag, 
  Camera, 
  MessageCircle, 
  Heart, 
  Bookmark, 
  Search, 
  Plus, 
  Minus,
  Navigation,
  Loader2
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/lib/utils";
import { Header } from "@/components/header";
import { getMerchant } from "@/lib/services/merchant";

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
    menuHighlights: mappedMenus.slice(0, 4),
    fullMenu: mappedMenus.slice(4),
    reviews: (data.reviews || []).map((r: any) => ({
      id: String(r.id),
      user: r.customerName,
      avatar: r.customerAvatar || undefined,
      rating: r.rating,
      comment: r.comment,
      date: r.date.split("T")[0]
    })),
    promotions: (data.campaigns || []).map((c: any) => ({
      id: String(c.id),
      title: c.title,
      description: c.description || ""
    }))
  };
};

export default function MerchantPage() {
  const [isFullMenuOpen, setIsFullMenuOpen] = useState(false);
  const params = useParams();
  const { id } = params as { id: string };

  const [merchant, setMerchant] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary animate-pulse" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Đang tải thông tin quán ăn...</p>
        </div>
      </div>
    );
  }

  if (error || !merchant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <Utensils className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold text-foreground">Không tìm thấy quán ăn</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          {error || "Quán ăn này không tồn tại hoặc đã bị gỡ bỏ khỏi hệ thống."}
        </p>
        <Link href="/">
          <Button variant="default" className="rounded-full px-6">
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
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up-slow {
          animation: slideUp 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
      `}} />

      <div className="max-w-7xl mx-auto px-0 md:px-4 py-8">
        {/* Hero Section */}
        <section 
          className="relative rounded-[2.5rem] overflow-hidden min-h-[50vh] flex items-end p-6 md:p-12 shadow-xl animate-fade-in"
          style={merchant.imageUrl ? { backgroundImage: `url(${merchant.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: 'linear-gradient(135deg, #f97316 0%, #d97706 50%, #ea580c 100%)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="relative z-10 text-white space-y-4">
            {merchant.category && (
              <Badge className="bg-orange-500/80 text-white text-xs px-3 py-1 rounded-full uppercase tracking-wider font-bold shadow-sm backdrop-blur-sm">
                <Utensils className="w-3 h-3 mr-1" /> {merchant.category}
              </Badge>
            )}
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">
              {merchant.name}
            </h1>
            {merchant.slogan && (
              <p className="text-base text-white/90 leading-relaxed max-w-xl">
                {merchant.slogan}
              </p>
            )}
            <div className="flex items-center gap-4 flex-wrap">
              {merchant.rating > 0 && (
                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-extrabold shadow-inner">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>{merchant.rating}{merchant.reviews.length > 0 ? ` (${merchant.reviews.length} đánh giá)` : ''}</span>
                </div>
              )}
              <Link href="#location" className="flex items-center gap-1.5 text-white/90 text-sm font-semibold hover:text-orange-300 transition-colors group">
                <MapPin className="w-4 h-4 text-orange-400" />
                <span className="group-hover:underline">{merchant.address.split(',')[0]}</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            <div className="flex gap-4 pt-4">
              <Button 
                onClick={() => {
                  if (merchant.lat && merchant.lng) {
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${merchant.lat},${merchant.lng}`;
                    window.open(url, "_blank");
                  }
                }}
                className="px-6 py-3 rounded-full text-sm font-bold bg-orange-500 text-white hover:bg-orange-600 transition-colors active:scale-95 group flex items-center"
              >
                <span>Chỉ đường</span>
                <span className="ml-2 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 group-hover:-translate-y-[1px] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
                  <Navigation className="w-3.5 h-3.5 fill-white text-white" />
                </span>
              </Button>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12 px-4 md:px-0">
          {/* Left Column - About, Menu, Gallery, Reviews */}
          <div className="lg:col-span-2 space-y-16">

            {/* About Section */}
            {merchant.description && (
              <section className="py-12 animate-slide-up-slow">
                <Badge className="bg-primary/10 text-primary text-[10px] px-3 py-1 rounded-full uppercase tracking-[0.2em] font-medium mb-4">
                  Về chúng tôi
                </Badge>
                <h2 className="text-3xl font-extrabold tracking-tight mb-6">Câu chuyện về {merchant.name}</h2>
                <p className="text-base text-foreground leading-relaxed md:max-w-[65ch]">
                  {merchant.description}
                </p>
              </section>
            )}

            {/* Menu Highlights/Categories Section */}
            <section className="py-12 animate-slide-up-slow">
              <Badge className="bg-primary/10 text-primary text-[10px] px-3 py-1 rounded-full uppercase tracking-[0.2em] font-medium mb-4">
                Thực đơn
              </Badge>
              <h2 className="text-3xl font-extrabold tracking-tight mb-8">Các món ăn nổi bật</h2>
              {merchant.menuHighlights.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-2xl bg-secondary/5 shadow-inner animate-fade-in">
                  <Utensils className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium text-foreground">Thực đơn chưa cập nhật</p>
                  <p className="text-xs text-muted-foreground mt-1">Quán ăn này hiện chưa thêm món nào vào thực đơn.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {merchant.menuHighlights.map((item: any) => (
                    <Card key={item.id} className="p-1.5 bg-white/5 dark:bg-black/15 border border-white/10 dark:border-white/5 rounded-2xl shadow-lg backdrop-blur-sm relative overflow-hidden group">
                      {item.is_available === false && (
                        <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] rounded-2xl flex items-center justify-center z-10">
                          <Badge variant="secondary" className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/80 shadow-sm">
                            Tạm ngưng phục vụ
                          </Badge>
                        </div>
                      )}
                      <div className="p-3.5 rounded-[calc(1rem-2px)] bg-card/65 dark:bg-card/45 shadow-inner flex flex-col justify-between h-full">
                        <div className="flex items-center gap-4 mb-4">
                          {item.imageUrl && (
                            <AspectRatio ratio={4 / 3} className="w-60 h-auto flex-shrink-0 overflow-hidden rounded-xl border border-border/20 shadow-xs">
                              <Image
                                src={item.imageUrl}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            </AspectRatio>
                          )}
                          <div className="flex-1 space-y-1">
                            <h3 className="font-extrabold text-base text-foreground">{item.name}</h3>
                            <p className="font-bold text-lg text-orange-500">{item.price}</p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                          {item.description}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              {merchant.fullMenu.length > 0 && (
                <Collapsible open={isFullMenuOpen} onOpenChange={setIsFullMenuOpen} className="w-full">
                  <CollapsibleContent className="CollapsibleContent">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      {merchant.fullMenu.map((item: any) => (
                        <Card key={item.id} className="p-1.5 bg-white/5 dark:bg-black/15 border border-white/10 dark:border-white/5 rounded-2xl shadow-lg backdrop-blur-sm relative overflow-hidden group">
                          {item.is_available === false && (
                            <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] rounded-2xl flex items-center justify-center z-10">
                              <Badge variant="secondary" className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/80 shadow-sm">
                                Tạm ngưng phục vụ
                              </Badge>
                            </div>
                          )}
                          <div className="p-3.5 rounded-[calc(1rem-2px)] bg-card/65 dark:bg-card/45 shadow-inner flex flex-col justify-between h-full">
                            <div className="flex items-center gap-4 mb-4">
                              {item.imageUrl && (
                                <AspectRatio ratio={4 / 3} className="w-60 h-auto flex-shrink-0 overflow-hidden rounded-xl border border-border/20 shadow-xs">
                                  <Image
                                    src={item.imageUrl}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                  />
                                </AspectRatio>
                              )}
                              <div className="flex-1 space-y-1">
                                <h3 className="font-extrabold text-base text-foreground">{item.name}</h3>
                                <p className="font-bold text-lg text-orange-500">{item.price}</p>
                              </div>
                            </div>
                            {item.description && (
                              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CollapsibleContent>
                  <CollapsibleTrigger asChild>
                    <div className="text-center mt-12">
                      <Button variant="outline" className="px-6 py-3 rounded-full text-sm font-bold border-orange-500/30 text-orange-500 hover:bg-orange-500 hover:text-white transition-colors active:scale-95 group">
                        {isFullMenuOpen ? "Thu gọn Menu" : "Xem toàn bộ Menu"}
                        <span className="ml-2 w-7 h-7 rounded-full bg-orange-500/10 flex items-center justify-center group-hover:translate-x-1 group-hover:-translate-y-[1px] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
                          {isFullMenuOpen ? <Minus className="w-4 h-4 text-orange-500 group-hover:text-white" /> : <Plus className="w-4 h-4 text-orange-500 group-hover:text-white" />}
                        </span>
                      </Button>
                    </div>
                  </CollapsibleTrigger>
                </Collapsible>
              )}
            </section>



            {/* Customer Reviews / Testimonials Section */}
            {merchant.reviews.length > 0 && (
              <section className="py-12 animate-slide-up-slow">
                <Badge className="bg-primary/10 text-primary text-[10px] px-3 py-1 rounded-full uppercase tracking-[0.2em] font-medium mb-4">
                  Đánh giá
                </Badge>
                <h2 className="text-3xl font-extrabold tracking-tight mb-8">Khách hàng nói gì về chúng tôi</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {merchant.reviews.map((review: any) => (
                    <Card key={review.id} className="p-1.5 bg-white/5 dark:bg-black/15 border border-white/10 dark:border-white/5 rounded-2xl shadow-lg backdrop-blur-sm">
                      <div className="p-4 rounded-[calc(1rem-2px)] bg-card/65 dark:bg-card/45 shadow-inner flex flex-col h-full">
                        <div className="flex items-center gap-3 mb-4">
                          <Avatar className="w-10 h-10 ring-2 ring-primary/10">
                            {review.avatar ? <AvatarImage src={review.avatar} alt={review.user} /> : null}
                            <AvatarFallback>{review.user?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-extrabold text-sm text-foreground">{review.user}</h3>
                            <div className="flex items-center text-xs text-muted-foreground">
                              {[...Array(review.rating)].map((_: any, i: number) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              ))}
                              {[...Array(5 - review.rating)].map((_: any, i: number) => (
                                <Star key={i} className="w-3.5 h-3.5 text-muted-foreground" />
                              ))}
                              <span className="ml-2">{review.date}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm italic leading-relaxed text-foreground flex-grow">"{review.comment}"</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}

          </div>

          {/* Right Column - Location, Promotions */}
          <div className="lg:col-span-1 space-y-16">

            {/* Location Section */}
            <section id="location" className="py-12 animate-slide-up-slow">
              <Badge className="bg-primary/10 text-primary text-[10px] px-3 py-1 rounded-full uppercase tracking-[0.2em] font-medium mb-4">
                Vị trí
              </Badge>
              <h2 className="text-3xl font-extrabold tracking-tight mb-8">Địa chỉ quán</h2>
              <div className="p-1.5 bg-white/5 dark:bg-black/15 border border-white/10 dark:border-white/5 rounded-2xl shadow-lg backdrop-blur-sm">
                <div className="p-4 rounded-[calc(1rem-2px)] bg-card/65 dark:bg-card/45 shadow-inner space-y-6">
                  <div>
                    <h3 className="font-bold text-sm text-muted-foreground/80 mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-orange-500" /> Địa chỉ
                    </h3>
                    <Link 
                      href={`/map?lat=${merchant.lat}&lng=${merchant.lng}&id=${merchant.id}`}
                      className="text-base text-foreground pl-6 hover:text-orange-500 hover:underline transition-colors block"
                    >
                      {merchant.address}
                    </Link>
                  </div>
                  <Link 
                    href={`/map?lat=${merchant.lat}&lng=${merchant.lng}&id=${merchant.id}`}
                    className="w-full h-64 bg-secondary/50 rounded-lg flex flex-col items-center justify-center text-muted-foreground/60 text-sm hover:bg-secondary/70 transition-colors group"
                  >
                    <MapPin className="w-8 h-8 text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-foreground group-hover:text-orange-500">Hiện trên bản đồ</span>
                  </Link>
                </div>
              </div>
            </section>

            {/* Promotions / Specials Section */}
            {merchant.promotions && merchant.promotions.length > 0 && (
              <section className="py-12 animate-slide-up-slow">
                <Badge className="bg-primary/10 text-primary text-[10px] px-3 py-1 rounded-full uppercase tracking-[0.2em] font-medium mb-4">
                  Ưu đãi
                </Badge>
                <h2 className="text-3xl font-extrabold tracking-tight mb-8">Khuyến mãi đặc biệt</h2>
                <div className="space-y-6">
                  {merchant.promotions.map((promo: any) => (
                    <Card key={promo.id} className="p-1.5 bg-white/5 dark:bg-black/15 border border-white/10 dark:border-white/5 rounded-2xl shadow-lg backdrop-blur-sm">
                      <div className="p-4 rounded-[calc(1rem-2px)] bg-primary/5 dark:bg-primary/10 shadow-inner space-y-2">
                        <h3 className="font-extrabold text-sm text-primary flex items-center gap-2">
                          <Tag className="w-4 h-4" /> {promo.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed mt-2">{promo.description}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}