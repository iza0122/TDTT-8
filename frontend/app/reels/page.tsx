"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ReelCard } from "@/components/reel-card";
import { Home, Camera, MessageCircle, Send, Heart, Smile, Music2, MapPin, X, ChevronRight, Bookmark, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

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

const quickEmojis = ["🤤", "😍", "🔥", "👏", "💯"];

export default function ReelsPage() {
  const { user, token } = useAuth();
  const displayName = user?.full_name || "Khách";
  const displayUsername = user?.email ? user.email.split('@')[0] : "guest";
  const displayAvatar = user?.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop";

  const [activeIndex, setActiveIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [reelsList, setReelsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeComments, setActiveComments] = useState<Comment[]>([]);
  const [isFetchingComments, setIsFetchingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("reels-muted");
      return stored === null ? true : stored === "true";
    }
    return true;
  });

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    localStorage.setItem("reels-muted", String(newMuted));
  };

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchReels = async () => {
      try {
        const response = await fetch("/api/content/videos?post_type=video", {
          headers: token ? { "Authorization": `Bearer ${token}` } : {}
        });
        if (response.ok) {
          const data = await response.json();
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
              address: item.restaurant?.address || ""
            },
            video: item.video_url || "",
            thumbnail: item.thumbnail_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600",
            caption: item.description || item.title,
            likes: item.likes_count,
            comments: item.comments_count || 0,
            shares: 0,
            music: "Âm thanh gốc - " + (item.user?.full_name || "Blogger"),
            isLiked: item.is_liked || false
          }));
          setReelsList(mapped);
        }
      } catch (err) {
        console.error("Lỗi khi tải reels từ API:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReels();
  }, [token]);

  const searchParams = useSearchParams();
  useEffect(() => {
    if (reelsList.length === 0) return;
    const targetId = searchParams.get("id");
    if (targetId) {
      const idx = reelsList.findIndex((r: any) => String(r.id) === String(targetId));
      if (idx !== -1) {
        setActiveIndex(idx);
        setTimeout(() => {
          if (containerRef.current) {
            const children = containerRef.current.children;
            if (children && children[idx]) {
              children[idx].scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }
        }, 100);
      }
    }
  }, [searchParams, reelsList]);

  // Auto detect mobile/desktop client-side
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setShowComments(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const itemHeight = container.clientHeight;
      const newIndex = Math.round(scrollTop / itemHeight);
      if (newIndex !== activeIndex && newIndex >= 0 && newIndex < reelsList.length) {
        setActiveIndex(newIndex);
        setReplyingTo(null);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [activeIndex, reelsList]);

  const activeReel = reelsList[activeIndex];

  // Fetch comments dynamically when activeReel changes
  useEffect(() => {
    if (!activeReel?.id) {
      setActiveComments([]);
      return;
    }
    const fetchComments = async () => {
      setIsFetchingComments(true);
      try {
        const response = await fetch(`/api/interact/videos/${activeReel.id}/comments`);
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
            createdAt: "Vừa xong",
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
              createdAt: "Vừa xong",
              likes: r.likes_count
            })) : []
          }));
          setActiveComments(mapped);
        }
      } catch (err) {
        console.error("Lỗi khi tải bình luận reels:", err);
      } finally {
        setIsFetchingComments(false);
      }
    };
    fetchComments();
  }, [activeReel?.id]);

  const handleSendComment = async (textToSend = newCommentText, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = typeof textToSend === "string" ? textToSend.trim() : newCommentText.trim();
    if (!text || !activeReel) return;

    try {
      const response = await fetch(`/api/interact/videos/${activeReel.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          content: text,
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

        setReelsList(prev => prev.map(r => {
          if (r.id === activeReel.id) {
            return { ...r, comments: r.comments + 1 };
          }
          return r;
        }));
      }
    } catch (err) {
      console.error("Lỗi khi gửi bình luận reels:", err);
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
          <div className="bg-neutral-100/60 dark:bg-neutral-900/35 border border-neutral-200/50 dark:border-white/5 rounded-2xl px-4 py-2.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:border-neutral-300 dark:hover:border-white/10 transition-all duration-300">
            <p className="text-[10px] font-extrabold text-foreground flex items-center gap-1.5 flex-wrap">
              <span>{comment.user.name}</span>
              <span className="text-[9px] text-muted-foreground/60 font-medium">
                @{comment.user.username}
              </span>
            </p>
            <p className="text-xs text-foreground mt-0.5 leading-relaxed break-words font-medium">
              {comment.content}
            </p>
          </div>
          
          {/* Comment actions with custom premium emoji controls */}
          <div className="flex items-center gap-2 mt-1 px-1 text-[9px] text-muted-foreground/75 font-bold select-none flex-wrap">
            <span className="font-medium text-muted-foreground/45 mr-1">{comment.createdAt}</span>
            
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
              className="hover:text-red-500 hover:bg-red-500/5 px-2 py-0.5 rounded-md transition-all duration-300 flex items-center gap-1 cursor-pointer"
            >
              <span>{comment.likes > 0 ? "❤️" : "🤍"} Thích</span>
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
                  try {
                    const response = await fetch(`/api/interact/comments/${comment.id}`, {
                      method: "DELETE",
                      headers: {
                        "Authorization": `Bearer ${token}`
                      }
                    });
                    if (response.ok) {
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
                      setReelsList(prev => prev.map(r => {
                        if (r.id === activeReel.id) {
                          return { ...r, comments: Math.max(0, r.comments - 1) };
                        }
                        return r;
                      }));
                    } else {
                      const errData = await response.json();
                      alert(errData.detail || "Không thể xóa bình luận.");
                    }
                  } catch (err) {
                    console.error("Lỗi khi xóa bình luận:", err);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 relative overflow-hidden select-none">
        {/* Shimmering Glass Loader */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 pointer-events-none" />
        <div className="relative z-10 p-6 bg-white/5 border border-white/10 rounded-2xl shadow-xl backdrop-blur-md flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground font-extrabold uppercase tracking-widest animate-pulse">Đang tải Reels...</p>
        </div>
      </div>
    );
  }

  if (reelsList.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center relative overflow-hidden select-none antialiased">
        {/* Decorative background gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 pointer-events-none" />

        <div className="relative z-10 max-w-sm space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-orange-500/10 rounded-3xl flex items-center justify-center mx-auto text-orange-500 shadow-lg border border-orange-500/20 animate-bounce">
            <Camera className="w-10 h-10" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-black bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              Chưa có Reels nào
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
              Cộng đồng chưa có video review ẩm thực ngắn nào được đăng tải. Hãy là người đầu tiên chia sẻ món ngon của bạn!
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-4 justify-center">
            <Link href="/create">
              <Button className="w-full h-12 rounded-full text-xs font-bold bg-primary text-white hover:bg-primary/90 shadow-md">
                <Camera className="w-4 h-4 mr-2" />
                Tải lên Video đầu tiên
              </Button>
            </Link>
            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full h-12 rounded-full text-xs font-bold border-border bg-card">
                Quay lại Trang chủ
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background dark:bg-black overflow-hidden flex w-full">
      {/* Main Reels Panel (Left) */}
      <div className="flex-1 h-full relative flex flex-col justify-between">
        {/* Floating Header Actions (Floating Circular Buttons like Map) */}
        <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
          <Link href="/" className="pointer-events-auto">
            <button
              className="w-10 h-10 rounded-full bg-black/40 dark:bg-black/60 backdrop-blur-md border border-white/20 shadow-xl flex items-center justify-center hover:bg-orange-500 hover:border-orange-500 active:scale-95 transition-all duration-300 text-white cursor-pointer"
              aria-label="Trở về trang chủ"
            >
              <Home className="w-5 h-5" />
            </button>
          </Link>
          <Link href="/create" className="pointer-events-auto">
            <button
              className="w-10 h-10 rounded-full bg-black/40 dark:bg-black/60 backdrop-blur-md border border-white/20 shadow-xl flex items-center justify-center hover:bg-orange-500 hover:border-orange-500 active:scale-95 transition-all duration-300 text-white cursor-pointer"
              aria-label="Đăng tin mới"
            >
              <Camera className="w-5 h-5" />
            </button>
          </Link>
        </div>

        {/* Reels Container */}
        <div
          ref={containerRef}
          className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        >
          {reelsList.map((reel, index) => (
            <div key={`reel-${reel.id}-${index}`} className="h-full w-full snap-start animate-fade-in">
              <ReelCard 
                reel={reel} 
                isActive={index === activeIndex} 
                onCommentClick={() => setShowComments(!showComments)}
                isCommentsOpen={showComments}
                isMuted={isMuted}
                onMuteToggle={toggleMute}
                onLikeToggle={(isLiked, likesCount) => {
                  setReelsList(prev => prev.map(r => {
                    if (r.id === reel.id) {
                      return { ...r, isLiked, likes: likesCount };
                    }
                    return r;
                  }));
                }}
                onDelete={() => {
                  setReelsList(prev => {
                    const filtered = prev.filter(r => r.id !== reel.id);
                    if (activeIndex >= filtered.length && filtered.length > 0) {
                      setActiveIndex(filtered.length - 1);
                    }
                    return filtered;
                  });
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Right Comments Tab (Desktop - Ethereal Glass Side Panel) - OUTER SHELL (Double-Bezel Architecture) */}
      {showComments && !isMobile && activeReel && (
        <div className="hidden md:flex flex-col w-[380px] lg:w-[430px] border-l border-border/40 bg-card/65 dark:bg-neutral-900/65 backdrop-blur-xl h-full shadow-2xl animate-in slide-in-from-right duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-25 p-2 border border-white/5">
          
          {/* INNER CORE (Double-Bezel) */}
          <div className="flex flex-col w-full h-full rounded-[2rem] bg-card/85 dark:bg-card/45 overflow-hidden border border-white/5 shadow-inner">
            {/* Header */}
            <div className="p-4 border-b border-border/40 flex items-center justify-between flex-shrink-0 bg-secondary/20 dark:bg-neutral-800/10">
              <div className="flex items-center gap-3">
                <Avatar className="w-9 h-9 ring-2 ring-orange-500/20">
                  <AvatarImage src={activeReel.user.avatar} alt={activeReel.user.name} />
                  <AvatarFallback>{activeReel.user.name[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-sm text-foreground truncate">@{activeReel.user.username}</h3>
                  <p className="text-[10px] text-muted-foreground/60 font-semibold truncate">{activeReel.user.name}</p>
                </div>
              </div>
              <Button size="sm" className="h-7 text-xs font-extrabold bg-orange-500 hover:bg-orange-600 px-4 rounded-full text-white hover:scale-105 active:scale-95 transition-all duration-300">
                Theo dõi
              </Button>
            </div>

            {/* Reel Details & Restaurant Info */}
            <div className="p-4.5 bg-secondary/15 dark:bg-neutral-800/5 border-b border-border/30 space-y-3 flex-shrink-0">
              <p className="text-xs text-foreground leading-relaxed font-semibold break-words">{activeReel.caption}</p>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/10 px-3 py-1.5 rounded-full text-[10px] font-extrabold text-orange-500 cursor-pointer shadow-xs hover:bg-orange-500 hover:text-white transition-all duration-300">
                  <MapPin className="w-3.5 h-3.5 fill-current/15" />
                  <span>{activeReel.restaurant.name}</span>
                </div>
              </div>
            </div>

            {/* Scrollable Comments Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              <h4 className="font-extrabold text-[10px] text-muted-foreground/60 uppercase tracking-wider px-0.5">
                Bình luận ({activeComments.length})
              </h4>

              {isFetchingComments ? (
                <div className="space-y-4 py-2">
                  {[1, 2, 3].map((i) => (
                    <div key={`reel-comment-skeleton-${i}`} className="flex gap-3 animate-pulse">
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
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground/60 py-12 px-4 space-y-2">
                  <MessageCircle className="w-9 h-9 stroke-1 text-muted-foreground/45" />
                  <p className="text-xs font-semibold">Chưa có bình luận nào</p>
                  <p className="text-[10px] max-w-[200px]">Hãy là người đầu tiên chia sẻ cảm nhận về món ăn này nhé!</p>
                </div>
              )}
            </div>

            {/* Action Footer: Input comment & quick emojis */}
            <div className="p-4.5 bg-card/95 border-t border-border/30 flex-shrink-0">
              {replyingTo && (
                <div className="flex items-center justify-between bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-1.5 mb-2 text-[10px] font-bold text-orange-500 animate-in fade-in duration-200">
                  <span>Đang phản hồi @{replyingTo.user.username}</span>
                  <button 
                    onClick={() => setReplyingTo(null)}
                    className="text-[9px] hover:underline cursor-pointer opacity-80"
                  >
                    Hủy
                  </button>
                </div>
              )}

              {/* Quick Emojis - spring style pills */}
              <div className="flex items-center gap-2 mb-3.5 px-1">
                <span className="text-[9px] text-muted-foreground/60 font-extrabold uppercase tracking-wider flex-shrink-0">Nhanh:</span>
                <div className="flex items-center gap-1.5 flex-1 overflow-x-auto scrollbar-hide py-0.5">
                  {quickEmojis.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleSendComment(emoji)}
                      className="w-7 h-7 rounded-full bg-secondary/50 hover:bg-orange-500/15 border border-border/40 flex items-center justify-center text-xs active:scale-90 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer shadow-xs hover:scale-110"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={(e) => handleSendComment(newCommentText, e)} className="flex items-center gap-2.5">
                <Avatar className="w-8 h-8 flex-shrink-0 ring-2 ring-orange-500/15">
                  <AvatarImage src={displayAvatar} alt={displayName} />
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">{displayName[0]}</AvatarFallback>
                </Avatar>
                <div className="relative flex-1 group">
                  <input
                    id="detail-comment-input"
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder={replyingTo ? `Phản hồi @${replyingTo.user.username}...` : "Viết bình luận ẩm thực..."}
                    className="w-full bg-secondary/35 hover:bg-secondary/50 focus:bg-background text-foreground text-xs placeholder:text-muted-foreground/60 pl-3.5 pr-14 py-2.5 rounded-full border border-border/40 focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all duration-300 font-semibold"
                  />
                  <button
                    type="submit"
                    disabled={!newCommentText.trim()}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-full text-orange-500 hover:bg-orange-500/10 disabled:opacity-40 disabled:hover:bg-transparent transition-all active:scale-90 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Drawer Comments Sheet */}
      {isMobile && activeReel && (
        <Sheet open={showComments} onOpenChange={setShowComments}>
          <SheetContent side="bottom" className="h-[75vh] p-0 flex flex-col rounded-t-[36px] border-t border-border/20 bg-background/90 backdrop-blur-xl z-50">
            <SheetHeader className="p-4 border-b border-border/30 flex-shrink-0">
              <SheetTitle className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Bình luận ({activeComments.length})</span>
              </SheetTitle>
            </SheetHeader>

            {/* Scrollable Comments area */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4 scrollbar-hide">
              {activeComments.length > 0 ? (
                <div className="divide-y divide-border/10 pb-4">
                  {activeComments.map(c => renderComment(c))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground/60 py-12 px-4 space-y-2">
                  <MessageCircle className="w-8 h-8 stroke-1 text-muted-foreground/45" />
                  <p className="text-xs font-semibold">Chưa có bình luận nào</p>
                  <p className="text-[10px] max-w-[200px]">Hãy là người đầu tiên chia sẻ cảm nhận về món ăn này nhé!</p>
                </div>
              )}
            </div>

            {/* Form & Actions Footer */}
            <div className="p-4 bg-card border-t border-border/40 flex-shrink-0">
              {replyingTo && (
                <div className="flex items-center justify-between bg-orange-500/10 border border-orange-500/20 rounded-xl px-2.5 py-1.5 mb-2 text-[10px] font-bold text-orange-500">
                  <span>Đang phản hồi @{replyingTo.user.username}</span>
                  <button 
                    onClick={() => setReplyingTo(null)}
                    className="text-[9px] hover:underline cursor-pointer opacity-80"
                  >
                    Hủy
                  </button>
                </div>
              )}

              {/* Quick Emojis */}
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-[10px] text-muted-foreground font-bold flex-shrink-0">Nhanh:</span>
                <div className="flex items-center gap-1.5 flex-1 overflow-x-auto scrollbar-hide py-0.5">
                  {quickEmojis.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleSendComment(emoji)}
                      className="w-7 h-7 rounded-full bg-secondary hover:bg-orange-500/15 border border-border/40 flex items-center justify-center text-xs active:scale-90 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer shadow-xs"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={(e) => handleSendComment(newCommentText, e)} className="flex items-center gap-2 pb-6">
                <Avatar className="w-8 h-8 flex-shrink-0 ring-1 ring-primary/25">
                  <AvatarImage src={displayAvatar} alt={displayName} />
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">{displayName[0]}</AvatarFallback>
                </Avatar>
                <div className="relative flex-1 group">
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder={replyingTo ? `Phản hồi @${replyingTo.user.username}...` : "Viết bình luận ẩm thực..."}
                    className="w-full bg-secondary/50 hover:bg-secondary/70 focus:bg-background text-foreground text-xs placeholder:text-muted-foreground/60 pl-3.5 pr-10 py-2.5 rounded-full border border-border/60 focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all duration-300 font-semibold"
                  />
                  <button
                    type="submit"
                    disabled={!newCommentText.trim()}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-full text-orange-500 hover:bg-orange-500/10 disabled:opacity-40 disabled:hover:bg-transparent transition-all active:scale-95 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
