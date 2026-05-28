"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, MessageCircle, Bookmark, Share2, MapPin, Star, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FoodPostProps {
  post: {
    id: string;
    user: {
      name: string;
      username: string;
      avatar: string;
    };
    restaurant: {
      name: string;
      address: string;
      rating: number;
      category: string;
    };
    image: string;
    caption: string;
    likes: number;
    comments: number;
    saves: number;
    createdAt: string;
    isLiked: boolean;
    isSaved: boolean;
  };
  priority?: boolean;
  onPostClick?: () => void;
  onCommentClick?: () => void;
}

export function FoodPost({ post, priority = false, onPostClick, onCommentClick }: FoodPostProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [isSaved, setIsSaved] = useState(post.isSaved);
  const [likes, setLikes] = useState(post.likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  return (
    <article className="bg-card/70 backdrop-blur-md rounded-3xl border border-border/80 shadow-[0_8px_30px_rgb(0,0,0,0.015)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.15)] mb-6 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 ring-2 ring-primary/20">
            <AvatarImage src={post.user.avatar} alt={post.user.name} />
            <AvatarFallback>{post.user.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs text-muted-foreground/75 font-medium">@{post.user.username}</p>
            <div 
              onClick={onPostClick}
              className="flex items-center gap-1 text-sm font-extrabold text-foreground mt-0.5 hover:text-primary transition-colors cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-primary fill-primary/15" />
              <span>{post.restaurant.name}</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full">
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </div>

      {/* Image */}
      <div 
        onClick={onPostClick}
        className="relative aspect-square cursor-pointer overflow-hidden group"
      >
        <Image
          src={post.image}
          alt={post.caption}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 512px) 100vw, 512px"
          priority={priority}
          loading={priority ? "eager" : "lazy"}
        />
        {/* Restaurant badge */}
        <div className="absolute bottom-3 left-3 right-3 transition-transform duration-300 group-hover:translate-y-[-2px]">
          <div className="bg-card/95 backdrop-blur-md rounded-2xl p-3.5 flex items-center justify-between border border-border/40 shadow-md">
            <div>
              <p className="font-bold text-sm text-foreground">{post.restaurant.name}</p>
              <p className="text-[10px] text-muted-foreground/60 truncate max-w-[200px] mt-0.5">
                {post.restaurant.address}
              </p>
            </div>
            <div className="flex items-center gap-1 bg-gradient-to-br from-orange-500 to-amber-500 px-2.5 py-1 rounded-xl shadow-xs text-white">
              <Star className="w-3.5 h-3.5 fill-white text-white" />
              <span className="text-xs font-extrabold">
                {post.restaurant.rating}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className="flex items-center gap-1 group"
            >
              <Heart
                className={cn(
                  "w-6 h-6 transition-all",
                  isLiked
                    ? "text-red-500 fill-red-500 scale-110"
                    : "text-foreground group-hover:scale-110"
                )}
              />
              <span className="text-sm font-medium">{formatNumber(likes)}</span>
            </button>
            <button 
              onClick={onCommentClick || onPostClick}
              className="flex items-center gap-1 group"
            >
              <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">
                {formatNumber(post.comments)}
              </span>
            </button>
            <button className="group">
              <Share2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
          </div>
          <button onClick={handleSave} className="group">
            <Bookmark
              className={cn(
                "w-6 h-6 transition-all",
                isSaved
                  ? "text-primary fill-primary scale-110"
                  : "text-foreground group-hover:scale-110"
              )}
            />
          </button>
        </div>

        {/* Caption */}
        <p className="text-sm">
          <span className="font-semibold mr-1">{post.user.username}</span>
          {post.caption}
        </p>

        {/* Time */}
        <p className="text-[10px] text-muted-foreground/45 tracking-wider mt-2.5">{post.createdAt}</p>
      </div>
    </article>
  );
}
