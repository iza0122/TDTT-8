"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Upload, 
  Video, 
  Image as ImageIcon, 
  MapPin, 
  X, 
  Search, 
  Sparkles, 
  Loader2, 
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useCreatePostForm } from "@/hooks/use-create-post-form";

export default function CreatePostPage() {
  const {
    title,
    setTitle,
    description,
    setDescription,
    postType,
    setPostType,
    selectedMerchant,
    selectMerchant,
    file,
    filePreviewUrl,
    handleFileChange,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    isLoading,
    uploadProgress,
    error,
    fieldErrors,
    handleSubmit,
  } = useCreatePostForm();

  // Drag and Drop visual feedback states
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const triggerFileInput = () => {
    const input = document.getElementById("file-upload") as HTMLInputElement;
    if (input) input.click();
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#050505] pb-16 transition-all duration-300 relative">
      {/* Ambient Glowing Orbs */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-10 w-72 h-72 rounded-full bg-orange-500/10 blur-[100px]" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 rounded-full bg-rose-500/10 blur-[120px]" />
      </div>

      {/* Floating Premium Header */}
      <header className="sticky top-4 z-40 max-w-lg mx-auto px-4 pt-4">
        <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-neutral-200/50 dark:border-neutral-800/40 rounded-full py-2.5 px-4 flex items-center justify-between shadow-lg shadow-black/5">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 group h-9 w-9">
              <ArrowLeft className="w-4 h-4 text-foreground group-hover:-translate-x-0.5 transition-transform" />
            </Button>
          </Link>
          <h1 className="font-bold text-[10px] tracking-[0.2em] flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent uppercase">
            <Sparkles className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
            Cinematic Creation Studio
          </h1>
          <div className="w-9 h-9" /> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 mt-8 relative">
        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 animate-shake">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-500 font-medium">{error}</p>
            </div>
          )}

          {/* Double-Bezel Form Enclosure (Outer Shell) */}
          <div className="rounded-[2.5rem] bg-white/40 dark:bg-neutral-900/10 border border-neutral-200/50 dark:border-neutral-800/50 backdrop-blur-xl p-2.5 shadow-xl shadow-neutral-200/10 dark:shadow-black/20">
            {/* Inner Core */}
            <div className="rounded-[calc(2.5rem-0.625rem)] bg-card/90 dark:bg-neutral-900/90 border border-neutral-100/70 dark:border-neutral-800/60 p-6 md:p-8 space-y-6 shadow-inner">
              
              {/* Post Type Selector Switch */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hình thức đánh giá</Label>
                <div className="grid grid-cols-2 p-1 bg-neutral-100/80 dark:bg-neutral-950/80 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 relative">
                  {/* Animated active sliding pill backdrop */}
                  <div 
                    className={cn(
                      "absolute top-1 bottom-1 w-[calc(50%-6px)] bg-orange-500 rounded-xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-md shadow-orange-500/20",
                      postType === "video" ? "left-1.5" : "left-[calc(50%+2px)]"
                    )}
                  />
                  
                  <button
                    type="button"
                    onClick={() => setPostType("video")}
                    className={cn(
                      "flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-500 relative z-10",
                      postType === "video" 
                        ? "text-white" 
                        : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                    )}
                  >
                    <Video className="w-4 h-4 stroke-[2]" />
                    Video Reels
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setPostType("image")}
                    className={cn(
                      "flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-500 relative z-10",
                      postType === "image" 
                        ? "text-white" 
                        : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                    )}
                  >
                    <ImageIcon className="w-4 h-4 stroke-[2]" />
                    Hình ảnh / Post
                  </button>
                </div>
              </div>

              {/* Media Dropzone Box */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tải lên {postType === "video" ? "Video Review" : "Hình ảnh món ăn"} <span className="text-orange-500">*</span>
                </Label>
                
                <input
                  id="file-upload"
                  type="file"
                  accept={postType === "video" ? "video/*" : "image/*"}
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
                />

                {!filePreviewUrl ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={triggerFileInput}
                    className={cn(
                      "border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] min-h-[220px] text-center relative overflow-hidden group",
                      isDragging 
                        ? "border-orange-500 bg-orange-500/5 scale-[0.98] shadow-lg shadow-orange-500/10" 
                        : "border-neutral-200 dark:border-neutral-800 hover:border-orange-500/60 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50"
                    )}
                  >
                    <div className="w-16 h-16 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-inner">
                      <Upload className="w-6 h-6 stroke-[1.5]" />
                    </div>
                    <div className="space-y-1.5 z-10">
                      <p className="font-bold text-sm text-neutral-800 dark:text-neutral-200">
                        Kéo thả file vào đây hoặc <span className="text-orange-500 group-hover:underline transition-all">chọn file</span>
                      </p>
                      <p className="text-xs text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
                        {postType === "video" 
                          ? "Hỗ trợ MP4, MOV lên tới 100MB (Tỷ lệ 9:16 tốt nhất)" 
                          : "Hỗ trợ JPG, PNG, WEBP lên tới 10MB"}
                      </p>
                    </div>
                    {fieldErrors.file && (
                      <p className="text-xs text-red-500 font-medium mt-1">{fieldErrors.file}</p>
                    )}
                  </div>
                ) : (
                  <div className="p-2 bg-neutral-100/50 dark:bg-neutral-950/50 rounded-[2rem] border border-neutral-200/50 dark:border-neutral-800/50 shadow-inner">
                    <div className="relative aspect-square md:aspect-[4/3] rounded-[calc(2rem-8px)] overflow-hidden bg-black flex items-center justify-center group shadow-xl">
                      {postType === "video" ? (
                        <video
                          src={filePreviewUrl}
                          controls
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={filePreviewUrl}
                          alt="Xem trước bài đăng"
                          className="w-full h-full object-contain"
                        />
                      )}

                      {/* Remove Overlay Button */}
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => handleFileChange(null)}
                        className="absolute top-3 right-3 rounded-full opacity-90 hover:opacity-100 hover:scale-110 active:scale-95 transition-all duration-300 shadow-lg z-20 bg-red-500 hover:bg-red-600 border border-white/20"
                      >
                        <X className="w-4 h-4 stroke-[2]" />
                      </Button>

                      {/* Info Badge */}
                      <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md text-white text-[10px] px-3.5 py-1.5 rounded-full font-medium z-20 border border-white/10 shadow-md">
                        {file?.name} ({file ? (file.size / (1024 * 1024)).toFixed(1) : 0} MB)
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Title Input */}
              <div className="space-y-3">
                <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tiêu đề bài viết <span className="text-orange-500">*</span>
                </Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Ví dụ: Phở bát đá nghi ngút khói Quận 1 cực ngon..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={cn(
                    "rounded-2xl border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-orange-500 py-6 transition-all duration-300",
                    fieldErrors.title && "border-red-500 focus-visible:ring-red-500/20 focus-visible:border-red-500"
                  )}
                />
                {fieldErrors.title && (
                  <p className="text-xs text-red-500 font-medium mt-1">{fieldErrors.title}</p>
                )}
              </div>

              {/* Description Textarea */}
              <div className="space-y-3">
                <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mô tả chi tiết / Review cảm nhận</Label>
                <textarea
                  id="description"
                  placeholder="Chia sẻ hương vị, giá cả, thái độ phục vụ hay mẹo khi đi ăn quán này nhé..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 p-4 text-sm focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-orange-500 focus-visible:outline-none transition-all duration-500 resize-none"
                />
              </div>

              {/* Tag Restaurant Search Box */}
              <div className="space-y-3 relative">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gắn thẻ địa điểm / Quán ăn</Label>
                
                {!selectedMerchant ? (
                  <div className="relative group">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-orange-500" />
                    <Input
                      type="text"
                      placeholder="Tìm tên quán ăn (ví dụ: Phở cô Sáu, Bánh mì...)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="rounded-2xl border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 pl-11 focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-orange-500 py-6 transition-all duration-300"
                    />
                    {isSearching && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-orange-500/5 dark:bg-orange-500/10 border border-orange-500/20 dark:border-orange-500/30 rounded-2xl animate-fade-in shadow-inner">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-orange-500/10 dark:bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-500 shrink-0 mt-0.5 shadow-sm">
                        <MapPin className="w-5 h-5 stroke-[1.5]" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-neutral-800 dark:text-neutral-100">{selectedMerchant.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{selectedMerchant.address}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => selectMerchant(null)}
                      className="rounded-full hover:bg-orange-500/10 text-orange-500 shrink-0 h-9 w-9 transition-colors duration-300"
                    >
                      <X className="w-4 h-4 stroke-[2]" />
                    </Button>
                  </div>
                )}

                {/* Floating Geo-Search results dropdown with premium glassmorphism */}
                {searchResults.length > 0 && (
                  <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-30 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden animate-all duration-300 scrollbar-thin divide-y divide-neutral-100 dark:divide-neutral-900">
                    <div className="p-2 space-y-1">
                      {searchResults.map((merchant) => (
                        <button
                          key={merchant.id}
                          type="button"
                          onClick={() => selectMerchant(merchant)}
                          className="w-full flex items-start gap-3 p-3 hover:bg-orange-500/5 dark:hover:bg-orange-500/10 rounded-xl transition-all duration-300 text-left group"
                        >
                          <div className="w-8 h-8 bg-neutral-100 dark:bg-neutral-900 rounded-lg flex items-center justify-center text-neutral-400 group-hover:text-orange-500 group-hover:bg-orange-500/10 transition-colors shrink-0 mt-0.5">
                            <MapPin className="w-4 h-4 stroke-[1.5]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-xs text-neutral-800 dark:text-neutral-200 line-clamp-1 group-hover:text-orange-500 transition-colors">{merchant.name}</p>
                            <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{merchant.address}</p>
                            {merchant.distance_km !== undefined && (
                              <span className="inline-block bg-orange-500/10 text-orange-500 text-[8px] font-bold px-1.5 py-0.5 rounded-full mt-1.5">
                                Cách {merchant.distance_km.toFixed(1)} km
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Action Button (Button-in-Button) */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-7 text-sm shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35 hover:scale-[1.01] active:scale-[0.98] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex items-center justify-center gap-2 group relative overflow-hidden"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang xử lý đăng bài...
              </span>
            ) : (
              <>
                <span className="tracking-wide">Đăng bài viết mới</span>
                <span className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center transition-all duration-500 group-hover:translate-x-1 group-hover:scale-105 shadow-sm">
                  <Sparkles className="w-4 h-4 text-white" />
                </span>
              </>
            )}
          </Button>
        </form>
      </main>

      {/* Glassmorphic Real-Time Upload Progress Modal/Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in">
          <div className="max-w-xs w-full bg-white/90 dark:bg-neutral-900/90 border border-neutral-200/50 dark:border-neutral-800/50 rounded-[2rem] p-6 shadow-2xl flex flex-col items-center text-center space-y-5">
            {uploadProgress < 100 ? (
              <div className="relative w-20 h-20 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                <span className="absolute text-[10px] font-extrabold text-foreground">{uploadProgress}%</span>
              </div>
            ) : (
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 animate-bounce">
                <CheckCircle className="w-8 h-8" />
              </div>
            )}
            
            <div className="space-y-1.5">
              <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">
                {uploadProgress < 100 ? "Đang tải file lên đám mây..." : "Đang xử lý thông tin..."}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {uploadProgress < 100 
                  ? "Vui lòng giữ kết nối mạng ổn định, không tắt trình duyệt." 
                  : "Lưu thông tin bài review vào máy chủ."}
              </p>
            </div>

            {/* Horizontal progress bar */}
            <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden border border-neutral-200/30 dark:border-neutral-800/30">
              <div 
                className="bg-orange-500 h-full transition-all duration-300 ease-out" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
