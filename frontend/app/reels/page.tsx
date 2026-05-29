"use client";

import { useState, useRef, useEffect } from "react";
import { reels } from "@/lib/data";
import { ReelCard } from "@/components/reel-card";
import { Home, Camera, MessageCircle, Send, Heart, Smile, Music2, MapPin, X, ChevronRight, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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

const defaultReelComments: { [reelId: string]: Comment[] } = {
  "r1": [
    {
      id: "rc1_1",
      user: {
        name: "Hoàng Nam",
        username: "nam_explore",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      },
      content: "Nước dùng bún bò Huế ở đây ngọt thanh thanh, sa tế cay nồng đúng điệu Huế luôn! Nhất định phải thử mọi người ơi 🍜🔥",
      createdAt: "2 giờ trước",
      likes: 142,
      replies: [
        {
          id: "rc1_1_r1",
          user: {
            name: "FoodieVN",
            username: "foodie_vietnam",
            avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
          },
          content: "Cảm ơn bạn nhiều nha! Quán này gia truyền 3 đời rồi đó bạn ơi 🥰",
          createdAt: "1 giờ trước",
          likes: 35,
        }
      ]
    },
    {
      id: "rc1_2",
      user: {
        name: "Linh Chi",
        username: "chi_tastehunter",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
      },
      content: "Nhìn khoanh giò heo chất lượng quá, thêm miếng chả cua siêu to khổng lồ nữa chứ! Thèm xỉu 🤤🤤",
      createdAt: "3 giờ trước",
      likes: 88,
    },
    {
      id: "rc1_3",
      user: {
        name: "Thu Hương",
        username: "huong.foodlover",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      },
      content: "Địa chỉ quán ở đâu thế ạ? Có dễ tìm không bạn?",
      createdAt: "4 giờ trước",
      likes: 12,
    }
  ],
  "r2": [
    {
      id: "rc2_1",
      user: {
        name: "Minh Anh",
        username: "minhanh_foodie",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      },
      content: "Gỏi cuốn Bà Tám thì huyền thoại rồi! Nước chấm tương đen bơ đậu phộng siêu béo ngậy 🥜, cuốn tôm thịt ngập răng luôn á!",
      createdAt: "1 giờ trước",
      likes: 95,
      replies: [
        {
          id: "rc2_1_r1",
          user: {
            name: "Ẩm Thực Đường Phố",
            username: "streetfood_vn",
            avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop",
          },
          content: "Ăn một lần là ghiền luôn đúng không bạn ơi 🥗🤤",
          createdAt: "45 phút trước",
          likes: 18,
        }
      ]
    },
    {
      id: "rc2_2",
      user: {
        name: "Đức Minh",
        username: "ducminh_food",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
      },
      content: "Fresh thực sự, hè nóng nực ăn mấy món cuốn này là chuẩn bài nhất rồi!",
      createdAt: "2 giờ trước",
      likes: 47,
    }
  ],
  "r3": [
    {
      id: "rc3_1",
      user: {
        name: "Linh Chi",
        username: "chi_tastehunter",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
      },
      content: "Sốt trộn hủ tiếu ở đây làm theo công thức riêng ăn đậm đà cuốn lắm mọi người, nhớ xin thêm chén nước súp xương nữa nhé! 🍜",
      createdAt: "5 giờ trước",
      likes: 120,
    },
    {
      id: "rc3_2",
      user: {
        name: "Hoàng Nam",
        username: "nam_explore",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      },
      content: "Nhìn sợi hủ tiếu dai dai bóng bẩy chảy nước miếng luôn trời ơi. Phải ghé quán ngay chiều nay mới được!",
      createdAt: "6 giờ trước",
      likes: 64,
    }
  ],
  "r4": [
    {
      id: "rc4_1",
      user: {
        name: "Thu Hương",
        username: "huong.foodlover",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      },
      content: "Chả cá Lã Vọng thơm phức mùi nghệ và mắm tôm ngon đỉnh chóp! Ăn kèm bún với hành hoa, thì là xào chín ăn tới đâu ấm lòng tới đó 🐟🌿",
      createdAt: "30 phút trước",
      likes: 156,
      replies: [
        {
          id: "rc4_1_r1",
          user: {
            name: "Hà Nội Phố",
            username: "hanoi_pho",
            avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop",
          },
          content: "Ăn chả cá chuẩn Hà Nội xưa thì đúng là tinh hoa ẩm thực luôn bạn ạ! 🥰",
          createdAt: "15 phút trước",
          likes: 42,
        }
      ]
    },
    {
      id: "rc4_2",
      user: {
        name: "Minh Anh",
        username: "minhanh_foodie",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      },
      content: "Giá rổ ở đây thế nào vậy ad? Đi nhóm 4 người hết khoảng bao nhiêu ạ?",
      createdAt: "1 giờ trước",
      likes: 29,
    }
  ]
};

const quickEmojis = ["🤤", "😍", "🔥", "👏", "💯"];

export default function ReelsPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [commentsState, setCommentsState] = useState<{ [reelId: string]: Comment[] }>(defaultReelComments);
  const [newCommentText, setNewCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Auto detect mobile/desktop client-side
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto open comments on desktop on load
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
      if (newIndex !== activeIndex && newIndex >= 0 && newIndex < reels.length) {
        setActiveIndex(newIndex);
        // Clear reply target on slide change
        setReplyingTo(null);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [activeIndex]);

  const activeReel = reels[activeIndex];
  const activeComments = commentsState[activeReel?.id] || [];

  const handleSendComment = (textToSend = newCommentText, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = typeof textToSend === "string" ? textToSend.trim() : newCommentText.trim();
    if (!text || !activeReel) return;

    const newCommentObj: Comment = {
      id: `rc_${Date.now()}`,
      user: {
        name: "Nguyễn Văn A",
        username: "nguyen_foodie",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
      },
      content: text,
      createdAt: "Vừa xong",
      likes: 0,
      replies: []
    };

    if (replyingTo) {
      setCommentsState(prev => {
        const listForReel = prev[activeReel.id] || [];
        const updatedList = listForReel.map(c => {
          if (c.id === replyingTo.id) {
            return {
              ...c,
              replies: [...(c.replies || []), newCommentObj]
            };
          }
          if (c.replies && c.replies.some(r => r.id === replyingTo.id)) {
            return {
              ...c,
              replies: c.replies.map(r => {
                if (r.id === replyingTo.id) {
                  return {
                    ...r,
                    replies: [...(r.replies || []), newCommentObj]
                  };
                }
                return r;
              })
            };
          }
          return c;
        });
        return {
          ...prev,
          [activeReel.id]: updatedList
        };
      });
      setReplyingTo(null);
    } else {
      setCommentsState(prev => ({
        ...prev,
        [activeReel.id]: [...(prev[activeReel.id] || []), newCommentObj]
      }));
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
          <div className="bg-secondary/45 dark:bg-neutral-800/40 rounded-2xl px-3.5 py-2 border border-border/30 hover:border-border/60 transition-colors">
            <p className="text-[11px] font-extrabold text-foreground flex items-center gap-1.5 flex-wrap">
              <span>{comment.user.name}</span>
              <span className="text-[9px] text-muted-foreground/60 font-medium">
                @{comment.user.username}
              </span>
            </p>
            <p className="text-xs text-foreground mt-0.5 leading-relaxed break-words">
              {comment.content}
            </p>
          </div>
          
          {/* Comment actions */}
          <div className="flex items-center gap-3.5 mt-1 px-1.5 text-[9px] text-muted-foreground/80 font-bold select-none">
            <span className="font-medium text-muted-foreground/45">{comment.createdAt}</span>
            <button 
              onClick={() => {
                setCommentsState(prev => {
                  const list = prev[activeReel?.id] || [];
                  const updateLike = (cList: Comment[]): Comment[] => {
                    return cList.map(c => {
                      if (c.id === comment.id) {
                        return { ...c, likes: c.likes + 1 };
                      }
                      if (c.replies && c.replies.length > 0) {
                        return { ...c, replies: updateLike(c.replies) };
                      }
                      return c;
                    });
                  };
                  return { ...prev, [activeReel.id]: updateLike(list) };
                });
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

  if (reels.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        {/* Decorative background gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 pointer-events-none" />

        <div className="relative z-10 max-w-sm space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto text-primary shadow-lg border border-primary/20 animate-bounce">
            <Camera className="w-10 h-10" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-black bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
              Chưa có Reels nào
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Cộng đồng chưa có video review ẩm thực ngắn nào được đăng tải. Hãy là người đầu tiên chia sẻ món ngon của bạn!
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-4 justify-center">
            <Button className="h-12 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 shadow-md">
              <Camera className="w-4 h-4 mr-2" />
              Tải lên Video đầu tiên
            </Button>
            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full h-12 rounded-xl text-sm font-bold border-border bg-card">
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
          <button
            className="w-10 h-10 rounded-full bg-black/40 dark:bg-black/60 backdrop-blur-md border border-white/20 shadow-xl flex items-center justify-center hover:bg-orange-500 hover:border-orange-500 active:scale-95 transition-all duration-300 text-white cursor-pointer pointer-events-auto"
            aria-label="Đăng tin mới"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>

        {/* Reels Container */}
        <div
          ref={containerRef}
          className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        >
          {reels.map((reel, index) => (
            <div key={reel.id} className="h-full w-full snap-start">
              <ReelCard 
                reel={reel} 
                isActive={index === activeIndex} 
                onCommentClick={() => setShowComments(!showComments)}
                isCommentsOpen={showComments}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Right Comments Tab (Desktop - 2-Column layout) */}
      {showComments && !isMobile && activeReel && (
        <div className="hidden md:flex flex-col w-[380px] lg:w-[430px] border-l border-border bg-card/75 dark:bg-neutral-900/80 backdrop-blur-xl h-full shadow-2xl animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-4 border-b border-border/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-9 h-9 ring-2 ring-primary/20">
                <AvatarImage src={activeReel.user.avatar} alt={activeReel.user.name} />
                <AvatarFallback>{activeReel.user.name[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-foreground truncate">@{activeReel.user.username}</h3>
                <p className="text-xs text-muted-foreground truncate">{activeReel.user.name}</p>
              </div>
            </div>
            <Button size="sm" className="h-7 text-xs font-bold bg-primary hover:bg-primary/90 px-3.5 rounded-full text-white">
              Theo dõi
            </Button>
          </div>

          {/* Reel Details & Restaurant Info */}
          <div className="p-4 bg-muted/20 dark:bg-neutral-800/10 border-b border-border/40 space-y-3.5">
            <p className="text-sm text-foreground leading-relaxed break-words">{activeReel.caption}</p>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-primary/10 dark:bg-primary/20 px-2.5 py-1 rounded-full text-xs font-semibold text-primary">
                <MapPin className="w-3.5 h-3.5" />
                <span>{activeReel.restaurant.name}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Music2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{activeReel.music}</span>
            </div>
          </div>

          {/* Scrollable Comments Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
            <h4 className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
              Bình luận ({activeComments.length})
            </h4>

            {activeComments.length > 0 ? (
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
          <div className="p-4 bg-card border-t border-border/60 flex-shrink-0">
            {replyingTo && (
              <div className="flex items-center justify-between bg-primary/10 border border-primary/25 rounded-lg px-2.5 py-1.5 mb-2 text-[10px] font-bold text-primary animate-in fade-in duration-200">
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
                    className="w-7 h-7 rounded-full bg-secondary hover:bg-primary/20 border border-border/40 flex items-center justify-center text-xs active:scale-90 transition-all duration-200 cursor-pointer shadow-xs"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={(e) => handleSendComment(newCommentText, e)} className="flex items-center gap-2">
              <Avatar className="w-8 h-8 flex-shrink-0 ring-1 ring-primary/25">
                <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop" alt="User Profile" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="relative flex-1">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder={replyingTo ? `Phản hồi @${replyingTo.user.username}...` : "Viết bình luận ẩm thực..."}
                  className="w-full bg-secondary/50 hover:bg-secondary/70 focus:bg-background text-foreground text-xs placeholder:text-muted-foreground pl-3.5 pr-10 py-2.5 rounded-full border border-border/60 focus:border-primary/50 focus:outline-none transition-all duration-200"
                />
                <button
                  type="submit"
                  disabled={!newCommentText.trim()}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-full text-primary hover:bg-primary/10 disabled:opacity-40 disabled:hover:bg-transparent transition-all active:scale-95 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Bottom Drawer Comments Sheet */}
      {isMobile && activeReel && (
        <Sheet open={showComments} onOpenChange={setShowComments}>
          <SheetContent side="bottom" className="h-[75vh] p-0 flex flex-col rounded-t-[32px] border-t border-border/80 bg-background/95 backdrop-blur-xl">
            <SheetHeader className="p-4 border-b border-border/30 flex-shrink-0">
              <SheetTitle className="text-sm font-extrabold text-foreground flex items-center justify-between">
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
                <div className="flex items-center justify-between bg-primary/10 border border-primary/25 rounded-lg px-2.5 py-1.5 mb-2 text-[10px] font-bold text-primary">
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
                      className="w-7 h-7 rounded-full bg-secondary hover:bg-primary/20 border border-border/40 flex items-center justify-center text-xs active:scale-90 transition-all duration-200 cursor-pointer shadow-xs"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={(e) => handleSendComment(newCommentText, e)} className="flex items-center gap-2 pb-6">
                <Avatar className="w-8 h-8 flex-shrink-0 ring-1 ring-primary/25">
                  <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop" alt="User Profile" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder={replyingTo ? `Phản hồi @${replyingTo.user.username}...` : "Viết bình luận ẩm thực..."}
                    className="w-full bg-secondary/50 hover:bg-secondary/70 focus:bg-background text-foreground text-xs placeholder:text-muted-foreground pl-3.5 pr-10 py-2.5 rounded-full border border-border/60 focus:border-primary/50 focus:outline-none transition-all duration-200"
                  />
                  <button
                    type="submit"
                    disabled={!newCommentText.trim()}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-full text-primary hover:bg-primary/10 disabled:opacity-40 disabled:hover:bg-transparent transition-all active:scale-95 cursor-pointer"
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
