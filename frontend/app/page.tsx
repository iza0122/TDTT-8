"use client";

import { useState, useEffect, useRef } from "react";
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
  Share2
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface Comment {
  id: string;
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

// Comments are fetched dynamically from the backend interact API!

export default function HomePage() {
  const { user, token } = useAuth();
  const displayName = user?.full_name || "Khách";
  const displayUsername = user?.email ? user.email.split('@')[0] : "guest";
  const displayAvatar = user?.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop";

  const [postsList, setPostsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [suggestedRestaurants, setSuggestedRestaurants] = useState<any[]>([]);
  const pendingLikes = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch("/api/content/videos?post_type=image", {
          headers: token ? { "Authorization": `Bearer ${token}` } : {}
        });
        if (response.ok) {
          const data = await response.json();
          const mapped = data.items.map((item: any) => ({
            id: String(item.id),
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
            caption: item.description || item.title,
            likes: item.likes_count,
            comments: item.comments_count || 0,
            saves: Math.floor(Math.random() * 12) + 3,
            createdAt: "Vừa xong",
            isLiked: item.is_liked || false,
            isSaved: false
          }));
          setPostsList(mapped);
        }
      } catch (err) {
        console.error("Lỗi khi tải bài viết từ API:", err);
      } finally {
        setIsLoading(false);
      }
    };

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

    fetchPosts();
    fetchSuggestions();
  }, [token]);

  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [activeComments, setActiveComments] = useState<Comment[]>([]);
  const [isFetchingComments, setIsFetchingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [modalImageAspect, setModalImageAspect] = useState<number | null>(null);

  const searchParams = useSearchParams();
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
            user: {
              name: c.user?.full_name || "Người dùng",
              username: c.user?.username || `user_${c.user_id}`,
              avatar: c.user?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
            },
            content: c.content,
            createdAt: "Hôm nay",
            likes: c.likes_count,
            replies: c.replies ? c.replies.map((r: any) => ({
              id: String(r.id),
              user: {
                name: r.user?.full_name || "Người dùng",
                username: r.user?.username || `user_${r.user_id}`,
                avatar: r.user?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
              },
              content: r.content,
              createdAt: "Hôm nay",
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
      
      // Map category IDs to Vietnamese equivalents to match
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
    <div className="min-h-screen bg-background">
      {/* Outer Layout Container - Centered and Grid on Desktop */}
      <div className="max-w-7xl mx-auto px-0 md:px-4 lg:grid lg:grid-cols-12 lg:gap-8">
        
        {/* Left Sidebar - Desktop (Hidden on Mobile/Tablet) */}
        <aside className="hidden lg:flex flex-col col-span-3 sticky top-0 h-screen py-8 justify-between border-r border-border/80 bg-card/30 backdrop-blur-md pr-6">
          <div className="space-y-8">
            {/* Brand Logo */}
            <div className="px-4">
              <h1 className="text-2xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent tracking-tight">
                FoodieGram
              </h1>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Khám phá thế giới ẩm thực</p>
            </div>

            {/* Profile Summary Card */}
            <div className="mx-4 p-4 rounded-2xl bg-gradient-to-br from-primary/5 via-card to-card border border-border shadow-xs">
              <Link href={user ? "/profile" : "/login"} className="flex items-center gap-3 group">
                <Avatar className="w-10 h-10 ring-2 ring-primary/10 transition-transform duration-300 group-hover:scale-105">
                  <AvatarImage src={displayAvatar} alt={displayName} />
                  <AvatarFallback className="bg-primary/20 text-primary font-bold">{displayName[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                    {displayName}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">@{displayUsername}</p>
                </div>
              </Link>
            </div>

            {/* Navigations Link List */}
            <nav className="space-y-1 px-2">
              <Link href="/" className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-bold text-primary bg-primary/10 transition-all">
                <Home className="w-5 h-5" />
                <span>Trang chủ</span>
              </Link>
              <Link href="/reels" className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-foreground hover:bg-secondary/80 hover:text-primary transition-all duration-200 group">
                <Play className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span>Reels quán ngon</span>
              </Link>
              <Link href="/create" className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-foreground hover:bg-secondary/80 hover:text-primary transition-all duration-200 group">
                <Camera className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span>Đăng bài review</span>
              </Link>
              <Link href="/map" className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-foreground hover:bg-secondary/80 hover:text-primary transition-all duration-200 group">
                <MapPin className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span>Bản đồ ẩm thực</span>
              </Link>
              <Link href="/profile" className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-foreground hover:bg-secondary/80 hover:text-primary transition-all duration-200 group">
                <User className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span>Hồ sơ cá nhân</span>
              </Link>
              <Link href="/profile" className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-foreground hover:bg-secondary/80 hover:text-primary transition-all duration-200 group">
                <Bookmark className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span>Bài viết đã lưu</span>
              </Link>
              <Link href="/profile" className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-foreground hover:bg-secondary/80 hover:text-primary transition-all duration-200 group">
                <Heart className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span>Quán ăn yêu thích</span>
              </Link>
            </nav>
          </div>

          <div className="px-4 space-y-4">
            <div className="flex items-center justify-center p-3 rounded-2xl bg-secondary/30 dark:bg-card/50 border border-border/80 shadow-xs">
              <ThemeToggle />
            </div>
            <Link href="/profile" className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-all duration-200">
              <Settings className="w-4 h-4" />
              <span>Cài đặt tài khoản</span>
            </Link>
          </div>
        </aside>

        {/* Center Column - Main Feed (Takes full width on mobile/tablet) */}
        <main className="col-span-12 lg:col-span-6 min-h-screen pb-8 lg:border-r lg:border-border/80">
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="lg:hidden">
            <Header />
          </div>
          
          {/* Search Bar replacing StoriesBar */}
          <div className="bg-card border-b border-border/80 p-4">
            <div className="max-w-lg mx-auto relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm kiếm món ăn, nhà hàng, blogger..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-secondary/60 hover:bg-secondary/80 focus:bg-background text-foreground placeholder:text-muted-foreground pl-10 pr-10 py-2.5 rounded-2xl border border-border/60 focus:border-primary/50 focus:outline-none transition-all duration-200 text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors"
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
                    className="bg-card/70 backdrop-blur-md rounded-3xl border border-border/80 p-4 space-y-4 animate-pulse shadow-[0_8px_30px_rgb(0,0,0,0.015)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.15)]"
                  >
                    {/* Header Skeleton */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary/80 dark:bg-muted/30" />
                        <div className="space-y-1.5">
                          <div className="h-3 bg-secondary/80 dark:bg-muted/30 rounded-full w-24 animate-pulse" />
                          <div className="h-3 bg-secondary/80 dark:bg-muted/30 rounded-full w-32 animate-pulse" />
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-secondary/80 dark:bg-muted/30" />
                    </div>

                    {/* Image Skeleton */}
                    <div className="relative aspect-square rounded-2xl bg-secondary/60 dark:bg-muted/20 overflow-hidden flex items-center justify-center border border-border/10" />

                    {/* Actions and Content Skeleton */}
                    <div className="space-y-3.5 pt-2">
                      <div className="flex justify-between items-center">
                        <div className="flex gap-4">
                          <div className="w-14 h-5 bg-secondary/80 dark:bg-muted/30 rounded-full" />
                          <div className="w-14 h-5 bg-secondary/80 dark:bg-muted/30 rounded-full" />
                          <div className="w-6 h-6 bg-secondary/80 dark:bg-muted/30 rounded-full" />
                        </div>
                        <div className="w-6 h-6 bg-secondary/80 dark:bg-muted/30 rounded-full" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-3.5 bg-secondary/80 dark:bg-muted/30 rounded-full w-4/5 animate-pulse" />
                        <div className="h-3.5 bg-secondary/80 dark:bg-muted/30 rounded-full w-2/3 animate-pulse" />
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
                />
              ))
            ) : (
              <div className="text-center py-16 px-4 bg-card rounded-3xl border border-border/60 shadow-xs max-w-md mx-auto my-4 space-y-4">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
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
                  className="text-xs font-bold"
                >
                  Đặt lại bộ lọc
                </Button>
              </div>
            )}
          </div>
        </main>

        {/* Right Column - Explore/Suggestions Panel (Hidden on Mobile/Tablet) */}
        <aside className="hidden lg:block col-span-3 sticky top-0 h-screen py-8 pl-6 space-y-8 overflow-y-auto scrollbar-hide">
          {/* Suggested Restaurants */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Compass className="w-4 h-4 text-primary" />
                Quán ngon gợi ý
              </h3>
              <Link href="/map" className="text-xs font-bold text-primary hover:underline flex items-center">
                Xem hết <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {suggestedRestaurants.slice(0, 3).map((res) => (
                <Link href="/map" key={res.id} className="flex gap-3 p-3 rounded-2xl bg-card border border-border/80 shadow-xs hover:border-primary/30 transition-all duration-200 group">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                    <Avatar className="w-12 h-12 rounded-xl">
                      <AvatarImage src={res.image} alt={res.name} className="object-cover" />
                      <AvatarFallback>{res.name[0]}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                    <div>
                      <h4 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                        {res.name}
                      </h4>
                      <p className="text-[10px] text-muted-foreground truncate">{res.address}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5 bg-primary/10 px-1.5 py-0.5 rounded text-[9px] font-extrabold text-primary">
                        <Star className="w-2.5 h-2.5 fill-primary" />
                        <span>{res.rating}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium">{res.category}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Suggested food bloggers */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Blogger nổi bật
              </h3>
            </div>

            <div className="space-y-3.5">
              {postsList.slice(0, 3).map((post) => (
                <div key={post.id} className="flex items-center justify-between gap-3 p-1 rounded-xl">
                  <Link href="/profile" className="flex items-center gap-2.5 min-w-0 group">
                    <Avatar className="w-8 h-8 ring-1 ring-primary/10 transition-transform group-hover:scale-105">
                      <AvatarImage src={post.user.avatar} alt={post.user.name} />
                      <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">{post.user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                        {post.user.name}
                      </h4>
                      <p className="text-[10px] text-muted-foreground truncate">@{post.user.username}</p>
                    </div>
                  </Link>
                  <Button size="sm" variant="ghost" className="h-7 text-xs font-bold text-primary hover:text-primary-foreground hover:bg-primary px-3 rounded-lg border border-primary/20">
                    Theo dõi
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer branding and links */}
          <div className="pt-6 border-t border-border/80 px-1 text-[10px] text-muted-foreground space-y-3">
            <p className="font-medium">© 2026 FoodieGram. All rights reserved.</p>
            <div className="flex flex-wrap gap-x-2 gap-y-1 font-semibold">
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

      {/* Modal/Pop-up post detail (Proportional Vertical Flow layout) */}
      {selectedPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          {/* Backdrop close */}
          <div className="absolute inset-0 cursor-pointer" onClick={() => {
            setSelectedPostId(null);
            setReplyingTo(null);
            setNewCommentText("");
            setModalImageAspect(null);
          }} />

          {/* Modal Container */}
          <div className="relative bg-card border border-border/80 w-full max-w-xl h-[85vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button 
              onClick={() => {
                setSelectedPostId(null);
                setReplyingTo(null);
                setNewCommentText("");
                setModalImageAspect(null);
              }}
              className="absolute top-4 right-4 z-35 p-2 rounded-full bg-black/50 text-white hover:bg-black/75 transition-all active:scale-95 cursor-pointer shadow-xs border border-border/10"
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
                  // Toggle state locally first for instant snappy UX!
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
                  
                  // Call backend API in background to persist it!
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
                setPostsList(prev => prev.map(p => {
                  if (p.id === activePost.id) {
                    return { ...p, isSaved: !p.isSaved };
                  }
                  return p;
                }));
              };

              // Handle posting new comment or reply via API
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

                    // Increment comments count visually
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

              // Recursive comment renderer inside the render
              const renderComment = (comment: Comment, isReply = false) => {
                return (
                  <div key={comment.id} className={cn("flex gap-3", isReply ? "mt-3 pl-6 border-l-2 border-primary/20 md:pl-8" : "mt-4.5")}>
                    <Avatar className="w-7 h-7 flex-shrink-0 ring-1 ring-primary/10">
                      <AvatarImage src={comment.user.avatar} alt={comment.user.name} />
                      <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-bold">{comment.user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="bg-secondary/45 dark:bg-card/40 rounded-2xl px-3.5 py-2 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)] border border-border/30 hover:border-border/60 transition-colors">
                        <p className="text-[11px] font-extrabold text-foreground flex items-center gap-1.5 flex-wrap">
                          <span>{comment.user.name}</span>
                          <span className="text-[9px] text-muted-foreground/60 font-medium">
                            @{comment.user.username}
                          </span>
                        </p>
                        <p className="text-xs text-foreground mt-0.5 leading-relaxed">
                          {comment.content}
                        </p>
                      </div>
                      
                      {/* Comment actions */}
                      <div className="flex items-center gap-3.5 mt-1 px-1.5 text-[9px] text-muted-foreground/80 font-bold select-none">
                        <span className="font-medium text-muted-foreground/45">{comment.createdAt}</span>
                        <button 
                          onClick={async () => {
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
                                        return { ...c, likes: data.likes_count };
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
                            }
                          }}
                          className="hover:text-primary transition-colors flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>❤️ Thích</span>
                          {comment.likes > 0 && <span className="text-[8px] bg-primary/10 px-1 rounded-sm text-primary">{comment.likes}</span>}
                        </button>
                        <button 
                          onClick={() => setReplyingTo(comment)}
                          className="hover:text-primary transition-colors cursor-pointer"
                        >
                          <span>💬 Phản hồi</span>
                        </button>
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
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                    {/* Header */}
                    <div className="flex items-center gap-3 pb-3 border-b border-border/30">
                      <Avatar className="w-9 h-9 ring-2 ring-primary/20">
                        <AvatarImage src={activePost.user.avatar} alt={activePost.user.name} />
                        <AvatarFallback>{activePost.user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs text-muted-foreground/75 font-semibold">@{activePost.user.username}</p>
                        <div className="flex items-center gap-1 text-[13px] font-extrabold text-foreground mt-0.5 hover:text-primary transition-colors cursor-pointer">
                          <MapPin className="w-3 h-3 text-primary fill-primary/15" />
                          <span>{activePost.restaurant.name}</span>
                        </div>
                      </div>
                    </div>

                    {/* Proportional dynamic aspect ratio photo matching original image */}
                    <div 
                      className="relative w-full rounded-2xl overflow-hidden shadow-xs border border-border/30 bg-black flex items-center justify-center transition-all duration-300"
                      style={{ 
                        aspectRatio: modalImageAspect ? `${modalImageAspect}` : '1 / 1',
                        maxHeight: '55vh'
                      }}
                    >
                      {/* Blurred ambient backdrop */}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-45 select-none">
                        <Image
                          src={activePost.image}
                          alt=""
                          fill
                          className="object-cover blur-2xl scale-110"
                          sizes="100px"
                        />
                      </div>

                      {/* Foreground uncropped image */}
                      <Image
                        src={activePost.image}
                        alt={activePost.caption}
                        fill
                        className="object-contain animate-fade-in duration-300"
                        sizes="(max-width: 576px) 100vw, 576px"
                        priority
                        onLoad={(e) => {
                          const img = e.target as HTMLImageElement;
                          if (img.naturalWidth && img.naturalHeight) {
                            setModalImageAspect(img.naturalWidth / img.naturalHeight);
                          }
                        }}
                      />
                    </div>

                    {/* Caption & Time */}
                    <div className="space-y-1.5">
                      <p className="text-xs text-foreground leading-relaxed">
                        <span className="font-bold mr-1.5">@{activePost.user.username}</span>
                        {activePost.caption}
                      </p>
                      <p className="text-[9px] text-muted-foreground/45 tracking-wider">{activePost.createdAt}</p>
                    </div>

                    {/* Divider line */}
                    <hr className="border-border/30" />

                    {/* Action Bar */}
                    <div className="flex items-center justify-between py-1 bg-secondary/15 dark:bg-muted/10 rounded-xl px-2">
                      <button
                        onClick={handleLikeDetail}
                        className={cn(
                          "flex-1 py-2 flex items-center justify-center gap-1.5 text-[10px] font-extrabold rounded-lg transition-all active:scale-95 cursor-pointer",
                          isLiked 
                            ? "text-red-500 bg-red-500/10" 
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )}
                      >
                        <Heart className={cn("w-3.5 h-3.5 transition-all", isLiked ? "text-red-500 fill-red-500 scale-110" : "text-muted-foreground")} />
                        <span>Thèm ({activePost.likes})</span>
                      </button>

                      <button
                        onClick={() => {
                          const inputEl = document.getElementById("detail-comment-input");
                          if (inputEl) inputEl.focus();
                        }}
                        className="flex-1 py-2 flex items-center justify-center gap-1.5 text-[10px] font-extrabold text-muted-foreground hover:bg-secondary hover:text-foreground rounded-lg transition-all active:scale-95 cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Bình luận ({activeComments.length})</span>
                      </button>

                      <button
                        onClick={handleSaveDetail}
                        className={cn(
                          "flex-1 py-2 flex items-center justify-center gap-1.5 text-[10px] font-extrabold rounded-lg transition-all active:scale-95 cursor-pointer",
                          isSaved 
                            ? "text-primary bg-primary/10" 
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )}
                      >
                        <Bookmark className={cn("w-3.5 h-3.5", isSaved && "fill-primary")} />
                        <span>Lưu quán</span>
                      </button>
                    </div>

                    {/* Threaded Comments Feed */}
                    <div className="space-y-4 pt-2">
                      <h4 className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
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
                        <div className="text-center py-6 text-[11px] text-muted-foreground/60 font-semibold">
                          Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ cảm nhận!
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sticky Footer: Input comment box inside the rounded modal container */}
                  <div className="p-3 bg-card border-t border-border/50 flex-shrink-0 rounded-b-3xl">
                    {replyingTo && (
                      <div className="flex items-center justify-between bg-primary/10 border border-primary/25 rounded-lg px-2.5 py-1 mb-2 text-[10px] font-bold text-primary">
                        <span>Đang phản hồi @{replyingTo.user.username}</span>
                        <button 
                          onClick={() => setReplyingTo(null)}
                          className="text-[9px] hover:underline cursor-pointer opacity-80"
                        >
                          Hủy
                        </button>
                      </div>
                    )}
                    
                    <form onSubmit={handleSendComment} className="flex items-center gap-2">
                      <Avatar className="w-7 h-7 flex-shrink-0 ring-1 ring-primary/20">
                        <AvatarImage src={displayAvatar} alt={displayName} />
                        <AvatarFallback>{displayName[0]}</AvatarFallback>
                      </Avatar>
                      
                      <div className="relative flex-1">
                        <input
                          id="detail-comment-input"
                          type="text"
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          placeholder={replyingTo ? `Phản hồi @${replyingTo.user.username}...` : "Viết bình luận ẩm thực..."}
                          className="w-full bg-secondary/50 hover:bg-secondary/70 focus:bg-background text-foreground text-xs placeholder:text-muted-foreground pl-3.5 pr-14 py-2 rounded-full border border-border/60 focus:border-primary/50 focus:outline-none transition-all duration-200"
                        />
                        {/* Camera & Emoji buttons overlay */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-muted-foreground/50">
                          <button type="button" className="p-0.5 hover:text-foreground transition-colors hover:bg-muted rounded-full">
                            <Camera className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" className="p-0.5 hover:text-foreground transition-colors hover:bg-muted rounded-full">
                            <Smile className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <button 
                        type="submit" 
                        disabled={!newCommentText.trim()}
                        className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/95 disabled:bg-secondary disabled:text-muted-foreground/30 transition-all duration-200 flex-shrink-0 active:scale-95 cursor-pointer shadow-xs"
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
      )}
    </div>
  );
}
