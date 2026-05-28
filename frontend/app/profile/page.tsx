"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Settings, Grid3X3, Bookmark, Heart, MapPin, Home, Share2, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BottomNavigation } from "@/components/bottom-navigation";
import { userProfile } from "@/lib/data";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"posts" | "saved" | "liked">("posts");

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

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
          <h1 className="font-semibold">{userProfile.username}</h1>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Share2 className="w-5 h-5" />
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
              <AvatarImage src={userProfile.avatar} alt={userProfile.name} />
              <AvatarFallback>{userProfile.name[0]}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-center">
                  <p className="font-bold text-lg">{userProfile.posts}</p>
                  <p className="text-xs text-muted-foreground">Bài viết</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">{formatNumber(userProfile.followers)}</p>
                  <p className="text-xs text-muted-foreground">Người theo dõi</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">{userProfile.following}</p>
                  <p className="text-xs text-muted-foreground">Đang theo dõi</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h2 className="font-bold">{userProfile.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">{userProfile.bio}</p>
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
              <p className="font-bold">{userProfile.saved}</p>
              <p className="text-xs text-muted-foreground">Đã lưu</p>
            </div>
            <div className="bg-secondary/50 rounded-xl p-3 text-center">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <p className="font-bold">{formatNumber(userProfile.followers * 10)}</p>
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
