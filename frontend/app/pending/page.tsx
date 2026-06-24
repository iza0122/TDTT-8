"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Clock, 
  Ban, 
  Trash2, 
  Home, 
  ArrowLeft, 
  Heart, 
  Eye, 
  Play, 
  Sparkles, 
  AlertTriangle, 
  ChevronRight, 
  AlertCircle,
  Video,
  FileText
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface PendingVideo {
  id: number;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  description: string | null;
  likes_count: number;
  post_type: "video" | "image";
  status: "pending" | "rejected" | "approved";
  meta_data: {
    reject_reason?: string;
  } | null;
  created_at: string;
}

export default function PendingPostsPage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<"pending" | "rejected">("pending");
  const [videos, setVideos] = useState<PendingVideo[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const fetchUserVideos = async () => {
    if (!token) return;
    try {
      const response = await fetch("/api/auth/users/me/profile", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos || []);
      }
    } catch (err) {
      console.error("Lỗi khi fetch danh sách video chờ duyệt:", err);
      toast({
        title: "Lỗi kết nối ❌",
        description: "Không thể kết nối tới máy chủ.",
        variant: "destructive"
      });
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUserVideos();
    } else if (!loading) {
      setIsFetching(false);
    }
  }, [token, loading]);

  const handleDeletePost = async (videoId: number) => {
    if (!token || deletingId) return;
    setDeletingId(videoId);
    try {
      const response = await fetch(`/api/content/videos/${videoId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        toast({
          title: "Đã gỡ bài viết 🗑️",
          description: "Bài viết đã được xóa thành công khỏi danh sách chờ duyệt."
        });
        setVideos(prev => prev.filter(v => v.id !== videoId));
      } else {
        const errData = await response.json();
        toast({
          title: "Lỗi xóa bài viết ❌",
          description: errData.detail || "Không thể thực hiện yêu cầu này.",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error("Lỗi khi xóa bài viết:", err);
      toast({
        title: "Có lỗi xảy ra ⚠️",
        description: "Vui lòng thử lại sau.",
        variant: "destructive"
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Filter videos based on status
  const displayedVideos = videos.filter(v => v.status === activeTab);

  if (loading || (isFetching && videos.length === 0)) {
    return (
      <div className="min-h-screen bg-neutral-50/50 dark:bg-black flex flex-col items-center justify-center gap-4 relative overflow-hidden select-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 pointer-events-none" />
        <div className="relative z-10 p-6 bg-white/5 border border-white/10 rounded-2xl shadow-xl backdrop-blur-md flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground font-extrabold uppercase tracking-widest animate-pulse">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50/30 dark:bg-black/95 text-foreground pb-24 select-none antialiased relative overflow-hidden">
      {/* Background lights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-gradient-to-b from-orange-500/5 via-transparent to-transparent pointer-events-none z-0" />
      
      {/* Dynamic Header */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-black/70 backdrop-blur-md border-b border-neutral-200/50 dark:border-white/5 shadow-xs">
        <div className="max-w-lg md:max-w-6xl lg:max-w-7xl mx-auto flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <Link href="/profile">
              <button className="w-10 h-10 rounded-full bg-secondary/50 dark:bg-neutral-900/50 border border-border/40 hover:bg-orange-500 hover:border-orange-500 active:scale-95 transition-all duration-300 flex items-center justify-center text-foreground hover:text-white cursor-pointer shadow-xs">
                <ArrowLeft className="w-4.5 h-4.5 stroke-[2]" />
              </button>
            </Link>
            <span className="text-sm font-bold tracking-tight">Hồ sơ cá nhân</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-orange-500 animate-pulse fill-orange-500/10" />
            <span className="text-xs font-black uppercase tracking-wider bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2.5 py-1 rounded-full border border-orange-500/25">
              Moderation Tracker
            </span>
          </div>

          <Link href="/">
            <button className="w-10 h-10 rounded-full bg-secondary/50 dark:bg-neutral-900/50 border border-border/40 hover:bg-orange-500 hover:border-orange-500 active:scale-95 transition-all duration-300 flex items-center justify-center text-foreground hover:text-white cursor-pointer shadow-xs">
              <Home className="w-4.5 h-4.5" />
            </button>
          </Link>
        </div>
      </header>

      <main className="max-w-lg md:max-w-4xl mx-auto px-4 pt-8 space-y-8 relative z-10">
        
        {/* Page Title & Hero */}
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-neutral-200/50 dark:bg-white/5 border border-neutral-300/30 dark:border-white/5 text-[9px] uppercase tracking-[0.2em] font-extrabold text-muted-foreground">
            Kiểm duyệt bài viết
          </div>
          <h1 className="text-3xl font-black tracking-tight leading-none bg-gradient-to-b from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400 bg-clip-text text-transparent">
            Danh sách chờ duyệt
          </h1>
          <p className="text-xs text-muted-foreground/80 font-semibold leading-relaxed max-w-xl">
            Theo dõi trạng thái các bài review bằng video, hình ảnh của bạn hoặc của quán ăn. Các bài duyệt thành công sẽ tự động xuất hiện trên bảng tin.
          </p>
        </div>

        {/* Tactile Tab Slider */}
        <div className="relative bg-neutral-200/55 dark:bg-neutral-900/60 p-1 rounded-full flex gap-1 border border-neutral-300/30 dark:border-white/5 max-w-sm mx-auto md:mx-0 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
          <button
            onClick={() => setActiveTab("pending")}
            className={cn(
              "flex-1 py-2.5 flex items-center justify-center gap-2 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all duration-500 cursor-pointer select-none active:scale-95",
              activeTab === "pending"
                ? "bg-white dark:bg-neutral-950 text-orange-500 shadow-sm scale-102 border border-neutral-200/40 dark:border-white/5"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Clock className="w-4 h-4" />
            <span>Chờ duyệt ({videos.filter(v => v.status === "pending").length})</span>
          </button>
          
          <button
            onClick={() => setActiveTab("rejected")}
            className={cn(
              "flex-1 py-2.5 flex items-center justify-center gap-2 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all duration-500 cursor-pointer select-none active:scale-95",
              activeTab === "rejected"
                ? "bg-white dark:bg-neutral-950 text-red-500 shadow-sm scale-102 border border-neutral-200/40 dark:border-white/5"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Ban className="w-4 h-4" />
            <span>Bị từ chối ({videos.filter(v => v.status === "rejected").length})</span>
          </button>
        </div>

        {/* Video Cards List */}
        <div className="space-y-6">
          {displayedVideos.map((video) => (
            /* Outer Shell - Double Bezel Architecture */
            <div 
              key={video.id} 
              className={cn(
                "group relative bg-neutral-100/50 dark:bg-neutral-900/20 border rounded-[2rem] p-4.5 shadow-[0_12px_36px_rgba(0,0,0,0.02)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.01]",
                activeTab === "rejected" 
                  ? "border-red-500/10 hover:border-red-500/20" 
                  : "border-neutral-200/50 dark:border-white/5 hover:border-orange-500/20"
              )}
            >
              {/* Inner Core */}
              <div className="bg-white dark:bg-neutral-950/40 border border-neutral-100/70 dark:border-white/5 rounded-[calc(2rem-0.5rem)] p-4 md:p-5 flex flex-col md:flex-row gap-5 items-start">
                
                {/* Media Preview Window */}
                <div className="relative w-full md:w-44 aspect-video md:aspect-[4/3] rounded-2xl overflow-hidden shrink-0 border border-neutral-200/40 dark:border-white/5 shadow-inner bg-neutral-100 dark:bg-neutral-900">
                  <Image 
                    src={video.thumbnail_url || "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=300"} 
                    alt={video.title} 
                    fill 
                    className="object-cover group-hover:scale-103 transition-transform duration-700" 
                    sizes="(max-width: 768px) 100vw, 176px"
                  />
                  {video.post_type === "video" ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="w-9 h-9 rounded-full bg-white/95 text-black flex items-center justify-center shadow-md transform group-hover:scale-105 transition-all">
                        <Play className="w-4.5 h-4.5 fill-black text-black ml-0.5" />
                      </div>
                    </div>
                  ) : (
                    <div className="absolute bottom-2 right-2 bg-black/60 rounded-lg px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Hình ảnh</span>
                    </div>
                  )}
                </div>

                {/* Content Info */}
                <div className="flex-1 space-y-3.5 min-w-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        "text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full border",
                        video.post_type === "video"
                          ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                          : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                      )}>
                        {video.post_type === "video" ? "Reels Video" : "Review Ảnh"}
                      </span>

                      {/* Status Tag */}
                      <span className={cn(
                        "text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full border inline-flex items-center gap-1",
                        video.status === "pending"
                          ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          : "bg-red-500/10 text-red-600 border-red-500/20"
                      )}>
                        {video.status === "pending" ? (
                          <>
                            <Clock className="w-3 h-3 animate-spin duration-3000" />
                            <span>Chờ quản trị viên duyệt</span>
                          </>
                        ) : (
                          <>
                            <Ban className="w-3 h-3" />
                            <span>Bị từ chối</span>
                          </>
                        )}
                      </span>
                    </div>
                    
                    <h3 className="font-extrabold text-base text-foreground tracking-tight line-clamp-1">{video.title || "Không có tiêu đề"}</h3>
                    <p className="text-xs text-muted-foreground/80 leading-relaxed font-semibold line-clamp-2 pr-6">
                      {video.description || "Không có phần mô tả đi kèm."}
                    </p>
                  </div>

                  <div className="text-[10px] text-muted-foreground/60 font-bold">
                    Đã đăng vào: {new Date(video.created_at).toLocaleString("vi-VN")}
                  </div>

                  {/* Rejected Details Sub-bezel */}
                  {video.status === "rejected" && video.meta_data?.reject_reason && (
                    <div className="relative bg-red-500/5 dark:bg-red-500/10 border border-red-500/10 rounded-2xl p-3 flex gap-2.5 items-start">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-red-500 leading-none">Lý do từ chối:</p>
                        <p className="text-xs text-red-600 dark:text-red-400 font-semibold leading-relaxed">
                          {video.meta_data.reject_reason}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Operations */}
                <div className="w-full md:w-auto shrink-0 self-stretch flex md:flex-col justify-end items-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-border/40">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePost(video.id)}
                    disabled={deletingId === video.id}
                    className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full h-9 px-4.5 font-bold gap-1.5 transition-all duration-300 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{deletingId === video.id ? "Đang gỡ..." : "Xóa bài viết"}</span>
                  </Button>
                </div>

              </div>
            </div>
          ))}

          {/* Premium Empty State */}
          {displayedVideos.length === 0 && (
            <div className="text-center py-20 px-6 bg-secondary/15 dark:bg-neutral-900/5 rounded-[2.5rem] border border-dashed border-neutral-300 dark:border-white/10 my-4 space-y-6 animate-in fade-in duration-500">
              <div className="relative w-16 h-16 mx-auto bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-xs">
                {activeTab === "pending" ? (
                  <Clock className="w-7 h-7" />
                ) : (
                  <Ban className="w-7 h-7 text-red-500" />
                )}
              </div>
              
              <div className="space-y-1.5">
                <p className="font-extrabold text-sm text-foreground uppercase tracking-wide">
                  {activeTab === "pending" ? "Không có bài viết chờ duyệt" : "Không có bài viết bị từ chối"}
                </p>
                <p className="text-xs text-muted-foreground/80 leading-relaxed font-semibold max-w-xs mx-auto">
                  {activeTab === "pending" 
                    ? "Hiện tại bạn không có bài viết nào đang ở hàng đợi kiểm duyệt." 
                    : "Tuyệt vời! Không có bài viết nào của bạn bị ban kiểm trị từ chối phê duyệt."
                  }
                </p>
              </div>

              <div className="pt-2">
                <Link href="/create">
                  <button className="mx-auto bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg flex items-center justify-between rounded-full pl-6 pr-2.5 py-2 font-extrabold text-[11px] select-none transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 group cursor-pointer">
                    <span>Đăng bài mới</span>
                    <div className="w-6.5 h-6.5 bg-white/20 rounded-full flex items-center justify-center transition-all duration-300 group-hover:translate-x-0.5">
                      <ChevronRight className="w-3.5 h-3.5 text-white" />
                    </div>
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
