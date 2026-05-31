"use client";
 
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Heart, MessageCircle, Share2, Music2, Play, Pause, MapPin, MoreVertical, Volume2, VolumeX, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface ReelCardProps {
  reel: {
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
    };
    video: string;
    thumbnail?: string;
    caption: string;
    likes: number;
    comments: number;
    shares: number;
    music: string;
    isLiked?: boolean;
  };
  isActive: boolean;
  onCommentClick?: () => void;
  isCommentsOpen?: boolean;
  isMuted: boolean;
  onMuteToggle: () => void;
  onLikeToggle?: (isLiked: boolean, likesCount: number) => void;
  onDelete?: () => void;
}

export function ReelCard({ reel, isActive, onCommentClick, isCommentsOpen = false, isMuted, onMuteToggle, onLikeToggle, onDelete }: ReelCardProps) {
  const { token, user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(reel.isLiked || false);
  const [likes, setLikes] = useState(reel.likes);
  const [isPlaying, setIsPlaying] = useState(isActive);

  useEffect(() => {
    setIsLiked(reel.isLiked || false);
    setLikes(reel.likes);
  }, [reel]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const hasPlayedRef = useRef(false);

  useEffect(() => {
    hasPlayedRef.current = false;
  }, [reel.video]);

  // Sync play/pause with isActive and isPlaying states
  useEffect(() => {
    setIsPlaying(isActive);
  }, [isActive]);

  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
    
    if (isActive && isPlayingRef.current) {
      // Check if user has interacted with the document yet
      const hasInteraction = typeof window !== "undefined" && 
        ((window.navigator as any).userActivation?.hasBeenActive ?? false);
      
      // If there has been no interaction yet (e.g. first load) and video is paused,
      // skip programmatic autoplay to prevent browser blocking and element tainting.
      if (!hasInteraction && video.paused) {
        console.log("ℹ️ [ReelCard:Video] Bỏ qua tự động phát ở lần đầu tải trang (Chưa có tương tác từ người dùng) để tránh bị Safari/Chrome khóa cứng thẻ video.");
        setIsPlaying(false);
        return;
      }

      if (video.paused) {
        console.log(`🎬 [ReelCard:Video] Đang chuẩn bị tự động phát video: ${reel.video}`);
        video.play()
          .then(() => {
            console.log(`✅ [ReelCard:Video] Tự động phát thành công: ${reel.video}`);
            hasPlayedRef.current = true;
          })
          .catch((err) => {
            console.warn("❌ [ReelCard:Video] Trình duyệt chặn tự động phát:", err.message || err);
            setIsPlaying(false);
          });
      }
    } else {
      if (!video.paused) {
        console.log(`⏸️ [ReelCard:Video] Đang dừng phát video do mất kích hoạt (inactive): ${reel.video}`);
        video.pause();
      }
    }
  }, [isActive, isMuted, reel.video]);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      console.log(`⏸️ [ReelCard:Video] Người dùng bấm Dừng phát video (Manual Pause): ${reel.video}`);
      video.pause();
      setIsPlaying(false);
    } else {
      video.muted = isMuted;
      
      // Play synchronously inside the click stack to bypass iOS Safari gesture checking
      if (!hasPlayedRef.current) {
        console.log(`🔄 [ReelCard:Video] Phát lần đầu. Reset đồng bộ (load()) thẻ video để xóa trạng thái bị chặn của Safari: ${reel.video}`);
        video.load();
      } else {
        console.log(`▶️ [ReelCard:Video] Tiếp tục phát từ vị trí cũ: ${reel.video}`);
      }

      video.play()
        .then(() => {
          console.log(`✅ [ReelCard:Video] Phát đồng bộ theo cử chỉ người dùng thành công: ${reel.video}`);
          hasPlayedRef.current = true;
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error("❌ [ReelCard:Video] Phát video thất bại hoàn toàn:", err);
          setIsPlaying(false);
        });
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMuteToggle();
  };

  const handleLike = async () => {
    if (!token) return;
    try {
      const nextLiked = !isLiked;
      const nextLikes = nextLiked ? likes + 1 : likes - 1;
      
      // Update local state instantly for snappy UX
      setIsLiked(nextLiked);
      setLikes(nextLikes);
      if (onLikeToggle) {
        onLikeToggle(nextLiked, nextLikes);
      }

      const res = await fetch(`/api/interact/videos/${reel.id}/like`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setIsLiked(data.liked);
        setLikes(data.likes_count);
        if (onLikeToggle) {
          onLikeToggle(data.liked, data.likes_count);
        }
      }
    } catch (err) {
      console.error("Lỗi khi thả tim Reels:", err);
    }
  };

  const canDelete = user && (user.id === reel.reviewerId || user.role === "admin");

  const handleDeleteReel = async () => {
    if (!token) return;
    if (!confirm("Bạn có chắc chắn muốn xóa reel này không?")) return;
    try {
      const response = await fetch(`/api/content/videos/${reel.id}`, {
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
        alert(errData.detail || "Không thể xóa reel.");
      }
    } catch (err) {
      console.error("Lỗi khi xóa reel:", err);
    }
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

  const isVideoFile = reel.video.endsWith(".mp4") || reel.video.includes("video") || reel.video.includes("mixkit.co");

  return (
    <div className="relative h-full w-full bg-background dark:bg-black flex items-center justify-center snap-start md:py-6 select-none">
      {/* Wrapper to allow placing actions next to video on desktop */}
      <div className="relative flex items-end md:items-center justify-center h-full w-full max-w-[100vw] md:max-w-none md:w-auto md:gap-6">
        
        {/* Video/Image Container - Portrait 9:16 - OUTER BEZEL (Double-Bezel Architecture) */}
        <div className="relative w-full h-full max-w-[100vw] md:max-w-[calc((100vh-48px)*9/16)] md:h-[calc(100vh-48px)] aspect-[9/16] md:aspect-auto md:p-1.5 md:rounded-[44px] md:bg-white/10 dark:md:bg-black/35 md:border md:border-white/20 dark:md:border-white/10 md:shadow-[0_24px_50px_rgba(0,0,0,0.4)] backdrop-blur-xl bg-black flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
          
          {/* INNER CORE - Device screen */}
          <div className="relative w-full h-full rounded-none md:rounded-[36px] overflow-hidden bg-black flex items-center justify-center">
            {/* Blurred ambient backdrop */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40 select-none">
              {isVideoFile ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={reel.thumbnail || reel.video}
                  alt=""
                  className="w-full h-full object-cover blur-2xl scale-110"
                />
              ) : (
                <Image
                  src={reel.video}
                  alt=""
                  fill
                  className="object-cover blur-2xl scale-110"
                  sizes="50vw"
                />
              )}
            </div>

            {/* Foreground uncropped media */}
            {isVideoFile ? (
              <video
                key={reel.video}
                ref={videoRef}
                src={reel.video}
                poster={reel.thumbnail}
                className="relative z-10 w-full h-full object-contain pointer-events-none"
                loop
                muted={isMuted}
                playsInline
                autoPlay={isActive}
                preload="metadata"
              />
            ) : (
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <Image
                  src={reel.video}
                  alt={reel.caption}
                  fill
                  className="object-contain animate-fade-in duration-300"
                  sizes="(max-width: 768px) 100vw, 56.25vh"
                  priority
                  loading="eager"
                />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60 z-10 pointer-events-none" />

            {/* Play/Pause Overlay */}
            <button
              onClick={handlePlayPause}
              className="absolute inset-0 flex items-center justify-center z-20 cursor-pointer pointer-events-auto"
            >
              {!isPlaying && (
                <div className="w-16 h-16 bg-white/25 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 duration-300">
                  <Play className="w-8 h-8 text-white fill-white ml-1" />
                </div>
              )}
            </button>

            {/* Bottom Info */}
            <div className="absolute bottom-2 left-0 right-14 p-5 z-20 space-y-2">
              {/* User Info */}
              <div className="flex items-center gap-2">
                <span className="text-white font-extrabold text-sm drop-shadow-md">@{reel.user.username}</span>
              </div>

              {/* Caption */}
              <p className="text-white text-xs leading-relaxed font-semibold drop-shadow-sm line-clamp-2">{reel.caption}</p>

              {/* Restaurant floating tag */}
              <div className="flex items-center gap-2 pt-0.5">
                <div className="flex items-center gap-1.5 bg-white/10 border border-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-bold hover:bg-white/20 transition-all duration-300 cursor-pointer shadow-xs">
                  <MapPin className="w-3.5 h-3.5 text-orange-500 fill-orange-500/15" />
                  <span>{reel.restaurant.name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Actions - overlay on mobile, next to device mockup on desktop */}
        <div className="absolute right-3.5 bottom-8 md:static flex flex-col items-center gap-5.5 z-20 select-none">
          {/* User Avatar */}
          <div className="relative group">
            <Avatar className="w-11 h-11 ring-2 ring-white/30 md:ring-orange-500/30 dark:md:ring-white/20 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-105">
              <AvatarImage src={reel.user.avatar} alt={reel.user.name} />
              <AvatarFallback>{reel.user.name[0]}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4.5 h-4.5 bg-orange-500 hover:scale-110 active:scale-90 transition-all rounded-full flex items-center justify-center shadow-md cursor-pointer border border-white/20">
              <span className="text-white text-xs font-bold">+</span>
            </div>
          </div>

          {/* Like */}
          <button onClick={handleLike} className="flex flex-col items-center gap-1 group">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer shadow-lg backdrop-blur-md",
              isLiked 
                ? "bg-red-500/20 border border-red-500/50 text-red-500 scale-105" 
                : "bg-white/15 border border-white/20 text-white hover:bg-red-500 hover:border-red-500 hover:text-white md:bg-neutral-100 md:border-neutral-200/85 md:text-neutral-700 md:hover:bg-red-500 md:hover:border-red-500 md:hover:text-white dark:md:bg-white/10 dark:md:border-white/10 dark:md:text-white dark:md:hover:bg-red-500 dark:md:hover:border-red-500"
            )}>
              <Heart
                className={cn(
                  "w-5 h-5 transition-all duration-300",
                  isLiked ? "fill-red-500 text-red-500 scale-110 animate-fade-in" : "fill-none group-hover:scale-108 group-hover:fill-white"
                )}
              />
            </div>
            <span className="text-white md:text-neutral-800 dark:md:text-white text-[10px] font-extrabold tracking-wide drop-shadow-sm">{formatNumber(likes)}</span>
          </button>

          {/* Comment */}
          <button onClick={onCommentClick} className="flex flex-col items-center gap-1 group">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer shadow-lg backdrop-blur-md",
              isCommentsOpen 
                ? "bg-orange-500/20 border border-orange-500/50 text-orange-500 scale-105" 
                : "bg-white/15 border border-white/20 text-white hover:bg-orange-500 hover:border-orange-500 hover:text-white md:bg-neutral-100 md:border-neutral-200/85 md:text-neutral-700 md:hover:bg-orange-500 md:hover:border-orange-500 md:hover:text-white dark:md:bg-white/10 dark:md:border-white/10 dark:md:text-white dark:md:hover:bg-orange-500 dark:md:hover:border-orange-500"
            )}>
              <MessageCircle className="w-5 h-5 fill-none group-hover:fill-white group-hover:scale-108 transition-all duration-300" />
            </div>
            <span className="text-white md:text-neutral-800 dark:md:text-white text-[10px] font-extrabold tracking-wide drop-shadow-sm">{formatNumber(reel.comments)}</span>
          </button>

          {/* Share */}
          <button className="flex flex-col items-center gap-1 group">
            <div className="w-10 h-10 bg-white/15 border border-white/20 text-white hover:bg-orange-500 hover:border-orange-500 hover:text-white md:bg-neutral-100 md:border-neutral-200/85 md:text-neutral-700 md:hover:bg-orange-500 md:hover:border-orange-500 md:hover:text-white dark:md:bg-white/10 dark:md:border-white/10 dark:md:text-white dark:md:hover:bg-orange-500 dark:md:hover:border-orange-500 rounded-full flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer shadow-lg backdrop-blur-md">
              <Share2 className="w-5 h-5 group-hover:scale-108 transition-all duration-300" />
            </div>
            <span className="text-white md:text-neutral-800 dark:md:text-white text-[10px] font-extrabold tracking-wide drop-shadow-sm">{formatNumber(reel.shares)}</span>
          </button>

          {/* Mute/Unmute sound option */}
          {isVideoFile && (
            <button onClick={toggleMute} className="flex flex-col items-center group">
              <div className="w-10 h-10 bg-white/15 border border-white/20 text-white hover:bg-orange-500 hover:border-orange-500 hover:text-white md:bg-neutral-100 md:border-neutral-200/85 md:text-neutral-700 md:hover:bg-orange-500 md:hover:border-orange-500 md:hover:text-white dark:md:bg-white/10 dark:md:border-white/10 dark:md:text-white dark:md:hover:bg-orange-500 dark:md:hover:border-orange-500 rounded-full flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer shadow-lg backdrop-blur-md">
                {isMuted ? (
                  <VolumeX className="w-5 h-5 group-hover:scale-108 transition-all duration-300" />
                ) : (
                  <Volume2 className="w-5 h-5 group-hover:scale-108 transition-all duration-300" />
                )}
              </div>
            </button>
          )}

          {/* More */}
          {canDelete && (
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer shadow-lg backdrop-blur-md",
                  showMenu 
                    ? "bg-orange-500/20 border border-orange-500/50 text-orange-500 scale-105" 
                    : "bg-white/15 border border-white/20 text-white hover:bg-orange-500 hover:border-orange-500 hover:text-white md:bg-neutral-100 md:border-neutral-200/85 md:text-neutral-700 md:hover:bg-orange-500 md:hover:border-orange-500 md:hover:text-white dark:md:bg-white/10 dark:md:border-white/10 dark:md:text-white dark:md:hover:bg-orange-500 dark:md:hover:border-orange-500"
                )}
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              
              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 bottom-12 md:bottom-auto md:top-12 w-36 bg-card border border-border/80 rounded-xl shadow-lg py-1.5 z-40 animate-in fade-in slide-in-from-bottom-1 md:slide-in-from-top-1 duration-150">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        handleDeleteReel();
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

      </div>
    </div>
  );
}
