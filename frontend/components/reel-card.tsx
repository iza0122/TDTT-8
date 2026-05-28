"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, MessageCircle, Share2, Music2, Play, Pause, MapPin, MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReelCardProps {
  reel: {
    id: string;
    user: {
      name: string;
      username: string;
      avatar: string;
    };
    restaurant: {
      name: string;
      address: string;
    };
    video: string;
    caption: string;
    likes: number;
    comments: number;
    shares: number;
    music: string;
  };
  isActive: boolean;
  onCommentClick?: () => void;
  isCommentsOpen?: boolean;
}

export function ReelCard({ reel, isActive, onCommentClick, isCommentsOpen = false }: ReelCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(reel.likes);
  const [isPlaying, setIsPlaying] = useState(isActive);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);
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

  return (
    <div className="relative h-full w-full bg-background dark:bg-black flex items-center justify-center snap-start md:py-6">
      {/* Video/Image Container - Portrait 9:16 inside a phone mockup container on desktop */}
      <div className="relative w-full h-full max-w-[100vw] md:max-w-[calc((100vh-48px)*9/16)] md:h-[calc(100vh-48px)] aspect-[9/16] md:aspect-auto md:rounded-[36px] md:border-[10px] md:border-muted-foreground/35 md:shadow-2xl md:overflow-hidden md:bg-card">
        <Image
          src={reel.video}
          alt={reel.caption}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 56.25vh"
          priority
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/10 dark:from-black/20 via-transparent to-foreground/40 dark:to-black/60" />

      {/* Play/Pause Overlay */}
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="absolute inset-0 flex items-center justify-center z-10"
      >
        {!isPlaying && (
          <div className="w-16 h-16 bg-foreground/20 dark:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Play className="w-8 h-8 text-background dark:text-white fill-background dark:fill-white ml-1" />
          </div>
        )}
      </button>

      {/* Right Side Actions */}
      <div className="absolute right-3 bottom-20 flex flex-col items-center gap-5 z-20">
        {/* User Avatar */}
        <div className="relative">
          <Avatar className="w-11 h-11 ring-2 ring-white/30">
            <AvatarImage src={reel.user.avatar} alt={reel.user.name} />
            <AvatarFallback>{reel.user.name[0]}</AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-bold">+</span>
          </div>
        </div>

        {/* Like */}
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors">
            <Heart
              className={cn(
                "w-5 h-5 transition-all",
                isLiked ? "text-red-500 fill-red-500" : "text-white"
              )}
            />
          </div>
          <span className="text-white text-xs font-medium">{formatNumber(likes)}</span>
        </button>

        {/* Comment */}
        <button onClick={onCommentClick} className="flex flex-col items-center gap-1">
          <div className={cn(
            "w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300",
            isCommentsOpen
              ? "bg-orange-500 scale-110 shadow-lg border border-orange-400"
              : "bg-white/15 hover:bg-white/25 hover:scale-105"
          )}>
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-xs font-medium">{formatNumber(reel.comments)}</span>
        </button>

        {/* Share */}
        <button className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-xs font-medium">{formatNumber(reel.shares)}</span>
        </button>

        {/* More */}
        <button className="w-10 h-10 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors">
          <MoreVertical className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-6 left-0 right-14 p-4 z-20">
        {/* User Info */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-white font-semibold text-sm">@{reel.user.username}</span>
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-xs bg-transparent border-white/40 text-white hover:bg-white/20 px-2"
          >
            Theo dõi
          </Button>
        </div>

        {/* Caption */}
        <p className="text-white text-sm mb-2 line-clamp-2">{reel.caption}</p>

        {/* Restaurant */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1 bg-white/15 backdrop-blur-sm px-2 py-1 rounded-full">
            <MapPin className="w-3 h-3 text-white" />
            <span className="text-white text-xs font-medium">{reel.restaurant.name}</span>
          </div>
        </div>

        {/* Music */}
        <div className="flex items-center gap-2">
          <Music2 className="w-3 h-3 text-white/80" />
          <div className="overflow-hidden flex-1">
            <p className="text-white/80 text-xs truncate">{reel.music}</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
