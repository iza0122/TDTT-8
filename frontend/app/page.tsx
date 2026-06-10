"use client";

import { useState, useEffect, useRef } from "react";
import { formatRelativeTime } from "@/lib/time";
import { Header } from "@/components/header";
import { CategoryFilter } from "@/components/category-filter";
import { FoodPost } from "@/components/food-post";
import { userProfile } from "@/lib/data";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  Home, 
  Play, 
  MapPin, 
  User, 
  Bookmark, 
  Heart, 
  Settings, 
  Compass, 
  ChevronRight,
  TrendingUp,
  Star,
  Search,
  X,
  Moon,
  ArrowLeft,
  Camera,
  Smile,
  Send,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Trash2,
  UserCheck
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { CaptionText } from "@/components/caption-text";

interface Comment {
  id: string;
  userId?: number;
  user: {
    name: string;
    username: string;
    avatar: string;
  };
  content: string;
  createdAt: string;
  likes: number;
  replies?: Comment[];
}

export default function HomePage() {
  const { user, token } = useAuth();
  const displayName = user?.full_name || "Khách";
  const displayUsername = user?.email ? user.email.split('@')[0] : "guest";
  const displayAvatar = user?.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop";

  const [postsList, setPostsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [suggestedRestaurants, setSuggestedRestaurants] = useState<any[]>([]);
  const [showModalMenu, setShowModalMenu] = useState(false);
  const pendingLikes = useRef<Record<string, boolean>>({});

  const searchParams = useSearchParams();
  const feedType = searchParams?.get("feed") === "following" ? "following" : "all";

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const url = `/api/content/videos?post_type=image${feedType === "following" ? "&following_only=true" : ""}`;
        const response = await fetch(url, {
          headers: token ? { "Authorization": `Bearer ${token}` } : {}
        });
        if (response.ok) {
          const data = await response.json();
          let savedIds: string[] = [];
          if (typeof window !== "undefined") {
            const saved = JSON.parse(localStorage.getItem("saved_videos") || "[]");
            savedIds = saved.map((v: any) => String(v.id));
          }
          const mapped = data.items.map((item: any) => ({
            id: String(item.id),
            reviewerId: item.reviewer_id,
            user: {
              name: item.user?.full_name || "Người dùng",
              username: item.user?.username || `user_${item.reviewer_id}`,
              avatar: item.user?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
            },
            restaurant: {
              name: item.restaurant?.name || "Quán ăn ẩm thực",
              address: item.restaurant?.address || "",
              rating: item.restaurant?.rating_avg || 4.8,
              category: item.restaurant?.category || "Món ăn"
            },
            image: item.video_url,
            thumbnail: item.thumbnail_url,
            caption: item.description || item.title,
            likes: item.likes_count,
            comments: item.comments_count || 0,
            shares: item.shares_count || 0,
            reupFromUser: item.reup_from_user ? {
              id: item.reup_from_user.id,
              name: item.reup_from_user.full_name || "Người dùng",
              username: item.reup_from_user.username || `user_${item.reup_from_user.id}`,
              avatar: item.reup_from_user.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
            } : null,
            saves: Math.floor(Math.random() * 12) + 3,
            createdAt: formatRelativeTime(item.created_at),
            isLiked: item.is_liked || false,
            isSaved: savedIds.includes(String(item.id))
          }));
          setPostsList(mapped);
        }
      } catch (err) {
        console.error("Lỗi khi tải bài viết từ API:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [token, feedType]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await fetch("/api/interact/search?lat=10.775&lng=106.690&radius=15.0&limit=5");
        if (response.ok) {
          const data = await response.json();
          const mapped = data.map((item: any) => ({
            id: String(item.id),
            name: item.name,
            address: item.address,
            category: item.category,
            rating: item.rating_avg,
            image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=150"
          }));
          setSuggestedRestaurants(mapped);
        }
      } catch (err) {
        console.error("Lỗi khi tải gợi ý quán ăn:", err);
      }
    };

    fetchSuggestions();
  }, []);

  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [activeComments, setActiveComments] = useState<Comment[]>([]);
  const [isFetchingComments, setIsFetchingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [modalImageAspect, setModalImageAspect] = useState<number | null>(null);

  useEffect(() => {
    const postId = searchParams.get("post_id");
    if (postId) {
      setSelectedPostId(postId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!selectedPostId) {
      setActiveComments([]);
      return;
    }
    const fetchComments = async () => {
      setIsFetchingComments(true);
      try {
        const response = await fetch(`/api/interact/videos/${selectedPostId}/comments`);
        if (response.ok) {
          const data = await response.json();
          const mapped = data.map((c: any) => ({
            id: String(c.id),
            userId: c.user?.id,
            user: {
              name: c.user?.full_name || "Người dùng",
              username: c.user?.email ? c.user.email.split("@")[0] : `user_${c.user?.id || 'unknown'}`,
              avatar: c.user?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
            },
            content: c.content,
            createdAt: formatRelativeTime(c.created_at),
            likes: c.likes_count,
            replies: c.replies ? c.replies.map((r: any) => ({
              id: String(r.id),
              userId: r.user?.id,
              user: {
                name: r.user?.full_name || "Người dùng",
                username: r.user?.email ? r.user.email.split("@")[0] : `user_${r.user?.id || 'unknown'}`,
                avatar: r.user?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
              },
              content: r.content,
              createdAt: formatRelativeTime(r.created_at),
              likes: r.likes_count
            })) : []
          }));
          setActiveComments(mapped);
        }
      } catch (err) {
        console.error("Lỗi khi tải bình luận:", err);
      } finally {
        setIsFetchingComments(false);
      }
    };
    fetchComments();
  }, [selectedPostId]);

  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Live filter logic
  const filteredPosts = postsList.filter((post) => {
    // 1. Filter by category
    if (activeCategory !== "all") {
      const categoryId = activeCategory.toLowerCase(); // e.g. "pho", "bun", "com", "banh"
      const postCategory = post.restaurant.category.toLowerCase(); // e.g. "phở", "bún chả", "bánh mì"
      
      const categoryMap: { [key: string]: string } = {
        pho: "phở",
        bun: "bún",
        com: "cơm",
        banh: "bánh",
        cafe: "cà phê",
        tra: "trà sữa",
        lau: "lẩu"
      };
      
      const targetCategory = categoryMap[categoryId];
      if (targetCategory && !postCategory.includes(targetCategory)) {
        return false;
      }
    }

    // 2. Filter by search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      return (
        post.caption.toLowerCase().includes(query) ||
        post.restaurant.name.toLowerCase().includes(query) ||
        post.restaurant.category.toLowerCase().includes(query) ||
        post.user.name.toLowerCase().includes(query) ||
        post.user.username.toLowerCase().includes(query)
      );
    }

    return true;
  });

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

      {/* Outer Layout Container - Centered and Grid on Desktop */}
      <div className="max-w-7xl mx-auto px-0 md:px-4 lg:grid lg:grid-cols-12 lg:gap-8">
        
        {/* Left Sidebar - Desktop (Hidden on Mobile/Tablet) */}
        <aside className="hidden lg:flex flex-col col-span-3 sticky top-0 h-screen py-8 justify-between border-r border-border/40 bg-card/10 backdrop-blur-md pr-6">
          <div className="space-y-8">
            {/* Brand Logo */}
            <div className="px-4">
              <h1 className="text-2xl font-black bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent tracking-tight">
                FoodieGram
              </h1>
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60 mt-1 font-extrabold">Khám phá ẩm thực</p>
            </div>

            {/* Profile Summary Card - OUTER SHELL (Double-Bezel Architecture) */}
            <div className="mx-4 p-1 bg-white/5 dark:bg-black/15 border border-white/10 dark:border-white/5 rounded-2xl shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-101">
              {/* INNER CORE */}
              <div className="p-3.5 rounded-[calc(1rem-2px)] bg-card/65 dark:bg-card/45 shadow-inner">
                <Link href={user ? "/profile" : "/login"} className="flex items-center gap-3 group">
                  <Avatar className="w-10 h-10 ring-2 ring-primary/10 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-105">
                    <AvatarImage src={displayAvatar} alt={displayName} />
                    <AvatarFallback className="bg-primary/20 text-primary font-bold">{displayName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-sm text-foreground truncate group-hover:text-primary transition-colors duration-300">
                      {displayName}
                    </h3>
                    <p className="text-xs text-muted-foreground/60 truncate">@{displayUsername}</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Navigations Link List (Spring Kinetics) */}
            <nav className="space-y-1 px-2">
              <Link 
                href="/" 
                className={cn(
                  "flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.02] active:scale-[0.98]",
                  feedType === "all" 
                    ? "font-bold text-orange-500 bg-orange-500/10" 
                    : "font-semibold text-foreground hover:bg-secondary/60 hover:text-orange-500 group"
                )}
              >
                <Home className={cn("w-5 h-5", feedType === "all" ? "text-orange-500" : "text-muted-foreground group-hover:text-orange-500 transition-colors duration-300")} />
                <span>Trang chủ</span>
              </Link>
              <Link 
                href="/?feed=following" 
                className={cn(
                  "flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.02] active:scale-[0.98]",
                  feedType === "following" 
                    ? "font-bold text-orange-500 bg-orange-500/10" 
                    : "font-semibold text-foreground hover:bg-secondary/60 hover:text-orange-500 group"
                )}
              >
                <UserCheck className={cn("w-5 h-5", feedType === "following" ? "text-orange-500" : "text-muted-foreground group-hover:text-orange-500 transition-colors duration-300")} />
                <span>Đã follow</span>
              </Link>
              <Link href="/reels" className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-foreground hover:bg-secondary/60 hover:text-orange-500 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.02] active:scale-[0.98] group">
                <Play className="w-5 h-5 text-muted-foreground group-hover:text-orange-500 transition-colors duration-300" />
                <span>Reels quán ngon</span>
              </Link>
              <Link href="/create" className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-foreground hover:bg-secondary/60 hover:text-orange-500 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.02] active:scale-[0.98] group">
                <Camera className="w-5 h-5 text-muted-foreground group-hover:text-orange-500 transition-colors duration-300" />
                <span>Đăng bài review</span>
              </Link>
              <Link href="/map" className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-foreground hover:bg-secondary/60 hover:text-orange-500 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.02] active:scale-[0.98] group">
                <MapPin className="w-5 h-5 text-muted-foreground group-hover:text-orange-500 transition-colors duration-300" />
                <span>Bản đồ ẩm thực</span>
              </Link>
              <Link href="/profile" className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-foreground hover:bg-secondary/60 hover:text-orange-500 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.02] active:scale-[0.98] group">
                <User className="w-5 h-5 text-muted-foreground group-hover:text-orange-500 transition-colors duration-300" />
                <span>Hồ sơ cá nhân</span>
              </Link>
              <Link href="/profile" className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-foreground hover:bg-secondary/60 hover:text-orange-500 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.02] active:scale-[0.98] group">
                <Bookmark className="w-5 h-5 text-muted-foreground group-hover:text-orange-500 transition-colors duration-300" />
                <span>Bài viết đã lưu</span>
              </Link>
              <Link href="/profile" className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-foreground hover:bg-secondary/60 hover:text-orange-500 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.02] active:scale-[0.98] group">
                <Heart className="w-5 h-5 text-muted-foreground group-hover:text-orange-500 transition-colors duration-300" />
                <span>Quán ăn yêu thích</span>
              </Link>
            </nav>
          </div>

          <div className="px-4 space-y-4">
            <div className="flex items-center justify-center p-3 rounded-2xl bg-secondary/35 dark:bg-card/50 border border-border/40 shadow-inner">
              <ThemeToggle />
            </div>
            <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
              <Settings className="w-4 h-4" />
              <span>Cài đặt tài khoản</span>
            </Link>
          </div>
        </aside>

        {/* Center Column - Main Feed (Takes full width on mobile/tablet) */}
        <main className="col-span-12 lg:col-span-6 min-h-screen pb-8 lg:border-r lg:border-border/40">
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="lg:hidden">
            <Header />
          </div>
          
          {/* Search Bar - Awwwards Command Style */}
          <div className="bg-card border-b border-border/40 p-4">
            <div className="max-w-lg mx-auto relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/60 group-focus-within:text-orange-500 transition-colors duration-300" />
              <input
                type="text"
                placeholder="Tìm món ăn, nhà hàng, blogger..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-secondary/40 hover:bg-secondary/60 focus:bg-background text-foreground placeholder:text-muted-foreground/60 pl-10 pr-10 py-3 rounded-2xl border border-border/40 focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all duration-500 text-xs font-semibold"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground p-1 rounded-full hover:bg-muted transition-all active:scale-90"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Categories Filter */}
          <CategoryFilter activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
          
          {/* Posts Feed container */}
          <div className="max-w-lg mx-auto py-4 px-4 md:px-0">
            {isLoading ? (
              <div className="space-y-6">
                {[1, 2].map((i) => (
                  <div 
                    key={`skeleton-${i}`} 
                    className="bg-card/45 dark:bg-card/25 rounded-3xl border border-border/40 p-5 space-y-4 animate-pulse shadow-xs"
                  >
                    {/* Header Skeleton */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary/80 dark:bg-muted/30" />
                        <div className="space-y-1.5">
                          <div className="h-3 bg-secondary/80 dark:bg-muted/30 rounded-full w-24" />
                          <div className="h-2.5 bg-secondary/80 dark:bg-muted/30 rounded-full w-32" />
                        </div>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-secondary/80 dark:bg-muted/30" />
                    </div>

                    {/* Image Skeleton */}
                    <div className="relative aspect-square rounded-2xl bg-secondary/50 dark:bg-muted/20 border border-border/10" />

                    {/* Actions Skeleton */}
                    <div className="space-y-3.5 pt-2">
                      <div className="flex justify-between items-center">
                        <div className="flex gap-4">
                          <div className="w-14 h-5 bg-secondary/80 dark:bg-muted/30 rounded-full" />
                          <div className="w-14 h-5 bg-secondary/80 dark:bg-muted/30 rounded-full" />
                        </div>
                        <div className="w-6 h-6 bg-secondary/80 dark:bg-muted/30 rounded-full" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-secondary/80 dark:bg-muted/30 rounded-full w-4/5" />
                        <div className="h-3 bg-secondary/80 dark:bg-muted/30 rounded-full w-2/3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredPosts.length > 0 ? (
              filteredPosts.map((post, index) => (
                <FoodPost 
                  key={`post-${post.id}-${index}`} 
                  post={post} 
                  priority={index === 0} 
                  onPostClick={() => setSelectedPostId(post.id)}
                  onCommentClick={() => {
                    setSelectedPostId(post.id);
                    setTimeout(() => {
                      const inputEl = document.getElementById("detail-comment-input");
                      if (inputEl) inputEl.focus();
                    }, 150);
                  }}
                  onLikeToggle={(isLiked, likesCount) => {
                    setPostsList(prev => prev.map(p => {
                      if (p.id === post.id) {
                        return { ...p, isLiked, likes: likesCount };
                      }
                      return p;
                    }));
                  }}
                  onShareUpdate={(sharesCount) => {
                    setPostsList(prev => prev.map(p => {
                      if (p.id === post.id) {
                        return { ...p, shares: sharesCount };
                      }
                      return p;
                    }));
                  }}
                  onDelete={() => {
                    setPostsList(prev => prev.filter(p => p.id !== post.id));
                  }}
                />
              ))
            ) : (
              <div className="text-center py-16 px-4 bg-card/45 rounded-3xl border border-border/40 shadow-xs max-w-md mx-auto my-4 space-y-4">
                <div className="w-14 h-14 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto text-orange-500">
                  <Search className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-bold text-sm text-foreground">Không tìm thấy kết quả</h3>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Thử tìm kiếm với từ khóa khác hoặc thay đổi bộ lọc món ăn xem sao nhé!
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("all");
                  }}
                  className="text-xs font-bold rounded-full"
                >
                  Đặt lại bộ lọc
                </Button>
              </div>
            )}
          </div>
        </main>

        {/* Right Column - Explore/Suggestions Panel (Hidden on Mobile/Tablet) */}
        <aside className="hidden lg:block col-span-3 sticky top-0 h-screen py-8 pl-6 space-y-8 overflow-y-auto scrollbar-hide">
          {/* Suggested Restaurants (Double-Bezel Architecture) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-xs text-muted-foreground/60 uppercase tracking-wider flex items-center gap-2">
                <Compass className="w-4 h-4 text-orange-500" />
                Quán ngon gợi ý
              </h3>
              <Link href="/map" className="text-xs font-extrabold text-orange-500 hover:underline flex items-center transition-all">
                Xem hết <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3.5">
              {suggestedRestaurants.slice(0, 3).map((res) => (
                <Link 
                  href="/map" 
                  key={res.id} 
                  className="block p-1 bg-white/5 dark:bg-black/15 border border-white/10 dark:border-white/5 rounded-2xl shadow-md backdrop-blur-md transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] group"
                >
                  {/* INNER CORE (Double-Bezel) */}
                  <div className="p-2.5 rounded-[calc(1rem-2px)] bg-card/65 dark:bg-card/45 flex gap-3 shadow-inner">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-border/20 shadow-xs">
                      <Avatar className="w-12 h-12 rounded-xl">
                        <AvatarImage src={res.image} alt={res.name} className="object-cover transition-transform duration-500 group-hover:scale-108" />
                        <AvatarFallback>{res.name[0]}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                      <div>
                        <h4 className="font-extrabold text-xs text-foreground group-hover:text-orange-500 transition-colors truncate">
                          {res.name}
                        </h4>
                        <p className="text-[9px] text-muted-foreground/60 truncate mt-0.5">{res.address}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-0.5 bg-orange-500/10 px-1.5 py-0.5 rounded text-[8px] font-extrabold text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <span>{res.rating}</span>
                        </div>
                        <span className="text-[9px] text-muted-foreground/60 font-semibold">{res.category}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Suggested food bloggers */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-xs text-muted-foreground/60 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                Blogger nổi bật
              </h3>
            </div>

            <div className="space-y-3.5">
              {postsList.slice(0, 3).map((post) => (
                <div key={post.id} className="flex items-center justify-between gap-3 p-1 rounded-xl">
                  <Link href={post.reviewerId ? `/profile/${post.reviewerId}` : "/profile"} className="flex items-center gap-2.5 min-w-0 group">
                    <Avatar className="w-8 h-8 ring-2 ring-primary/10 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-105">
                      <AvatarImage src={post.user.avatar} alt={post.user.name} />
                      <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">{post.user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs text-foreground truncate group-hover:text-orange-500 transition-colors">
                        {post.user.name}
                      </h4>
                      <p className="text-[9px] text-muted-foreground/60 truncate">@{post.user.username}</p>
                    </div>
                  </Link>
                  <Button size="sm" variant="ghost" className="h-7 text-xs font-extrabold text-orange-500 hover:text-white hover:bg-orange-500 px-3 rounded-full border border-orange-500/20 hover:scale-105 active:scale-95 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer">
                    Theo dõi
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer branding and links */}
          <div className="pt-6 border-t border-border/40 px-1 text-[10px] text-muted-foreground/50 space-y-3">
            <p className="font-medium">© 2026 FoodieGram. All rights reserved.</p>
            <div className="flex flex-wrap gap-x-2 gap-y-1 font-semibold text-muted-foreground/60">
              <a href="#" className="hover:text-foreground transition-colors">Về chúng tôi</a>
              <span>•</span>
              <a href="#" className="hover:text-foreground transition-colors">Hỗ trợ</a>
              <span>•</span>
              <a href="#" className="hover:text-foreground transition-colors">Chính sách</a>
              <span>•</span>
              <a href="#" className="hover:text-foreground transition-colors">Điều khoản</a>
            </div>
          </div>
        </aside>

      </div>

      {/* Modal/Pop-up post detail - OUTER SHELL (Double-Bezel Glassmorphism Modal) */}
      {selectedPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-350 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
          {/* Backdrop close */}
          <div className="absolute inset-0 cursor-pointer" onClick={() => {
            setSelectedPostId(null);
            setReplyingTo(null);
            setNewCommentText("");
            setModalImageAspect(null);
          }} />

          {/* Modal Container - Double-Bezel Glass Layer with Cinematic Warm Mesh Backdrop */}
          <div className="relative w-full max-w-xl h-[85vh] z-10 p-2 bg-gradient-to-tr from-amber-500/10 via-white/15 to-orange-500/10 dark:from-amber-950/20 dark:via-black/40 dark:to-orange-950/20 border border-white/30 dark:border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.55)] rounded-[2.5rem] backdrop-blur-3xl flex flex-col ease-[cubic-bezier(0.34,1.56,0.64,1)] animate-in fade-in zoom-in-95 duration-300">
            {/* INNER CORE - Premium Warm Cream (Light) & Obsidian Charcoal (Dark) Bezel */}
            <div className="relative flex flex-col w-full h-full rounded-[calc(2.5rem-8px)] bg-[#FAF9F6]/98 dark:bg-[#0A0A0A]/95 overflow-hidden border border-white/5 shadow-inner">
              {/* Subtle ambient premium spotlight halos */}
              <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] bg-gradient-to-br from-orange-500/8 to-amber-500/0 rounded-full blur-3xl pointer-events-none select-none dark:from-orange-500/4" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-gradient-to-tr from-pink-500/4 to-rose-500/0 rounded-full blur-3xl pointer-events-none select-none dark:from-rose-500/4" />
              
              {/* Close Button */}
              <button 
                onClick={() => {
                  setSelectedPostId(null);
                  setReplyingTo(null);
                  setNewCommentText("");
                  setModalImageAspect(null);
                }}
                className="absolute top-5 right-5 z-35 p-2 rounded-full bg-black/60 text-white hover:bg-orange-500 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer shadow-md border border-white/10"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>

              {(() => {
                const activePost = postsList.find(p => p.id === selectedPostId);
                if (!activePost) return null;

                const isLiked = activePost.isLiked;
                const isSaved = activePost.isSaved;

                const handleLikeDetail = async () => {
                  if (!token || pendingLikes.current[activePost.id]) return;
                  try {
                    pendingLikes.current[activePost.id] = true;
                    setPostsList(prev => prev.map(p => {
                      if (p.id === activePost.id) {
                        return {
                          ...p,
                          isLiked: !p.isLiked,
                          likes: p.isLiked ? p.likes - 1 : p.likes + 1
                        };
                      }
                      return p;
                    }));
                    
                    const res = await fetch(`/api/interact/videos/${activePost.id}/like`, {
                      method: "POST",
                      headers: {
                        "Authorization": `Bearer ${token}`
                      }
                    });
                    if (res.ok) {
                      const data = await res.json();
                      setPostsList(prev => prev.map(p => {
                        if (p.id === activePost.id) {
                          return {
                            ...p,
                            likes: data.likes_count,
                            isLiked: data.liked
                          };
                        }
                        return p;
                      }));
                    }
                  } catch (err) {
                    console.error("Lỗi khi thả tim bài viết:", err);
                  } finally {
                    pendingLikes.current[activePost.id] = false;
                  }
                };

                const handleSaveDetail = () => {
                  const nextSaved = !activePost.isSaved;
                  setPostsList(prev => prev.map(p => {
                    if (p.id === activePost.id) {
                      return { ...p, isSaved: nextSaved };
                    }
                    return p;
                  }));
                  if (typeof window !== "undefined") {
                    let saved = JSON.parse(localStorage.getItem("saved_videos") || "[]");
                    if (nextSaved) {
                      const videoToSave = {
                        id: activePost.id,
                        title: activePost.caption || "",
                        thumbnail_url: activePost.thumbnail || activePost.image,
                        likes_count: activePost.likes,
                        post_type: (activePost.image.endsWith(".mp4") || activePost.image.includes("video") || activePost.image.includes("mixkit.co")) ? "video" : "image",
                        video_url: activePost.image,
                        description: activePost.caption
                      };
                      if (!saved.some((v: any) => String(v.id) === String(activePost.id))) {
                        saved.push(videoToSave);
                      }
                    } else {
                      saved = saved.filter((v: any) => String(v.id) !== String(activePost.id));
                    }
                    localStorage.setItem("saved_videos", JSON.stringify(saved));
                  }
                };

                const handleSendComment = async (e?: React.FormEvent) => {
                  if (e) e.preventDefault();
                  if (!newCommentText.trim()) return;

                  try {
                    const response = await fetch(`/api/interact/videos/${activePost.id}/comments`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        content: newCommentText.trim(),
                        parent_id: replyingTo ? Number(replyingTo.id) : null
                      })
                    });

                    if (response.ok) {
                      const c = await response.json();
                      const newCommentObj: Comment = {
                        id: String(c.id),
                        userId: user?.id,
                        user: {
                          name: user?.full_name || displayName,
                          username: user?.email ? user.email.split("@")[0] : displayUsername,
                          avatar: user?.avatar_url || displayAvatar,
                        },
                        content: c.content,
                        createdAt: "Vừa xong",
                        likes: 0,
                        replies: []
                      };

                      if (replyingTo) {
                        setActiveComments(prev => prev.map(item => {
                          if (item.id === replyingTo.id) {
                            return {
                              ...item,
                              replies: [...(item.replies || []), newCommentObj]
                            };
                          }
                          return item;
                        }));
                        setReplyingTo(null);
                      } else {
                        setActiveComments(prev => [...prev, newCommentObj]);
                      }

                      setPostsList(prev => prev.map(p => {
                        if (p.id === activePost.id) {
                          return { ...p, comments: p.comments + 1 };
                        }
                        return p;
                      }));
                    }
                  } catch (err) {
                    console.error("Lỗi khi gửi bình luận:", err);
                  }

                  setNewCommentText("");
                };

                const renderComment = (comment: Comment, isReply = false) => {
                  return (
                    <div key={comment.id} className={cn("flex gap-3", isReply ? "mt-3.5 pl-6 border-l border-neutral-300/60 dark:border-white/10 md:pl-8 ml-3.5" : "mt-4.5")}>
                      <Avatar className="w-7 h-7 flex-shrink-0 ring-1 ring-orange-500/10 dark:ring-white/10 hover:scale-105 transition-transform duration-300">
                        <AvatarImage src={comment.user.avatar} alt={comment.user.name} />
                        <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-bold">{comment.user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        {/* Premium Glass Comment chat bubbles with soft highlights */}
                        <div className="bg-[#F3F2EB]/85 dark:bg-[#121212]/60 border border-neutral-200/30 dark:border-white/5 rounded-2xl px-4 py-2.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:border-neutral-300 dark:hover:border-white/10 transition-all duration-300">
                          <p className="text-[10px] font-extrabold text-foreground flex items-center gap-1.5 flex-wrap">
                            <span>{comment.user.name}</span>
                            <span className="text-[9px] text-muted-foreground/60 font-medium">
                              @{comment.user.username}
                            </span>
                          </p>
                          <p className="text-xs text-foreground mt-0.5 leading-relaxed font-medium">
                            {comment.content}
                          </p>
                        </div>
                        
                        {/* Comment actions with custom premium emoji controls */}
                        <div className="flex items-center gap-2 mt-1 px-1 text-[9px] text-muted-foreground/75 font-bold select-none flex-wrap">
                          <span className="font-medium text-muted-foreground/45 mr-1">{comment.createdAt}</span>
                          
                          <button 
                            onClick={async () => {
                              const isLiked = !!comment.isLiked;
                              const nextLiked = !isLiked;
                              const nextLikes = nextLiked ? comment.likes + 1 : Math.max(0, comment.likes - 1);
                              
                              // Optimistic update
                              setActiveComments(prev => {
                                const updateLike = (cList: Comment[]): Comment[] => {
                                  return cList.map(c => {
                                    if (c.id === comment.id) {
                                      return { ...c, isLiked: nextLiked, likes: nextLikes };
                                    }
                                    if (c.replies && c.replies.length > 0) {
                                      return { ...c, replies: updateLike(c.replies) };
                                    }
                                    return c;
                                  });
                                };
                                return updateLike(prev);
                              });

                              try {
                                const response = await fetch(`/api/interact/comments/${comment.id}/like`, {
                                  method: "POST",
                                  headers: {
                                    "Authorization": `Bearer ${token}`
                                  }
                                });
                                if (response.ok) {
                                  const data = await response.json();
                                  setActiveComments(prev => {
                                    const updateLike = (cList: Comment[]): Comment[] => {
                                      return cList.map(c => {
                                        if (c.id === comment.id) {
                                          return { ...c, isLiked: data.liked, likes: data.likes_count };
                                        }
                                        if (c.replies && c.replies.length > 0) {
                                          return { ...c, replies: updateLike(c.replies) };
                                        }
                                        return c;
                                      });
                                    };
                                    return updateLike(prev);
                                  });
                                } else {
                                  // Rollback on error
                                  setActiveComments(prev => {
                                    const updateLike = (cList: Comment[]): Comment[] => {
                                      return cList.map(c => {
                                        if (c.id === comment.id) {
                                          return { ...c, isLiked: isLiked, likes: comment.likes };
                                        }
                                        if (c.replies && c.replies.length > 0) {
                                          return { ...c, replies: updateLike(c.replies) };
                                        }
                                        return c;
                                      });
                                    };
                                    return updateLike(prev);
                                  });
                                }
                              } catch (err) {
                                console.error("Lỗi khi thích bình luận:", err);
                                // Rollback on network error
                                setActiveComments(prev => {
                                  const updateLike = (cList: Comment[]): Comment[] => {
                                    return cList.map(c => {
                                      if (c.id === comment.id) {
                                        return { ...c, isLiked: isLiked, likes: comment.likes };
                                      }
                                      if (c.replies && c.replies.length > 0) {
                                        return { ...c, replies: updateLike(c.replies) };
                                      }
                                      return c;
                                    });
                                  };
                                  return updateLike(prev);
                                });
                              }
                            }}
                            className="hover:text-red-500 hover:bg-red-500/5 px-2 py-0.5 rounded-md transition-all duration-300 flex items-center gap-1 cursor-pointer"
                          >
                            <span>{comment.isLiked ? "❤️" : (comment.likes > 0 && comment.isLiked !== false ? "❤️" : "🤍")} Thích</span>
                            {comment.likes > 0 && <span className="text-[8px] bg-red-500/10 px-1 rounded-sm text-red-500 font-extrabold">{comment.likes}</span>}
                          </button>
                          
                          <button 
                            onClick={() => setReplyingTo(comment)}
                            className="hover:text-orange-500 hover:bg-orange-500/5 px-2 py-0.5 rounded-md transition-all duration-300 flex items-center gap-1 cursor-pointer"
                          >
                            <span>💬 Phản hồi</span>
                          </button>
                          
                          {user && (user.id === Number(comment.userId) || user.role === "admin") && (
                            <button
                              onClick={async () => {
                                if (!confirm("Bạn có chắc chắn muốn xóa bình luận này không?")) return;
                                
                                const originalComments = [...activeComments];
                                
                                // Optimistic delete from screen
                                setActiveComments(prev => {
                                  const removeComment = (cList: Comment[]): Comment[] => {
                                    return cList
                                      .filter(c => c.id !== comment.id)
                                      .map(c => {
                                        if (c.replies && c.replies.length > 0) {
                                          return { ...c, replies: removeComment(c.replies) };
                                        }
                                        return c;
                                      });
                                  };
                                  return removeComment(prev);
                                });
                                
                                // Optimistic decrement count
                                setPostsList(prev => prev.map(p => {
                                  if (p.id === activePost.id) {
                                    return { ...p, comments: Math.max(0, p.comments - 1) };
                                  }
                                  return p;
                                }));

                                try {
                                  const response = await fetch(`/api/interact/comments/${comment.id}`, {
                                    method: "DELETE",
                                    headers: {
                                      "Authorization": `Bearer ${token}`
                                    }
                                  });
                                  if (!response.ok) {
                                    // Rollback on API error
                                    setActiveComments(originalComments);
                                    setPostsList(prev => prev.map(p => {
                                      if (p.id === activePost.id) {
                                        return { ...p, comments: p.comments + 1 };
                                      }
                                      return p;
                                    }));
                                    const errData = await response.json();
                                    alert(errData.detail || "Không thể xóa bình luận.");
                                  }
                                } catch (err) {
                                  console.error("Lỗi khi xóa bình luận:", err);
                                  // Rollback on network error
                                  setActiveComments(originalComments);
                                  setPostsList(prev => prev.map(p => {
                                    if (p.id === activePost.id) {
                                      return { ...p, comments: p.comments + 1 };
                                    }
                                    return p;
                                  }));
                                }
                              }}
                              className="hover:text-red-500 hover:bg-red-500/5 px-2 py-0.5 rounded-md transition-all duration-300 flex items-center gap-1 cursor-pointer"
                            >
                              <span>🗑️ Xóa</span>
                            </button>
                          )}
                        </div>
                        
                        {/* Child replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="space-y-1">
                            {comment.replies.map(reply => renderComment(reply, true))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                };

                return (
                  <>
                    {/* Scrollable Modal Body */}
                    <div className="flex-1 overflow-y-auto p-4.5 space-y-4 scrollbar-hide">
                      {/* Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-border/30 relative">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9 ring-2 ring-primary/20">
                            <AvatarImage src={activePost.user.avatar} alt={activePost.user.name} />
                            <AvatarFallback>{activePost.user.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs text-muted-foreground/75 font-semibold">@{activePost.user.username}</p>
                            <div className="flex items-center gap-1 text-[13px] font-extrabold text-foreground mt-0.5 hover:text-orange-500 transition-colors cursor-pointer">
                              <MapPin className="w-3 h-3 text-orange-500 fill-orange-500/15" />
                              <span>{activePost.restaurant.name}</span>
                            </div>
                          </div>
                        </div>

                        {user && (user.id === activePost.reviewerId || user.role === "admin") && (
                          <div className="relative mr-8">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="rounded-full hover:bg-secondary/80"
                              onClick={() => setShowModalMenu(!showModalMenu)}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                            
                            {showModalMenu && (
                              <>
                                <div 
                                  className="fixed inset-0 z-35" 
                                  onClick={() => setShowModalMenu(false)}
                                />
                                <div className="absolute right-0 mt-1 w-36 bg-card border border-border/80 rounded-xl shadow-lg py-1.5 z-45 animate-in fade-in slide-in-from-top-1 duration-150">
                                  <button
                                    onClick={async () => {
                                      setShowModalMenu(false);
                                      if (!confirm("Bạn có chắc chắn muốn xóa bài viết này không?")) return;
                                      try {
                                        const response = await fetch(`/api/content/videos/${activePost.id}`, {
                                          method: "DELETE",
                                          headers: {
                                            "Authorization": `Bearer ${token}`
                                          }
                                        });
                                        if (response.ok) {
                                          setSelectedPostId(null);
                                          setPostsList(prev => prev.filter(p => p.id !== activePost.id));
                                        } else {
                                          const errData = await response.json();
                                          alert(errData.detail || "Không thể xóa bài viết.");
                                        }
                                      } catch (err) {
                                        console.error("Lỗi khi xóa bài viết:", err);
                                      }
                                    }}
                                    className="w-full text-left px-3.5 py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 transition-colors flex items-center gap-2 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Xóa bài viết</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Cinematic dynamic aspect ratio photo overlay backdrop */}
                      <div 
                        className="relative w-full rounded-2xl overflow-hidden shadow-md border border-border/30 bg-black flex items-center justify-center transition-all duration-300"
                        style={{ 
                          aspectRatio: modalImageAspect ? `${modalImageAspect}` : '1 / 1',
                          maxHeight: '55vh'
                        }}
                      >
                        {/* Blurred ambient backdrop */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40 select-none">
                          <Image
                            src={
                              (activePost.image.endsWith(".mp4") || activePost.image.includes("video") || activePost.image.includes("mixkit.co"))
                                ? (activePost.thumbnail || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400")
                                : activePost.image
                            }
                            alt=""
                            fill
                            className="object-cover blur-2xl scale-110"
                            sizes="100px"
                          />
                        </div>

                        {/* Foreground uncropped image/video */}
                        {(activePost.image.endsWith(".mp4") || activePost.image.includes("video") || activePost.image.includes("mixkit.co")) ? (
                          <video
                            src={activePost.image}
                            poster={activePost.thumbnail}
                            className="relative z-10 w-full h-full object-contain animate-fade-in"
                            controls
                            playsInline
                            loop
                            muted
                            onLoadedMetadata={(e) => {
                              const vid = e.target as HTMLVideoElement;
                              if (vid.videoWidth && vid.videoHeight) {
                                setModalImageAspect(vid.videoWidth / vid.videoHeight);
                              }
                            }}
                          />
                        ) : (
                          <Image
                            src={activePost.image}
                            alt={activePost.caption}
                            fill
                            className="object-contain animate-fade-in"
                            sizes="(max-width: 576px) 100vw, 576px"
                            priority
                            onLoad={(e) => {
                              const img = e.target as HTMLImageElement;
                              if (img.naturalWidth && img.naturalHeight) {
                                setModalImageAspect(img.naturalWidth / img.naturalHeight);
                              }
                            }}
                          />
                        )}
                      </div>

                      {/* Caption & Time */}
                      <div className="space-y-1.5 px-0.5">
                        <CaptionText
                          username={activePost.user.username}
                          caption={activePost.caption}
                          className="text-xs text-foreground leading-relaxed font-semibold"
                        />
                        <p className="text-[9px] text-muted-foreground/50 tracking-wider font-extrabold uppercase">{activePost.createdAt}</p>
                      </div>

                      {/* Divider line */}
                      <hr className="border-border/30" />

                      {/* Action Bar */}
                      <div className="flex items-center justify-between py-1 bg-secondary/20 dark:bg-muted/10 rounded-xl px-2.5 shadow-xs border border-white/5">
                        <button
                          onClick={handleLikeDetail}
                          className={cn(
                            "flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[10px] font-extrabold rounded-lg transition-all active:scale-95 duration-300 cursor-pointer ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                            isLiked 
                              ? "text-red-500 bg-red-500/10 shadow-xs" 
                              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                          )}
                        >
                          <Heart className={cn("w-3.5 h-3.5 transition-all duration-300", isLiked ? "text-red-500 fill-red-500 scale-110" : "text-muted-foreground")} />
                          <span>Thèm ({activePost.likes})</span>
                        </button>

                        <button
                          onClick={() => {
                            const inputEl = document.getElementById("detail-comment-input");
                            if (inputEl) inputEl.focus();
                          }}
                          className="flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[10px] font-extrabold text-muted-foreground hover:bg-secondary hover:text-foreground rounded-lg transition-all active:scale-95 duration-300 cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Bình luận ({activeComments.length})</span>
                        </button>

                        <button
                          onClick={handleSaveDetail}
                          className={cn(
                            "flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[10px] font-extrabold rounded-lg transition-all active:scale-95 duration-300 cursor-pointer ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                            isSaved 
                              ? "text-orange-500 bg-orange-500/10 shadow-xs" 
                              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                          )}
                        >
                          <Bookmark className={cn("w-3.5 h-3.5", isSaved && "fill-orange-500 text-orange-500")} />
                          <span>Lưu quán</span>
                        </button>
                      </div>

                      {/* Threaded Comments Feed */}
                      <div className="space-y-4 pt-2">
                        <h4 className="font-extrabold text-[10px] text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1.5 px-0.5">
                          <span>Bình luận ({activeComments.length})</span>
                        </h4>

                        {isFetchingComments ? (
                          <div className="space-y-4 py-2">
                            {[1, 2].map((i) => (
                              <div key={`comment-skeleton-${i}`} className="flex gap-3 animate-pulse">
                                <div className="w-7 h-7 rounded-full bg-secondary/80 dark:bg-muted/30 flex-shrink-0" />
                                <div className="flex-1 space-y-2 min-w-0">
                                  <div className="h-8 bg-secondary/60 dark:bg-muted/20 rounded-2xl w-full border border-border/10" />
                                  <div className="flex gap-3 px-1.5 text-[8px] font-bold">
                                    <div className="h-2 bg-secondary/80 dark:bg-muted/30 rounded-full w-10" />
                                    <div className="h-2 bg-secondary/80 dark:bg-muted/30 rounded-full w-10" />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : activeComments.length > 0 ? (
                          <div className="divide-y divide-border/10 pb-4">
                            {activeComments.map(c => renderComment(c))}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-[11px] text-muted-foreground/50 font-semibold">
                            Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ cảm nhận!
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sticky Footer: Input comment box inside the rounded modal container */}
                    <div className="p-4.5 bg-[#FAF9F6]/95 dark:bg-[#0A0A0A]/95 backdrop-blur-md border-t border-border/30 flex-shrink-0 rounded-b-[calc(2.5rem-8px)]">
                      {replyingTo && (
                        <div className="flex items-center justify-between bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-1.5 mb-2 text-[10px] font-bold text-orange-500 animate-fade-in">
                          <span>Đang phản hồi @{replyingTo.user.username}</span>
                          <button 
                            onClick={() => setReplyingTo(null)}
                            className="text-[9px] hover:underline cursor-pointer opacity-80"
                          >
                            Hủy
                          </button>
                        </div>
                      )}
                      
                      <form onSubmit={handleSendComment} className="flex items-center gap-3">
                        <Avatar className="w-8 h-8 flex-shrink-0 ring-2 ring-primary/15">
                          <AvatarImage src={displayAvatar} alt={displayName} />
                          <AvatarFallback>{displayName[0]}</AvatarFallback>
                        </Avatar>
                        
                        <div className="relative flex-1 group">
                          <input
                            id="detail-comment-input"
                            type="text"
                            value={newCommentText}
                            onChange={(e) => setNewCommentText(e.target.value)}
                            placeholder={replyingTo ? `Phản hồi @${replyingTo.user.username}...` : "Viết bình luận ẩm thực..."}
                            className="w-full bg-secondary/30 hover:bg-secondary/50 focus:bg-background text-foreground text-xs placeholder:text-muted-foreground/60 pl-4 pr-16 py-2.5 rounded-full border border-border/40 focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all duration-300 font-semibold"
                          />
                          {/* Camera & Emoji buttons overlay */}
                          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-muted-foreground/40 group-focus-within:text-muted-foreground/60 transition-colors duration-300">
                            <button type="button" className="p-0.5 hover:text-foreground hover:scale-105 active:scale-90 transition-all rounded-full cursor-pointer">
                              <Camera className="w-3.5 h-3.5" />
                            </button>
                            <button type="button" className="p-0.5 hover:text-foreground hover:scale-105 active:scale-90 transition-all rounded-full cursor-pointer">
                              <Smile className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <button 
                          type="submit" 
                          disabled={!newCommentText.trim()}
                          className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/95 disabled:bg-secondary disabled:text-muted-foreground/30 transition-all duration-300 flex-shrink-0 active:scale-95 hover:scale-105 cursor-pointer shadow-md"
                        >
                          <Send className="w-3 h-3" />
                        </button>
                      </form>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
