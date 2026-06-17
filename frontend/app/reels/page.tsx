"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ReelCard } from "@/components/reel-card";
import { Home, Camera, MessageCircle, Send, Heart, Smile, Music2, MapPin, X, ChevronRight, Bookmark, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { formatRelativeTime } from "@/lib/time";
import { globalAppCache } from "@/lib/cache";

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
  isLiked?: boolean;
}

const quickEmojis = ["🤤", "😍", "🔥", "👏", "💯"];

export default function ReelsPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const displayName = user?.full_name || "Khách";
  const displayUsername = user?.email ? user.email.split('@')[0] : "guest";
  const displayAvatar = user?.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop";

  const [activeIndex, setActiveIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [reelsList, setReelsList] = useState<any[]>(() => {
    return globalAppCache.reels || [];
  });
  const [isLoading, setIsLoading] = useState(() => {
    return !globalAppCache.reels;
  });
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

  const handleFollowToggleActiveReel = async () => {
    if (!token) {
      toast({
        title: "Yêu cầu đăng nhập",
        description: "Vui lòng đăng nhập để thực hiện chức năng này.",
        variant: "destructive"
      });
      router.push("/login");
      return;
    }
    if (!activeReel) return;

    const reviewerId = activeReel.reviewerId;
    const isCurrentlyFollowing = activeReel.user.is_following;
    const endpoint = `/api/interact/users/${reviewerId}/${isCurrentlyFollowing ? "unfollow" : "follow"}`;
    const method = isCurrentlyFollowing ? "DELETE" : "POST";

    try {
      // Optimistic Update
      setReelsList(prev => prev.map(r => {
        if (r.reviewerId === reviewerId) {
          return {
            ...r,
            user: { ...r.user, is_following: !isCurrentlyFollowing }
          };
        }
        return r;
      }));

      const res = await fetch(endpoint, {
        method: method,
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setReelsList(prev => prev.map(r => {
          if (r.reviewerId === reviewerId) {
            return {
              ...r,
              user: { ...r.user, is_following: data.is_following }
            };
          }
          return r;
        }));
      } else {
        // Rollback
        setReelsList(prev => prev.map(r => {
          if (r.reviewerId === reviewerId) {
            return {
              ...r,
              user: { ...r.user, is_following: isCurrentlyFollowing }
            };
          }
          return r;
        }));
      }
    } catch (err) {
      console.error("Lỗi khi theo dõi:", err);
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchReels = async () => {
      if (!globalAppCache.reels) {
        setIsLoading(true);
      }
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
              avatar: item.user?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
              is_following: item.user?.is_following || false
            },
            restaurant: {
              name: item.restaurant?.name || "Quán ăn ẩm thực",
              address: item.restaurant?.address || "",
              ownerId: item.restaurant?.owner_id
            },
            video: item.video_url || "",
            thumbnail: item.thumbnail_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600",
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
            music: "Âm thanh gốc - " + (item.user?.full_name || "Blogger"),
            isLiked: item.is_liked || false
          }));
          setReelsList(mapped);
          globalAppCache.reels = mapped;
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
      <div key={comment.id} className={cn("flex gap-3", isReply ? "mt-3 pl-6 border-l-2 border-primary/20 md:pl-8" : "mt-4.5")}>
        <Avatar className="w-7 h-7 flex-shrink-0 ring-1 ring-primary/10">
          <AvatarImage src={comment.user.avatar} alt={comment.user.name} />
          <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-bold">{comment.user.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="bg-[#F3F2EB]/85 dark:bg-[#121212]/60 rounded-2xl px-3.5 py-2.5 border border-neutral-200/30 dark:border-white/5 hover:border-neutral-300 dark:hover:border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] transition-all duration-300">
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

          {/* Comment actions */}
          <div className="flex items-center gap-3.5 mt-1 px-1.5 text-[9px] text-muted-foreground/85 font-bold select-none">
            <span className="font-medium text-muted-foreground/45">{comment.createdAt}</span>
            <button
              onClick={async () => {
                const isLiked = !!comment.isLiked;
                const nextLiked = !isLiked;
                const nextLikes = nextLiked ? comment.likes + 1 : Math.max(0, comment.likes - 1);
                
                // Optimistic Update
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
                    // Rollback
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
                  // Rollback
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
              className="hover:text-orange-500 transition-colors flex items-center gap-0.5 cursor-pointer"
            >
              <span>{comment.isLiked ? "❤️" : (comment.likes > 0 && comment.isLiked !== false ? "❤️" : "🤍")} Thích</span>
              {comment.likes > 0 && <span className="text-[8px] bg-primary/10 px-1 rounded-sm text-primary">{comment.likes}</span>}
            </button>
            <button
              onClick={() => setReplyingTo(comment)}
              className="hover:text-orange-500 transition-colors cursor-pointer"
            >
              <span>💬 Phản hồi</span>
            </button>
            {user && (user.id === Number(comment.userId) || user.id === Number(activeReel.restaurant?.ownerId) || user.role === "admin") && (
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
                  
                  // Optimistic decrement in reels list count
                  setReelsList(prev => prev.map(r => {
                    if (r.id === activeReel.id) {
                      return { ...r, comments: Math.max(0, r.comments - 1) };
                    }
                    return r;
                  }));

                  try {
                    const response = await fetch(`/api/interact/comments/${comment.id}`, {
                      method: "DELETE",
                      headers: {
                        "Authorization": `Bearer ${token}`
                      }
                    });
                    if (!response.ok) {
                      // Rollback
                      setActiveComments(originalComments);
                      setReelsList(prev => prev.map(r => {
                        if (r.id === activeReel.id) {
                          return { ...r, comments: r.comments + 1 };
                        }
                        return r;
                      }));
                      const errData = await response.json();
                      toast({
                        title: "Thao tác thất bại",
                        description: errData.detail || "Không thể xóa bình luận.",
                        variant: "destructive"
                      });
                    }
                  } catch (err) {
                    console.error("Lỗi khi xóa bình luận:", err);
                    // Rollback
                    setActiveComments(originalComments);
                    setReelsList(prev => prev.map(r => {
                      if (r.id === activeReel.id) {
                        return { ...r, comments: r.comments + 1 };
                      }
                      return r;
                    }));
                  }
                }}
                className="hover:text-red-500 text-red-500/80 transition-colors cursor-pointer flex items-center gap-0.5"
              >
                <Trash2 className="w-3 h-3" />
                <span>Xóa</span>
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
                onShareUpdate={(sharesCount) => {
                  setReelsList(prev => prev.map(r => {
                    if (r.id === reel.id) {
                      return { ...r, shares: sharesCount };
                    }
                    return r;
                  }));
                }}
                onFollowToggle={(isFollowing) => {
                  setReelsList(prev => prev.map(r => {
                    if (r.reviewerId === reel.reviewerId) {
                      return {
                        ...r,
                        user: { ...r.user, is_following: isFollowing }
                      };
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
        <div className="hidden md:flex flex-col w-[380px] lg:w-[430px] border-l border-border/40 bg-gradient-to-br from-white/15 via-white/5 to-orange-500/5 dark:from-black/45 dark:via-black/25 dark:to-orange-950/15 h-full shadow-2xl animate-in slide-in-from-right duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-25 p-2 border border-white/5">

          {/* INNER CORE - Premium Warm Cream (Light) & Obsidian Charcoal (Dark) Bezel */}
          <div className="relative flex flex-col w-full h-full rounded-[2rem] bg-[#FAF9F6]/98 dark:bg-[#0A0A0A]/95 overflow-hidden border border-white/5 shadow-inner">
            {/* Subtle ambient premium spotlight halos */}
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] bg-gradient-to-br from-orange-500/8 to-amber-500/0 rounded-full blur-3xl pointer-events-none select-none dark:from-orange-500/4" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-gradient-to-tr from-pink-500/4 to-rose-500/0 rounded-full blur-3xl pointer-events-none select-none dark:from-rose-500/4" />
            {/* Header */}
            <div className="p-4 border-b border-border/40 flex items-center justify-between flex-shrink-0 bg-secondary/20 dark:bg-neutral-800/10">
              <div className="flex items-center gap-3">
                <Link href={`/profile/${activeReel.reviewerId}`}>
                  <Avatar className="w-9 h-9 ring-2 ring-orange-500/20 cursor-pointer">
                    <AvatarImage src={activeReel.user.avatar} alt={activeReel.user.name} />
                    <AvatarFallback>{activeReel.user.name[0]}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="min-w-0">
                  <Link href={`/profile/${activeReel.reviewerId}`} className="hover:underline cursor-pointer">
                    <h3 className="font-extrabold text-sm text-foreground truncate">@{activeReel.user.username}</h3>
                  </Link>
                  <p className="text-[10px] text-muted-foreground/60 font-semibold truncate">{activeReel.user.name}</p>
                </div>
              </div>
              {user?.id !== activeReel.reviewerId && (
                <Button 
                  size="sm" 
                  onClick={handleFollowToggleActiveReel}
                  className={cn(
                    "h-7 text-xs font-extrabold px-4 rounded-full hover:scale-105 active:scale-95 transition-all duration-300 border cursor-pointer",
                    activeReel.user.is_following 
                      ? "bg-secondary text-neutral-400 dark:text-neutral-500 hover:text-foreground border-neutral-200 dark:border-neutral-800" 
                      : "bg-orange-500 hover:bg-orange-600 text-white border-orange-500/20"
                  )}
                >
                  {activeReel.user.is_following ? "Đang theo dõi" : "Theo dõi"}
                </Button>
              )}
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
            <div className="p-4.5 bg-[#FAF9F6]/95 dark:bg-[#0A0A0A]/95 border-t border-border/30 flex-shrink-0">
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
