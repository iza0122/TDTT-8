"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Heart, MessageCircle, Bookmark, Share2, MapPin, Star, MoreHorizontal, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface FoodPostProps {
  post: {
    id: string;
    reviewerId?: number;
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
  onLikeToggle?: (isLiked: boolean, likesCount: number) => void;
  onDelete?: () => void;
}

export function FoodPost({ post, priority = false, onPostClick, onCommentClick, onLikeToggle, onDelete }: FoodPostProps) {
  const { token, user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [isSaved, setIsSaved] = useState(post.isSaved);
  const isLikePending = useRef(false);

  const canDelete = user && (user.id === post.reviewerId || user.role === "admin");

  const handleDeletePost = async () => {
    if (!token) return;
    if (!confirm("Bạn có chắc chắn muốn xóa bài viết này không?")) return;
    try {
      const response = await fetch(`/api/content/videos/${post.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        if (onDelete) {
          onDelete();
        }
      } else {
        const errData = await response.json();
        alert(errData.detail || "Không thể xóa bài viết.");
      }
    } catch (err) {
      console.error("Lỗi khi xóa bài viết:", err);
    }
  };

  const handleLike = async () => {
    if (!token || isLikePending.current) return;
    try {
      isLikePending.current = true;
      const nextLiked = !post.isLiked;
      const nextLikes = nextLiked ? post.likes + 1 : post.likes - 1;
      
      // Update parent state instantly for snappy UX!
      if (onLikeToggle) {
        onLikeToggle(nextLiked, nextLikes);
      }

      const res = await fetch(`/api/interact/videos/${post.id}/like`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (onLikeToggle) {
          onLikeToggle(data.liked, data.likes_count);
        }
      }
    } catch (err) {
      console.error("Lỗi khi thả tim bài viết:", err);
    } finally {
      isLikePending.current = false;
    }
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
    <div className="rounded-[2.25rem] bg-white/40 dark:bg-neutral-900/10 border border-neutral-200/50 dark:border-neutral-800/40 p-2 shadow-xl shadow-neutral-200/5 dark:shadow-black/20 backdrop-blur-xl mb-6 transition-all duration-500 hover:shadow-2xl hover:border-orange-500/20 group/post">
      <article className="rounded-[calc(2.25rem-8px)] bg-card border border-neutral-100/70 dark:border-neutral-800/60 overflow-hidden transition-all duration-500 shadow-inner">
        {/* Header */}
        <div className="flex items-center justify-between p-4 relative border-b border-neutral-100/50 dark:border-neutral-900/50">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 ring-2 ring-orange-500/10">
              <AvatarImage src={post.user.avatar} alt={post.user.name} />
              <AvatarFallback>{post.user.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/75 font-semibold">@{post.user.username}</p>
              <div 
                onClick={onPostClick}
                className="flex items-center gap-1.5 text-sm font-extrabold text-neutral-800 dark:text-neutral-100 mt-0.5 hover:text-orange-500 transition-colors cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-orange-500 fill-orange-500/10 stroke-[1.5]" />
                <span>{post.restaurant.name}</span>
              </div>
            </div>
          </div>
          
          {canDelete && (
            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 h-9 w-9"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreHorizontal className="w-4 h-4 text-neutral-500" />
              </Button>
              
              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-36 bg-white dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl shadow-xl py-1.5 z-40 animate-in fade-in slide-in-from-top-1 duration-150">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        handleDeletePost();
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 transition-colors flex items-center gap-2 cursor-pointer"
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


        {/* Image Container with Cinematic Glow */}
        <div 
          onClick={onPostClick}
          className="relative aspect-square cursor-pointer overflow-hidden bg-neutral-950 flex items-center justify-center border-b border-neutral-100/50 dark:border-neutral-900/50"
        >
          {/* Soft Radial Ambient Glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40 select-none">
            <Image
              src={post.image}
              alt=""
              fill
              className="object-cover blur-2xl scale-110"
              sizes="100px"
            />
          </div>
          
          {/* Cinematic ambient spotlight halo layer */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-60 pointer-events-none" />

          {/* Foreground uncropped image */}
          <Image
            src={post.image}
            alt={post.caption}
            fill
            className="object-contain transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/post:scale-[1.02]"
            sizes="(max-width: 512px) 100vw, 512px"
            priority={priority}
            loading={priority ? "eager" : "lazy"}
          />
        </div>

        {/* Actions and Content */}
        <div className="p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className="flex items-center gap-1.5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-110 active:scale-95 text-neutral-600 dark:text-neutral-400 hover:text-red-500 group/like"
              >
                <Heart
                  className={cn(
                    "w-5 h-5 stroke-[1.5] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                    post.isLiked
                      ? "text-red-500 fill-red-500 stroke-[2] scale-110"
                      : "group-hover/like:stroke-red-500 group-hover/like:scale-105"
                  )}
                />
                <span className="text-xs font-bold tracking-wide">{formatNumber(post.likes)}</span>
              </button>
              
              <button 
                onClick={onCommentClick || onPostClick}
                className="flex items-center gap-1.5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-110 active:scale-95 text-neutral-600 dark:text-neutral-400 hover:text-orange-500 group/comment"
              >
                <MessageCircle className="w-5 h-5 stroke-[1.5] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/comment:stroke-orange-500 group-hover/comment:scale-105" />
                <span className="text-xs font-bold tracking-wide">
                  {formatNumber(post.comments)}
                </span>
              </button>
              
              <button className="transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-110 active:scale-95 text-neutral-600 dark:text-neutral-400 hover:text-blue-500 group/share">
                <Share2 className="w-5 h-5 stroke-[1.5] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/share:stroke-blue-500 group-hover/share:scale-105" />
              </button>
            </div>
            
            <button 
              onClick={handleSave} 
              className="transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-110 active:scale-95 text-neutral-600 dark:text-neutral-400 hover:text-amber-500 group/save"
            >
              <Bookmark
                className={cn(
                  "w-5 h-5 stroke-[1.5] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                  isSaved
                    ? "text-amber-500 fill-amber-500 stroke-[2] scale-110"
                    : "group-hover/save:stroke-amber-500 group-hover/save:scale-105"
                )}
              />
            </button>
          </div>

          {/* Caption */}
          <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
            <span className="font-bold text-neutral-900 dark:text-neutral-100 mr-2">@{post.user.username}</span>
            {post.caption}
          </p>

          {/* Time */}
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-semibold">{post.createdAt}</p>
        </div>
      </article>
    </div>
  );
}
