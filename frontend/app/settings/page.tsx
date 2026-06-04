"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Camera, Loader2, Sparkles, Eye, LogOut, Moon, Sun, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SettingsPage() {
  const router = useRouter();
  const { user, token, loading, logout, updateUser } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hiddenVideos, setHiddenVideos] = useState<any[]>([]);
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!token) return;
      try {
        const response = await fetch("/api/auth/users/me/profile", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setFullName(data.full_name || "");
          setBio(data.bio || "");
          setAvatarUrl(data.avatar_url || "");
          setHiddenVideos(data.hidden_videos || []);
        }
      } catch (err) {
        console.error("Lỗi khi lấy thông tin cài đặt profile:", err);
      } finally {
        setIsFetchingProfile(false);
      }
    };

    if (token) {
      fetchProfileData();
    } else if (!loading) {
      setIsFetchingProfile(false);
    }
  }, [token, loading]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Tệp không hợp lệ ❌",
        description: "Vui lòng chọn một tệp hình ảnh.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      // 1. Get presigned upload URL
      const presignedRes = await fetch("/api/content/presigned-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          file_name: file.name,
          content_type: file.type,
          folder: "avatars"
        })
      });

      if (!presignedRes.ok) throw new Error("Không lấy được link upload.");
      const { upload_url, public_url } = await presignedRes.json();

      // 2. Upload file directly to Cloudflare R2
      const uploadRes = await fetch(upload_url, {
        method: "PUT",
        headers: {
          "Content-Type": file.type
        },
        body: file
      });

      if (!uploadRes.ok) throw new Error("Upload lên Cloudflare R2 thất bại.");

      // 3. Update local state
      setAvatarUrl(public_url);
      
      toast({
        title: "Tải ảnh lên thành công 🎉",
        description: "Nhấp Lưu thay đổi để hoàn tất cập nhật.",
      });
    } catch (err: any) {
      console.error("Lỗi upload avatar:", err);
      toast({
        title: "Lỗi tải ảnh lên ❌",
        description: err.message || "Đã xảy ra lỗi trong quá trình upload.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsUpdating(true);
    try {
      const response = await fetch("/api/auth/users/me/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: fullName,
          avatar_url: avatarUrl,
          bio: bio
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Update user state globally in useAuth context
        updateUser({
          full_name: data.full_name,
          avatar_url: data.avatar_url
        });

        toast({
          title: "Đã cập nhật hồ sơ ✨",
          description: "Thông tin cá nhân của bạn đã được lưu lại thành công."
        });
      } else {
        const errData = await response.json();
        throw new Error(errData.detail || "Không thể cập nhật hồ sơ.");
      }
    } catch (err: any) {
      console.error("Lỗi cập nhật cài đặt:", err);
      toast({
        title: "Cập nhật thất bại ❌",
        description: err.message || "Vui lòng kiểm tra lại kết nối mạng.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUnhideVideo = async (videoId: number) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/interact/videos/${videoId}/unhide`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        setHiddenVideos(prev => prev.filter(v => v.id !== videoId));
        toast({
          title: "Đã hiện lại bài viết 👁️",
          description: "Bài đăng này sẽ xuất hiện lại trên feed của bạn."
        });
      } else {
        const errData = await response.json();
        throw new Error(errData.detail || "Không thể bỏ ẩn bài viết.");
      }
    } catch (err: any) {
      console.error("Lỗi bỏ ẩn video:", err);
      toast({
        title: "Thất bại ❌",
        description: err.message || "Vui lòng thử lại sau.",
        variant: "destructive"
      });
    }
  };

  if (loading || isFetchingProfile) {
    return (
      <div className="min-h-screen bg-neutral-50/50 dark:bg-black flex flex-col items-center justify-center gap-4 relative overflow-hidden select-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 pointer-events-none" />
        <div className="relative z-10 p-6 bg-white/5 border border-white/10 rounded-2xl shadow-xl backdrop-blur-md flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground font-extrabold uppercase tracking-widest animate-pulse">Đang tải cài đặt...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50/30 dark:bg-black/95 text-foreground pb-20 select-none antialiased">
      {/* Background radial lights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg md:max-w-4xl h-[300px] bg-gradient-to-b from-orange-500/5 via-transparent to-transparent pointer-events-none z-0" />

      {/* Sticky Glass Header */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-black/70 backdrop-blur-md border-b border-neutral-200/50 dark:border-white/5 shadow-xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3.5">
          <Link href="/profile">
            <button className="w-10 h-10 rounded-full bg-secondary/50 dark:bg-neutral-900/50 border border-border/40 hover:bg-orange-500 hover:border-orange-500 active:scale-95 transition-all duration-300 flex items-center justify-center text-foreground hover:text-white cursor-pointer shadow-xs">
              <ArrowLeft className="w-4.5 h-4.5 stroke-[2]" />
            </button>
          </Link>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-orange-500 fill-orange-500/10" />
            <h1 className="font-extrabold text-sm tracking-wide uppercase bg-gradient-to-r from-neutral-800 to-neutral-500 dark:from-white dark:to-neutral-400 bg-clip-text text-transparent">Cài đặt tài khoản</h1>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6 relative z-10">
        {/* Profile Editing Card */}
        <div className="relative bg-neutral-100/50 dark:bg-neutral-900/20 border border-neutral-200/50 dark:border-white/5 rounded-[2.5rem] p-5 shadow-[0_12px_36px_rgba(0,0,0,0.02)]">
          <div className="bg-white dark:bg-neutral-950/40 border border-neutral-100/70 dark:border-white/5 rounded-[calc(2.5rem-0.75rem)] p-5 space-y-6">
            
            <h2 className="font-black text-base tracking-tight text-foreground border-b border-border/40 pb-2">Thông tin cá nhân</h2>
            
            <form onSubmit={handleSaveSettings} className="space-y-5">
              {/* Avatar Selector */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-orange-500 to-red-500 rounded-full blur-[2px] opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative p-1 bg-gradient-to-tr from-orange-500 to-red-500 rounded-full shadow-md">
                    <Avatar className="w-24 h-24 ring-2 ring-white dark:ring-black">
                      <AvatarImage src={avatarUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop"} />
                      <AvatarFallback className="bg-secondary text-primary font-black text-3xl">
                        {fullName[0] || user?.email?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <label htmlFor="avatar-file-input" className="absolute bottom-1 right-1 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center border-2 border-white dark:border-black cursor-pointer shadow-md hover:scale-110 active:scale-90 transition-all">
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </label>
                  <input
                    id="avatar-file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    disabled={isUploading || isUpdating}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-widest mt-1">Ảnh đại diện</p>
              </div>

              {/* Form Input fields */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="full-name-input" className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-widest px-1">Họ và Tên</label>
                  <input
                    id="full-name-input"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full bg-secondary/35 hover:bg-secondary/50 focus:bg-background text-foreground text-xs pl-3.5 pr-3.5 py-3 rounded-xl border border-border/40 focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all duration-300 font-semibold"
                    placeholder="Nhập tên đầy đủ của bạn"
                    disabled={isUpdating}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="bio-input" className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-widest px-1">Tiểu sử (Bio)</label>
                  <textarea
                    id="bio-input"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full bg-secondary/35 hover:bg-secondary/50 focus:bg-background text-foreground text-xs pl-3.5 pr-3.5 py-3 rounded-xl border border-border/40 focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all duration-300 font-semibold resize-none"
                    placeholder="Mô tả bản thân hoặc phong cách ẩm thực của bạn"
                    disabled={isUpdating}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-widest px-1">Email</span>
                    <input
                      type="text"
                      value={user?.email || ""}
                      disabled
                      className="w-full bg-neutral-100 dark:bg-neutral-900/40 text-muted-foreground text-xs pl-3.5 pr-3.5 py-3 rounded-xl border border-border/20 font-semibold cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-widest px-1">Vai trò</span>
                    <input
                      type="text"
                      value={user?.role === "admin" ? "Quản trị viên" : user?.role === "merchant" ? "Đối tác Quán ăn" : "Reviewer ẩm thực"}
                      disabled
                      className="w-full bg-neutral-100 dark:bg-neutral-900/40 text-muted-foreground text-xs pl-3.5 pr-3.5 py-3 rounded-xl border border-border/20 font-semibold cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  {isUpdating ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu thay đổi...</span>
                    </div>
                  ) : (
                    <span>Lưu thay đổi</span>
                  )}
                </Button>
              </div>

            </form>
          </div>
        </div>

        {/* Manage Hidden Videos Card */}
        <div className="relative bg-neutral-100/50 dark:bg-neutral-900/20 border border-neutral-200/50 dark:border-white/5 rounded-[2.5rem] p-5 shadow-[0_12px_36px_rgba(0,0,0,0.02)]">
          <div className="bg-white dark:bg-neutral-950/40 border border-neutral-100/70 dark:border-white/5 rounded-[calc(2.5rem-0.75rem)] p-5 space-y-4">
            
            <h2 className="font-black text-base tracking-tight text-foreground border-b border-border/40 pb-2">Bài viết đã ẩn ({hiddenVideos.length})</h2>
            
            {hiddenVideos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {hiddenVideos.map((video) => (
                  <div key={video.id} className="flex gap-3 bg-secondary/25 border border-border/30 rounded-2xl p-2 items-center">
                    <div className="relative w-14 h-14 bg-neutral-900 rounded-xl overflow-hidden flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={video.thumbnail_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100"}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{video.title || "Bài viết ẩm thực"}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{video.description || "Không có mô tả"}</p>
                    </div>
                    <button
                      onClick={() => handleUnhideVideo(video.id)}
                      className="p-2.5 rounded-full bg-orange-500/10 hover:bg-orange-500 hover:text-white text-orange-500 active:scale-90 transition-all cursor-pointer flex-shrink-0"
                      title="Hiển thị lại bài đăng"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground/60 space-y-1">
                <p className="text-xs font-semibold">Danh sách ẩn trống</p>
                <p className="text-[10px]">Các bài viết bạn ẩn trên bảng tin sẽ hiển thị tại đây.</p>
              </div>
            )}
          </div>
        </div>

        {/* Preferences and Logout Card */}
        <div className="relative bg-neutral-100/50 dark:bg-neutral-900/20 border border-neutral-200/50 dark:border-white/5 rounded-[2.5rem] p-5 shadow-[0_12px_36px_rgba(0,0,0,0.02)]">
          <div className="bg-white dark:bg-neutral-950/40 border border-neutral-100/70 dark:border-white/5 rounded-[calc(2.5rem-0.75rem)] p-5 space-y-4">
            
            <h2 className="font-black text-base tracking-tight text-foreground border-b border-border/40 pb-2">Tùy chọn khác</h2>

            <div className="flex items-center justify-between py-2 border-b border-border/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-secondary/50 dark:bg-neutral-900 flex items-center justify-center text-foreground/80">
                  <Sun className="w-4.5 h-4.5 block dark:hidden" />
                  <Moon className="w-4.5 h-4.5 hidden dark:block" />
                </div>
                <div>
                  <p className="text-xs font-bold">Giao diện (Theme)</p>
                  <p className="text-[9px] text-muted-foreground">Chuyển đổi chế độ Sáng / Tối</p>
                </div>
              </div>
              <ThemeToggle />
            </div>

            <div className="pt-2">
              <Button
                onClick={logout}
                className="w-full h-11 bg-red-500/10 hover:bg-red-500 border border-red-500/25 text-red-500 hover:text-white rounded-full font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất tài khoản</span>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
