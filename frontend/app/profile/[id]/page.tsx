"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Settings, Grid3X3, Heart, MapPin, Home, Share2, Loader2, Play, Eye, Plus, Sparkles, ChevronRight, UserPlus, UserCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const { toast } = useToast();
  
  const targetUserId = params?.id ? Number(params.id) : null;
  const isMe = user?.id === targetUserId;

  const [activeTab, setActiveTab] = useState<"posts" | "reels">("posts");
  const [profileStats, setProfileStats] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [isFollowPending, setIsFollowPending] = useState(false);

  // Redirect to own profile if it's the current user
  useEffect(() => {
    if (isMe) {
      router.replace("/profile");
    }
  }, [isMe, router]);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!targetUserId) return;
      try {
        const response = await fetch(`/api/auth/users/${targetUserId}/profile`, {
          headers: token ? {
            "Authorization": `Bearer ${token}`
          } : {}
        });
        if (response.ok) {
          const data = await response.json();
          setProfileStats(data);
        } else {
          toast({
            title: "Lỗi tải hồ sơ ❌",
            description: "Không thể tìm thấy reviewer này.",
            variant: "destructive"
          });
          router.push("/");
        }
      } catch (err) {
        console.error("Lỗi khi lấy thông tin profile:", err);
      } finally {
        setIsFetching(false);
      }
    };

    fetchProfileData();
  }, [targetUserId, token, router, toast]);

  const handleFollowToggle = async () => {
    if (!token) {
      toast({
        title: "Yêu cầu đăng nhập 🔒",
        description: "Vui lòng đăng nhập để theo dõi reviewer này.",
        variant: "destructive"
      });
      router.push("/login");
      return;
    }
    if (!profileStats || isFollowPending) return;

    setIsFollowPending(true);
    const isCurrentlyFollowing = profileStats.is_following;
    const endpoint = `/api/interact/users/${targetUserId}/${isCurrentlyFollowing ? "unfollow" : "follow"}`;
    const method = isCurrentlyFollowing ? "DELETE" : "POST";

    try {
      // Optimitistic UI Update
      setProfileStats((prev: any) => ({
        ...prev,
        is_following: !isCurrentlyFollowing,
        followers_count: isCurrentlyFollowing ? Math.max(0, prev.followers_count - 1) : prev.followers_count + 1
      }));

      const res = await fetch(endpoint, {
        method: method,
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setProfileStats((prev: any) => ({
          ...prev,
          is_following: data.is_following,
          followers_count: data.followers_count
        }));

        toast({
          title: data.is_following ? "Đã theo dõi reviewer 🌟" : "Đã hủy theo dõi 🤝",
          description: data.is_following 
            ? `Bạn sẽ nhận được các bài review mới nhất từ ${profileStats.full_name}.` 
            : `Đã dừng nhận thông báo từ ${profileStats.full_name}.`
        });
      } else {
        // Rollback
        setProfileStats((prev: any) => ({
          ...prev,
          is_following: isCurrentlyFollowing,
          followers_count: isCurrentlyFollowing ? prev.followers_count + 1 : Math.max(0, prev.followers_count - 1)
        }));
        const errData = await res.json();
        throw new Error(errData.detail || "Thao tác thất bại.");
      }
    } catch (err: any) {
      console.error("Lỗi follow:", err);
      toast({
        title: "Lỗi hệ thống ❌",
        description: err.message || "Vui lòng thử lại sau.",
        variant: "destructive"
      });
    } finally {
      setIsFollowPending(false);
    }
  };

  const handleShareProfile = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Đã sao chép liên kết 🔗",
      description: "Đã copy link hồ sơ reviewer này vào bộ nhớ tạm."
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  if (loading || isFetching || !profileStats) {
    return (
      <div className="min-h-screen bg-neutral-50/50 dark:bg-black flex flex-col items-center justify-center gap-4 relative overflow-hidden select-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 pointer-events-none" />
        <div className="relative z-10 p-6 bg-white/5 border border-white/10 rounded-2xl shadow-xl backdrop-blur-md flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground font-extrabold uppercase tracking-widest animate-pulse">Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  const displayName = profileStats.full_name || "Blogger ẩn danh";
  const displayUsername = profileStats.email ? profileStats.email.split('@')[0] : `user_${profileStats.id}`;
  const displayAvatar = profileStats.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop";
  const displayBio = profileStats.bio || "Đam mê ẩm thực & Chia sẻ quán ngon";

  const postsCount = profileStats.posts_count ?? 0;
  const followersCount = profileStats.followers_count ?? 0;
  const followingCount = profileStats.following_count ?? 0;
  const likesCount = profileStats.likes_received_count ?? 0;

  return (
    <div className="min-h-screen bg-neutral-50/30 dark:bg-black/95 text-foreground pb-20 select-none antialiased">
      {/* Background radial soft lights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg md:max-w-6xl lg:max-w-7xl h-[400px] bg-gradient-to-b from-orange-500/5 via-transparent to-transparent pointer-events-none z-0" />

      {/* Header - Floating Detached Glass Pill */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-black/70 backdrop-blur-md border-b border-neutral-200/50 dark:border-white/5 shadow-xs">
        <div className="max-w-lg md:max-w-6xl lg:max-w-7xl mx-auto flex items-center justify-between px-4 py-3.5">
          <Link href="/">
            <button className="w-10 h-10 rounded-full bg-secondary/50 dark:bg-neutral-900/50 border border-border/40 hover:bg-orange-500 hover:border-orange-500 active:scale-95 transition-all duration-300 flex items-center justify-center text-foreground hover:text-white cursor-pointer shadow-xs">
              <Home className="w-4.5 h-4.5 stroke-[2]" />
            </button>
          </Link>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-orange-500 animate-pulse fill-orange-500/10" />
            <h1 className="font-extrabold text-sm tracking-wide bg-gradient-to-r from-neutral-800 to-neutral-500 dark:from-white dark:to-neutral-400 bg-clip-text text-transparent">@{displayUsername}</h1>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </header>

      {/* Main Container - Asymmetrical Dashboard Grid on Desktop, simple scroll on Mobile */}
      <main className="max-w-lg md:max-w-6xl lg:max-w-7xl mx-auto px-4 pt-6 space-y-6 md:space-y-0 md:grid md:grid-cols-12 md:gap-8 md:items-start relative z-10">
        
        {/* LEFT COLUMN - Sticky Profile Sidebar on Desktop */}
        <div className="md:col-span-4 space-y-6 md:sticky md:top-24">
          
          {/* Profile Card - Double-Bezel Architecture */}
          <div className="relative bg-neutral-100/50 dark:bg-neutral-900/20 border border-neutral-200/50 dark:border-white/5 rounded-[2.5rem] p-5 shadow-[0_12px_36px_rgba(0,0,0,0.02)]">
            {/* Inner Core */}
            <div className="bg-white dark:bg-neutral-950/40 border border-neutral-100/70 dark:border-white/5 rounded-[calc(2.5rem-0.75rem)] p-5 space-y-5 shadow-[inset_0_1px_2px_rgba(255,255,255,0.08)]">
              
              {/* Upper Section: Avatar & Quick stats list */}
              <div className="flex items-center justify-between gap-6">
                
                {/* Profile Image Bezel */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-orange-500 via-amber-500 to-red-500 rounded-full blur-[2px] opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative p-1 bg-gradient-to-tr from-orange-500 via-amber-500 to-red-500 rounded-full shadow-md">
                    <Avatar className="w-20 h-20 ring-2 ring-white dark:ring-black">
                      <AvatarImage src={displayAvatar} alt={displayName} />
                      <AvatarFallback className="bg-secondary text-primary font-black text-2xl">
                        {displayName[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>

                {/* Stats stacking dashboard */}
                <div className="flex-1 flex justify-around items-center py-2.5">
                  <div className="text-center group cursor-pointer">
                    <p className="font-black text-lg bg-gradient-to-b from-neutral-800 to-neutral-600 dark:from-white dark:to-neutral-400 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">{postsCount}</p>
                    <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-widest mt-0.5">Bài viết</p>
                  </div>
                  <div className="w-px h-6 bg-border/40" />
                  <div className="text-center group cursor-pointer">
                    <p className="font-black text-lg bg-gradient-to-b from-neutral-800 to-neutral-600 dark:from-white dark:to-neutral-400 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">{formatNumber(followersCount)}</p>
                    <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-widest mt-0.5">Followers</p>
                  </div>
                  <div className="w-px h-6 bg-border/40" />
                  <div className="text-center group cursor-pointer">
                    <p className="font-black text-lg bg-gradient-to-b from-neutral-800 to-neutral-600 dark:from-white dark:to-neutral-400 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">{followingCount}</p>
                    <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-widest mt-0.5">Following</p>
                  </div>
                </div>

              </div>

              {/* Lower Section: Blogger Metadata & Description */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-black text-lg text-foreground tracking-tight">{displayName}</h2>
                  <div className="rounded-full px-2.5 py-0.5 bg-orange-500/10 border border-orange-500/20 text-[9px] uppercase tracking-wider font-extrabold text-orange-500">
                    Food Blogger
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed font-semibold pr-4">{displayBio}</p>
              </div>

              {/* Micro CTAs - Follow button & Share button */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleFollowToggle}
                  disabled={isFollowPending}
                  className={cn(
                    "flex-1 shadow-md hover:shadow-lg flex items-center justify-between rounded-full pl-6 pr-2.5 py-2.5 font-extrabold text-[11px] select-none transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 group cursor-pointer",
                    profileStats.is_following
                      ? "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
                      : "bg-orange-500 text-white hover:bg-orange-600"
                  )}
                >
                  <span>{profileStats.is_following ? "Đang theo dõi" : "Theo dõi"}</span>
                  <div className={cn(
                    "w-6.5 h-6.5 rounded-full flex items-center justify-center transition-all duration-350",
                    profileStats.is_following ? "bg-orange-500/10 text-orange-500" : "bg-white/20 text-white"
                  )}>
                    {profileStats.is_following ? (
                      <UserCheck className="w-3.5 h-3.5" />
                    ) : (
                      <UserPlus className="w-3.5 h-3.5" />
                    )}
                  </div>
                </button>
                
                <button 
                  onClick={handleShareProfile}
                  className="flex-1 border border-border bg-card hover:bg-secondary/40 text-foreground flex items-center justify-between rounded-full pl-6 pr-2.5 py-2.5 font-extrabold text-[11px] select-none transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 group cursor-pointer"
                >
                  <span>Chia sẻ hồ sơ</span>
                  <div className="w-6.5 h-6.5 bg-secondary dark:bg-white/10 rounded-full flex items-center justify-center transition-all duration-300 group-hover:rotate-12">
                    <Share2 className="w-3.5 h-3.5 text-foreground/80" />
                  </div>
                </button>
              </div>

            </div>
          </div>

          {/* Bento Grid Stats */}
          <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
            
            {/* Card 1: Địa điểm */}
            <div className="bg-gradient-to-br from-orange-500/5 to-amber-500/5 border border-orange-500/10 hover:border-orange-500/30 rounded-3xl p-3 md:p-4 text-center md:text-left flex flex-col md:flex-row md:items-center md:gap-4.5 transition-all duration-500 hover:scale-[1.02] cursor-pointer group shadow-xs">
              <div className="w-10 h-10 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center mx-auto md:mx-0 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex-shrink-0">
                <MapPin className="w-5 h-5 fill-none" />
              </div>
              <div>
                <p className="font-black text-base md:text-lg text-foreground mt-1 md:mt-0 leading-none">{postsCount}</p>
                <p className="text-[9px] md:text-[10px] text-muted-foreground/80 font-bold uppercase tracking-wider mt-0.5 md:mt-1.5 leading-none">Địa điểm</p>
              </div>
            </div>

            {/* Card 2: Lượt thích nhận được */}
            <div className="bg-gradient-to-br from-rose-500/5 to-red-500/5 border border-rose-500/10 hover:border-rose-500/30 rounded-3xl p-3 md:p-4 text-center md:text-left flex flex-col md:flex-row md:items-center md:gap-4.5 transition-all duration-500 hover:scale-[1.02] cursor-pointer group shadow-xs">
              <div className="w-10 h-10 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto md:mx-0 group-hover:scale-110 group-hover:bg-rose-500 group-hover:text-white transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex-shrink-0">
                <Heart className="w-5 h-5 fill-none" />
              </div>
              <div>
                <p className="font-black text-base md:text-lg text-foreground mt-1 md:mt-0 leading-none">{formatNumber(likesCount)}</p>
                <p className="text-[9px] md:text-[10px] text-muted-foreground/80 font-bold uppercase tracking-wider mt-0.5 md:mt-1.5 leading-none">Lượt thích</p>
              </div>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN - Tab switcher & Content Feed Grid on Desktop */}
        <div className="md:col-span-8 space-y-6">
          
          {/* Tactile Tab Switcher (Only Posts & Reels) */}
          <div className="relative bg-neutral-200/55 dark:bg-neutral-900/60 p-1.5 rounded-full flex gap-1 border border-neutral-300/30 dark:border-white/5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
            <button
              onClick={() => setActiveTab("posts")}
              className={cn(
                "flex-1 py-2.5 flex items-center justify-center gap-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all duration-500 cursor-pointer select-none active:scale-95",
                activeTab === "posts"
                  ? "bg-white dark:bg-neutral-950 text-orange-500 shadow-sm scale-102 border border-neutral-200/40 dark:border-white/5"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Grid3X3 className="w-4.5 h-4.5" />
              <span>Bài viết</span>
            </button>
            <button
              onClick={() => setActiveTab("reels")}
              className={cn(
                "flex-1 py-2.5 flex items-center justify-center gap-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all duration-500 cursor-pointer select-none active:scale-95",
                activeTab === "reels"
                  ? "bg-white dark:bg-neutral-950 text-orange-500 shadow-sm scale-102 border border-neutral-200/40 dark:border-white/5"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Play className="w-4.5 h-4.5" />
              <span>Reels</span>
            </button>
          </div>

          {/* Media Grid & Premium Empty State Section */}
          {(() => {
            let displayedVideos: any[] = [];
            if (activeTab === "posts") {
              displayedVideos = profileStats.videos?.filter((video: any) => video.post_type === "image") || [];
            } else if (activeTab === "reels") {
              displayedVideos = profileStats.videos?.filter((video: any) => video.post_type === "video") || [];
            }

            const getEmptyTitle = () => {
              if (activeTab === "posts") return "Không có bài viết nào";
              return "Không có video Reels";
            };

            const getEmptyDesc = () => {
              return `${displayName} chưa đăng tải nội dung nào ở mục này.`;
            };

            return (
              <div className="grid grid-cols-3 gap-3.5 pb-16">
                {displayedVideos.map((video: any, index: number) => (
                  <button
                    key={video.id}
                    onClick={() => {
                      if (video.post_type === "video") {
                        router.push(`/reels?id=${video.id}`);
                      } else {
                        router.push(`/?post_id=${video.id}`);
                      }
                    }}
                    className="relative aspect-square group rounded-2xl overflow-hidden shadow-xs hover:shadow-lg hover:scale-[1.03] hover:rotate-[0.5deg] border border-border/20 bg-neutral-100 dark:bg-neutral-900 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer"
                  >
                    <Image
                      src={video.thumbnail_url || "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&h=300&fit=crop"}
                      alt={video.title || "Bài đăng ẩm thực"}
                      fill
                      className="object-cover transform group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 512px) 33vw, 240px"
                      priority={index < 6}
                      loading={index < 6 ? "eager" : "lazy"}
                    />
                    
                    {/* Glass blur overlay */}
                    <div className="absolute inset-0 bg-black/45 dark:bg-black/55 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center text-white gap-2 p-3 text-center">
                      <p className="text-[9px] uppercase tracking-wider font-extrabold line-clamp-1">{video.title || "CHI TIẾT"}</p>
                      <div className="flex items-center gap-1 text-xs font-black">
                        <Heart className="w-4 h-4 fill-white text-white" />
                        <span>{video.likes_count}</span>
                      </div>
                    </div>
                  </button>
                ))}

                {/* Empty State */}
                {displayedVideos.length === 0 && (
                  <div className="col-span-3 text-center py-16 px-6 bg-secondary/15 dark:bg-neutral-900/5 rounded-3xl border border-dashed border-neutral-300 dark:border-white/10 my-4 space-y-5 animate-in fade-in duration-500">
                    <div className="relative w-16 h-16 mx-auto bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-sm animate-bounce duration-1000">
                      <Sparkles className="w-8 h-8 fill-orange-500/10" />
                    </div>
                    
                    <div className="space-y-1.5">
                      <p className="font-extrabold text-sm text-foreground uppercase tracking-wide">
                        {getEmptyTitle()}
                      </p>
                      <p className="text-xs text-muted-foreground/80 leading-relaxed font-semibold max-w-xs mx-auto">
                        {getEmptyDesc()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

        </div>

      </main>
    </div>
  );
}
