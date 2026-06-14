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
  Minus 
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/lib/utils";

// Placeholder data (will be replaced with actual API calls)
const mockMerchantData = {
  id: "1",
  name: "Nhà hàng Sen Hồng",
  lat: 10.775,
  lng: 106.690,
  slogan: "Hương vị Việt Nam đích thực giữa lòng Sài Gòn.",
  imageUrl: "https://picsum.photos/seed/restaurant-sen-hong/1600/900",
  logoUrl: "https://picsum.photos/seed/sen-hong-logo/150/150",
  rating: 4.8,
  reviewCount: 1280,
  category: "Món Việt",
  address: "123 Đường Nam Kỳ Khởi Nghĩa, Quận 1, TP.HCM",
  phone: "028 123 4567",
  email: "senhong@example.com",
  openingHours: "Thứ 2 - Chủ nhật: 09:00 AM - 10:00 PM",
  description: "Nhà hàng Sen Hồng mang đến trải nghiệm ẩm thực Việt Nam truyền thống với không gian sang trọng và dịch vụ chuyên nghiệp. Chúng tôi tự hào với những món ăn được chế biến từ nguyên liệu tươi ngon nhất, mang đậm hương vị quê hương.",
  menuHighlights: [
    {
      id: "m1",
      name: "Phở Bò Đặc Biệt",
      price: "95.000đ",
      imageUrl: "https://picsum.photos/seed/pho-bo/400/300",
      description: "Tô phở đậm đà hương vị truyền thống, nước dùng hầm xương bò 12 tiếng, thịt bò tái và gân mềm."
    },
    {
      id: "m2",
      name: "Bún Chả Hà Nội",
      price: "80.000đ",
      imageUrl: "https://picsum.photos/seed/bun-cha/400/300",
      description: "Món bún chả trứ danh với chả nướng than hoa thơm lừng, bún tươi và rau sống thanh mát."
    },
    {
      id: "m3",
      name: "Gỏi Cuốn Tôm Thịt",
      price: "65.000đ",
      imageUrl: "https://picsum.photos/seed/goi-cuon/400/300",
      description: "Những chiếc gỏi cuốn tươi ngon với tôm, thịt, rau sống, chấm kèm nước mắm chua ngọt đặc biệt."
    },
    {
        id: "m4",
        name: "Cà phê sữa đá",
        price: "45.000đ",
        imageUrl: "https://picsum.photos/seed/cafe-sua-da/400/300",
        description: "Cà phê đen nguyên chất pha phin, kết hợp với sữa đặc, tạo nên hương vị béo ngậy, đậm đà."
    },
  ],
  galleryImages: [
    "https://picsum.photos/seed/restaurant-interior-1/1200/800",
    "https://picsum.photos/seed/restaurant-food-1/1200/800",
    "https://picsum.photos/seed/restaurant-exterior-1/1200/800",
    "https://picsum.photos/seed/restaurant-chef-1/1200/800",
    "https://picsum.photos/seed/restaurant-dessert-1/1200/800",
  ],
  reviews: [
    {
      id: "r1",
      user: "Nguyễn Thị Hoa",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
      rating: 5,
      comment: "Đồ ăn rất ngon, không gian đẹp và phục vụ tận tình. Chắc chắn sẽ quay lại!",
      date: "2026-05-20"
    },
    {
      id: "r2",
      user: "Trần Văn Đức",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100",
      rating: 4,
      comment: "Phở bò chuẩn vị, tuy nhiên quán hơi đông vào cuối tuần. Nên đặt bàn trước.",
      date: "2026-05-18"
    },
    {
      id: "r3",
      user: "Lê Thanh Ngân",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100",
      rating: 5,
      comment: "Món gỏi cuốn tươi ngon, thanh mát. Rất hợp cho những ngày hè nóng bức.",
      date: "2026-05-15"
    },
  ],
  promotions: [
    {
      id: "p1",
      title: "Giảm giá 10% cho hóa đơn trên 500.000đ",
      description: "Áp dụng cho tất cả các món ăn và đồ uống, từ Thứ 2 đến Thứ 6 hàng tuần."
    },
    {
      id: "p2",
      title: "Tặng tráng miệng khi đặt bàn trước",
      description: "Áp dụng cho nhóm từ 4 người trở lên, vui lòng thông báo khi đặt bàn."
    }
  ],
  fullMenu: [
    {
      id: "fm1",
      name: "Cơm tấm sườn bì chả",
      price: "70.000đ",
      imageUrl: "https://picsum.photos/seed/com-tam/400/300",
      description: "Cơm tấm với sườn nướng thơm lừng, bì, chả trứng hấp dẫn, ăn kèm dưa chua và nước mắm chua ngọt."
    },
    {
      id: "fm2",
      name: "Bánh xèo miền Tây",
      price: "85.000đ",
      imageUrl: "https://picsum.photos/seed/banh-xeo/400/300",
      description: "Bánh xèo giòn rụm với nhân tôm, thịt, giá đỗ, chấm nước mắm chua ngọt và rau sống."
    },
    {
      id: "fm3",
      name: "Gà nướng muối ớt",
      price: "150.000đ",
      imageUrl: "https://picsum.photos/seed/ga-nuong/400/300",
      description: "Gà ta nướng muối ớt cay nồng, da giòn thịt ngọt, ăn kèm cơm hoặc bún đều ngon."
    },
    {
        id: "fm4",
        name: "Lẩu thái chua cay",
        price: "250.000đ",
        imageUrl: "https://picsum.photos/seed/lau-thai/400/300",
        description: "Nồi lẩu thái đậm đà hương vị chua cay, hải sản tươi sống và rau nấm đa dạng."
    },
  ],
};

export default function MerchantPage() {
  const [isFullMenuOpen, setIsFullMenuOpen] = useState(false);
  const params = useParams();
  const { id } = params as { id: string };

  // In a real application, fetch data based on `id`
  const merchant = mockMerchantData; // Replace with actual fetch

  if (!merchant) {
    return <div className="min-h-screen flex items-center justify-center text-xl text-foreground">Không tìm thấy thương nhân.</div>;
  }

  return (
    <div className="min-h-screen bg-background font-sans select-none antialiased">
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
        <section className="relative rounded-[2.5rem] overflow-hidden min-h-[50vh] flex items-end p-6 md:p-12 shadow-xl animate-fade-in" style={{ backgroundImage: `url(${merchant.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="relative z-10 text-white space-y-4">
            <Badge className="bg-orange-500/80 text-white text-xs px-3 py-1 rounded-full uppercase tracking-wider font-bold shadow-sm backdrop-blur-sm">
              <Utensils className="w-3 h-3 mr-1" /> {merchant.category}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">
              {merchant.name}
            </h1>
            <p className="text-base text-white/90 leading-relaxed max-w-xl">
              {merchant.slogan}
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-extrabold shadow-inner">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>{merchant.rating} ({merchant.reviewCount} đánh giá)</span>
              </div>
              <Link href="#location" className="flex items-center gap-1.5 text-white/90 text-sm font-semibold hover:text-orange-300 transition-colors group">
                <MapPin className="w-4 h-4 text-orange-400" />
                <span className="group-hover:underline">{merchant.address.split(',')[0]}</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            <div className="flex gap-4 pt-4">
              <Button className="px-6 py-3 rounded-full text-sm font-bold bg-orange-500 text-white hover:bg-orange-600 transition-colors active:scale-95 group">
                Đặt hàng ngay
                <span className="ml-2 w-7 h-7 rounded-full bg-black/10 flex items-center justify-center group-hover:translate-x-1 group-hover:-translate-y-[1px] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
                  <ChevronRight className="w-4 h-4" />
                </span>
              </Button>
              <Button variant="outline" className="px-6 py-3 rounded-full text-sm font-bold border-white/30 text-white hover:bg-white/10 hover:text-white transition-colors active:scale-95 group">
                Đặt bàn
                <span className="ml-2 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-1 group-hover:-translate-y-[1px] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
                  <ChevronRight className="w-4 h-4 text-white" />
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
            <section className="py-12 animate-slide-up-slow">
              <Badge className="bg-primary/10 text-primary text-[10px] px-3 py-1 rounded-full uppercase tracking-[0.2em] font-medium mb-4">
                Về chúng tôi
              </Badge>
              <h2 className="text-3xl font-extrabold tracking-tight mb-6">Câu chuyện về {merchant.name}</h2>
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <p className="text-base text-foreground leading-relaxed md:max-w-[65ch]">
                  {merchant.description}
                </p>
                <div className="w-full md:w-1/2 flex-shrink-0">
                  <div className="p-1.5 bg-white/5 dark:bg-black/15 border border-white/10 dark:border-white/5 rounded-2xl shadow-lg backdrop-blur-sm">
                    <Image
                      src={merchant.logoUrl}
                      alt={`${merchant.name} Logo`}
                      width={300}
                      height={300}
                      className="rounded-[calc(1rem-2px)] object-cover shadow-inner"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Menu Highlights/Categories Section */}
            <section className="py-12 animate-slide-up-slow">
              <Badge className="bg-primary/10 text-primary text-[10px] px-3 py-1 rounded-full uppercase tracking-[0.2em] font-medium mb-4">
                Thực đơn
              </Badge>
              <h2 className="text-3xl font-extrabold tracking-tight mb-8">Các món ăn nổi bật</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {merchant.menuHighlights.map((item) => (
                  <Card key={item.id} className="p-1.5 bg-white/5 dark:bg-black/15 border border-white/10 dark:border-white/5 rounded-2xl shadow-lg backdrop-blur-sm">
                    <div className="p-3.5 rounded-[calc(1rem-2px)] bg-card/65 dark:bg-card/45 shadow-inner flex flex-col justify-between h-full">
                      <div className="flex items-center gap-4 mb-4">
                        <AspectRatio ratio={4 / 3} className="w-60 h-auto flex-shrink-0 overflow-hidden rounded-xl border border-border/20 shadow-xs">
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </AspectRatio>
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
              <Collapsible open={isFullMenuOpen} onOpenChange={setIsFullMenuOpen} className="w-full">
                <CollapsibleContent className="CollapsibleContent">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {merchant.fullMenu.map((item) => (
                      <Card key={item.id} className="p-1.5 bg-white/5 dark:bg-black/15 border border-white/10 dark:border-white/5 rounded-2xl shadow-lg backdrop-blur-sm">
                        <div className="p-3.5 rounded-[calc(1rem-2px)] bg-card/65 dark:bg-card/45 shadow-inner flex flex-col justify-between h-full">
                          <div className="flex items-center gap-4 mb-4">
                            <AspectRatio ratio={4 / 3} className="w-60 h-auto flex-shrink-0 overflow-hidden rounded-xl border border-border/20 shadow-xs">
                              <Image
                                src={item.imageUrl}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            </AspectRatio>
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
            </section>

            {/* Gallery / Visuals Section */}
            <section className="py-12 animate-slide-up-slow">
              <Badge className="bg-primary/10 text-primary text-[10px] px-3 py-1 rounded-full uppercase tracking-[0.2em] font-medium mb-4">
                Hình ảnh
              </Badge>
              <h2 className="text-3xl font-extrabold tracking-tight mb-8">Không gian và món ăn</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {merchant.galleryImages.map((src, index) => (
                  <div key={index} className="p-1.5 bg-white/5 dark:bg-black/15 border border-white/10 dark:border-white/5 rounded-xl shadow-md backdrop-blur-sm group overflow-hidden">
                    <AspectRatio ratio={4 / 3} className="rounded-[calc(0.75rem-2px)] overflow-hidden">
                      <Image
                        src={src}
                        alt={`Gallery image ${index + 1}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                      />
                    </AspectRatio>
                  </div>
                ))}
              </div>
            </section>

            {/* Customer Reviews / Testimonials Section */}
            <section className="py-12 animate-slide-up-slow">
              <Badge className="bg-primary/10 text-primary text-[10px] px-3 py-1 rounded-full uppercase tracking-[0.2em] font-medium mb-4">
                Đánh giá
              </Badge>
              <h2 className="text-3xl font-extrabold tracking-tight mb-8">Khách hàng nói gì về chúng tôi</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {merchant.reviews.map((review) => (
                  <Card key={review.id} className="p-1.5 bg-white/5 dark:bg-black/15 border border-white/10 dark:border-white/5 rounded-2xl shadow-lg backdrop-blur-sm">
                    <div className="p-4 rounded-[calc(1rem-2px)] bg-card/65 dark:bg-card/45 shadow-inner flex flex-col h-full">
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar className="w-10 h-10 ring-2 ring-primary/10">
                          <AvatarImage src={review.avatar} alt={review.user} />
                          <AvatarFallback>{review.user[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-extrabold text-sm text-foreground">{review.user}</h3>
                          <div className="flex items-center text-xs text-muted-foreground">
                            {[...Array(review.rating)].map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            ))}
                            {[...Array(5 - review.rating)].map((_, i) => (
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
              <div className="text-center mt-12">
                <Button variant="link" className="px-6 py-3 rounded-full text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors active:scale-95 group">
                  Đọc tất cả đánh giá
                  <span className="ml-2 w-7 h-7 rounded-full bg-orange-500/10 flex items-center justify-center group-hover:translate-x-1 group-hover:-translate-y-[1px] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
                    <ChevronRight className="w-4 h-4 text-orange-500" />
                  </span>
                </Button>
              </div>
            </section>

          </div>

          {/* Right Column - Location, Hours, Contact, Promotions */}
          <div className="lg:col-span-1 space-y-16">

            {/* Location & Contact Section */}
            <section id="location" className="py-12 animate-slide-up-slow">
              <Badge className="bg-primary/10 text-primary text-[10px] px-3 py-1 rounded-full uppercase tracking-[0.2em] font-medium mb-4">
                Liên hệ
              </Badge>
              <h2 className="text-3xl font-extrabold tracking-tight mb-8">Thông tin liên hệ</h2>
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
                  <div>
                    <h3 className="font-bold text-sm text-muted-foreground/80 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-500" /> Giờ hoạt động
                    </h3>
                    <p className="text-base text-foreground pl-6">{merchant.openingHours}</p>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-muted-foreground/80 mb-2 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-orange-500" /> Điện thoại
                    </h3>
                    <p className="text-base text-foreground pl-6">{merchant.phone}</p>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-muted-foreground/80 mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-orange-500" /> Email
                    </h3>
                    <p className="text-base text-foreground pl-6">{merchant.email}</p>
                  </div>
                  {/* Placeholder for MapView component */}
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
                  {merchant.promotions.map((promo) => (
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
