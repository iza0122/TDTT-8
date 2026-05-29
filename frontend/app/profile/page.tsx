"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Settings, Grid3X3, Bookmark, Heart, MapPin, Home, Share2, LogOut, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { userProfile } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"posts" | "saved" | "liked">("posts");
  const [profileStats, setProfileStats] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchProfileStats = async () => {
      if (!token) return;
      try {
        const response = await fetch("/api/auth/users/me/profile", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setProfileStats(data);
        }
      } catch (err) {
        console.error("Lỗi khi lấy thông tin thống kê profile:", err);
      } finally {
        setIsFetching(false);
      }
    };

    if (token) {
      fetchProfileStats();
    } else if (!loading) {
      setIsFetching(false);
    }
  }, [token, loading]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  if (loading || (isFetching && !profileStats)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">Đang tải hồ sơ cá nhân...</p>
      </div>
    );
  }

  const displayName = user?.full_name || profileStats?.full_name || "Blogger ẩm thực";
  const displayUsername = user?.email ? user.email.split('@')[0] : (profileStats?.email ? profileStats.email.split('@')[0] : "blogger");
  const displayAvatar = user?.avatar_url || profileStats?.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop";
  const displayBio = profileStats?.bio || "Đam mê ẩm thực & Chia sẻ quán ngon";

  const postsCount = profileStats?.posts_count ?? userProfile.posts;
  const followersCount = profileStats?.followers_count ?? userProfile.followers;
  const followingCount = profileStats?.following_count ?? userProfile.following;
  const savedCount = profileStats?.saved_count ?? userProfile.saved;
  const likesCount = profileStats?.likes_received_count ?? (followersCount * 10);

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-orange-500 hover:text-white transition-colors group">
              <Home className="w-5 h-5 text-foreground group-hover:text-white transition-colors" />
            </Button>
          </Link>
          <h1 className="font-semibold">@{displayUsername}</h1>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={logout} title="Đăng xuất">
              <LogOut className="w-5 h-5 text-destructive" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto">
        {/* Profile Info */}
        <div className="px-4 py-6">
          <div className="flex items-start gap-6">
            <Avatar className="w-20 h-20 ring-4 ring-primary/20">
              <AvatarImage src={displayAvatar} alt={displayName} />
              <AvatarFallback className="bg-primary/20 text-primary font-bold text-xl">
                {displayName[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-center">
                  <p className="font-bold text-lg">{postsCount}</p>
                  <p className="text-xs text-muted-foreground">Bài viết</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">{formatNumber(followersCount)}</p>
                  <p className="text-xs text-muted-foreground">Người theo dõi</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">{followingCount}</p>
                  <p className="text-xs text-muted-foreground">Đang theo dõi</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h2 className="font-bold text-foreground">{displayName}</h2>
            <p className="text-sm text-muted-foreground mt-1">{displayBio}</p>
          </div>

          <div className="flex gap-3 mt-4">
            <Button className="flex-1">Chỉnh sửa hồ sơ</Button>
            <Button variant="outline" className="flex-1">Chia sẻ hồ sơ</Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-4 pb-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-secondary/50 rounded-xl p-3 text-center">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <p className="font-bold">{userProfile.reviews.length}</p>
              <p className="text-xs text-muted-foreground">Địa điểm</p>
            </div>
            <div className="bg-secondary/50 rounded-xl p-3 text-center">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Bookmark className="w-5 h-5 text-primary" />
              </div>
              <p className="font-bold">{savedCount}</p>
              <p className="text-xs text-muted-foreground">Đã lưu</p>
            </div>
            <div className="bg-secondary/50 rounded-xl p-3 text-center">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <p className="font-bold">{formatNumber(likesCount)}</p>
              <p className="text-xs text-muted-foreground">Lượt thích</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-border">
          <div className="flex">
            <button
              onClick={() => setActiveTab("posts")}
              className={cn(
                "flex-1 py-3 flex items-center justify-center gap-2 border-b-2 transition-colors",
                activeTab === "posts"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground"
              )}
            >
              <Grid3X3 className="w-5 h-5" />
              <span className="text-sm font-medium">Bài viết</span>
            </button>
            <button
              onClick={() => setActiveTab("saved")}
              className={cn(
                "flex-1 py-3 flex items-center justify-center gap-2 border-b-2 transition-colors",
                activeTab === "saved"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground"
              )}
            >
              <Bookmark className="w-5 h-5" />
              <span className="text-sm font-medium">Đã lưu</span>
            </button>
            <button
              onClick={() => setActiveTab("liked")}
              className={cn(
                "flex-1 py-3 flex items-center justify-center gap-2 border-b-2 transition-colors",
                activeTab === "liked"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground"
              )}
            >
              <Heart className="w-5 h-5" />
              <span className="text-sm font-medium">Đã thích</span>
            </button>
          </div>
        </div>

        {/* Premium Grid with Spacing & Rounded corners */}
        <div className="grid grid-cols-3 gap-3 px-4 py-4">
          {userProfile.reviews.map((review, index) => (
            <button
              key={review.id}
              className="relative aspect-square group rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 hover:scale-[1.02]"
            >
              <Image
                src={review.image}
                alt={review.restaurant}
                fill
                className="object-cover"
                sizes="(max-width: 512px) 33vw, 170px"
                priority={index < 3}
                loading={index < 3 ? "eager" : "lazy"}
              />
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex items-center gap-4 text-card">
                  <div className="flex items-center gap-1">
                    <Heart className="w-5 h-5 fill-card" />
                    <span className="font-semibold">{Math.floor(Math.random() * 500) + 100}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
          {/* Additional placeholder items for better grid */}
          {[...Array(6 - userProfile.reviews.length % 3)].map((_, i) => (
            userProfile.reviews.length % 3 !== 0 && (
              <div
                key={`placeholder-${i}`}
                className="aspect-square bg-secondary/30 rounded-2xl"
              />
            )
          ))}
        </div>
      </main>
    </div>
  );
}

