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
    <div className="min-h-screen bg-background pb-12 transition-all duration-300">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-card/85 backdrop-blur-md border-b border-border/80">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary/80 group">
              <ArrowLeft className="w-5 h-5 text-foreground group-hover:-translate-x-0.5 transition-transform" />
            </Button>
          </Link>
          <h1 className="font-semibold text-base flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" />
            Chia sẻ món ngon mới
          </h1>
          <div className="w-9 h-9" /> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 mt-6">
        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-destructive/15 border border-destructive/30 rounded-2xl flex items-start gap-3 animate-shake">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive-foreground font-medium">{error}</p>
            </div>
          )}

          {/* Form Area Grid */}
          <div className="bg-card/50 backdrop-blur-xs border border-border/60 rounded-3xl p-5 md:p-6 space-y-6 shadow-sm">
            {/* Post Type Selector Switch */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground/90">Hình thức đánh giá</Label>
              <div className="grid grid-cols-2 p-1 bg-secondary/50 rounded-2xl border border-border/40 relative">
                {/* Active selection sliding indicator can be visual */}
                <button
                  type="button"
                  onClick={() => setPostType("video")}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative z-10",
                    postType === "video" 
                      ? "bg-orange-500 text-white shadow-xs scale-[1.02]" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Video className="w-4 h-4" />
                  Video Reels
                </button>
                <button
                  type="button"
                  onClick={() => setPostType("image")}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative z-10",
                    postType === "image" 
                      ? "bg-orange-500 text-white shadow-xs scale-[1.02]" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <ImageIcon className="w-4 h-4" />
                  Hình ảnh / Post
                </button>
              </div>
            </div>

            {/* Media Dropzone Box */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground/90">
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
                    "border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300 min-h-[220px] text-center",
                    isDragging 
                      ? "border-orange-500 bg-orange-500/5 scale-[0.99]" 
                      : "border-border/80 hover:border-orange-500/60 hover:bg-secondary/20"
                  )}
                >
                  <div className="w-14 h-14 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 transition-transform duration-300 hover:scale-110">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-sm text-foreground">
                      Kéo thả file vào đây hoặc <span className="text-orange-500 hover:underline">chọn file</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {postType === "video" 
                        ? "Hỗ trợ MP4, MOV lên tới 100MB (Tỷ lệ 9:16 tốt nhất)" 
                        : "Hỗ trợ JPG, PNG, WEBP lên tới 10MB"}
                    </p>
                  </div>
                  {fieldErrors.file && (
                    <p className="text-xs text-destructive font-medium mt-1">{fieldErrors.file}</p>
                  )}
                </div>
              ) : (
                <div className="relative aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden border border-border bg-black/40 flex items-center justify-center group shadow-xs">
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
                    className="absolute top-3 right-3 rounded-full opacity-90 hover:opacity-100 hover:scale-105 shadow-md z-20"
                  >
                    <X className="w-4 h-4" />
                  </Button>

                  {/* Info Badge */}
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2.5 py-1 rounded-full font-medium z-20">
                    {file?.name} ({file ? (file.size / (1024 * 1024)).toFixed(1) : 0} MB)
                  </div>
                </div>
              )}
            </div>

            {/* Title Input */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-semibold text-foreground/90">
                Tiêu đề bài viết <span className="text-orange-500">*</span>
              </Label>
              <Input
                id="title"
                type="text"
                placeholder="Ví dụ: Phở bát đá nghi ngút khói Quận 1 cực ngon..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={cn(
                  "rounded-2xl border-border/80 bg-secondary/20 focus-visible:ring-orange-500 py-6",
                  fieldErrors.title && "border-destructive/60 focus-visible:ring-destructive"
                )}
              />
              {fieldErrors.title && (
                <p className="text-xs text-destructive font-medium mt-1">{fieldErrors.title}</p>
              )}
            </div>

            {/* Description Textarea */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold text-foreground/90">Mô tả chi tiết / Review cảm nhận</Label>
              <textarea
                id="description"
                placeholder="Chia sẻ hương vị, giá cả, thái độ phục vụ hay mẹo khi đi ăn quán này nhé..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-border/80 bg-secondary/20 p-4 text-sm focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none transition-all duration-300 resize-none"
              />
            </div>

            {/* Tag Restaurant Search Box */}
            <div className="space-y-2 relative">
              <Label className="text-sm font-semibold text-foreground/90">Gắn thẻ địa điểm / Quán ăn</Label>
              
              {!selectedMerchant ? (
                <div className="relative">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                  <Input
                    type="text"
                    placeholder="Tìm tên quán ăn (ví dụ: Phở cô Sáu, Bánh mì...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-2xl border-border/80 bg-secondary/20 pl-11 focus-visible:ring-orange-500 py-6"
                  />
                  {isSearching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between p-3.5 bg-orange-500/10 border border-orange-500/30 rounded-2xl animate-fade-in">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-orange-500/15 rounded-xl flex items-center justify-center text-orange-500 shrink-0 mt-0.5">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{selectedMerchant.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{selectedMerchant.address}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => selectMerchant(null)}
                    className="rounded-full hover:bg-orange-500/15 text-orange-500 hover:text-orange-600 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Floating Geo-Search results dropdown with premium layout */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-30 mt-2 bg-card border border-border/80 rounded-2xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden animate-slide-down scrollbar-thin">
                  <div className="p-2 space-y-1">
                    {searchResults.map((merchant) => (
                      <button
                        key={merchant.id}
                        type="button"
                        onClick={() => selectMerchant(merchant)}
                        className="w-full flex items-start gap-3 p-3 hover:bg-secondary/70 rounded-xl transition-colors text-left"
                      >
                        <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-xs text-foreground line-clamp-1">{merchant.name}</p>
                          <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{merchant.address}</p>
                          {merchant.distance_km !== undefined && (
                            <span className="inline-block bg-orange-500/10 text-orange-500 text-[8px] font-bold px-1.5 py-0.5 rounded-full mt-1">
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

          {/* Submit Action Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-semibold py-6 text-sm hover:scale-[1.01] active:scale-[0.99] transition-all duration-300"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang xử lý đăng bài...
              </span>
            ) : (
              "Đăng bài viết mới"
            )}
          </Button>
        </form>
      </main>

      {/* Glassmorphic Real-Time Upload Progress Modal/Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in">
          <div className="max-w-xs w-full bg-card border border-border/80 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center space-y-5">
            {uploadProgress < 100 ? (
              <div className="relative w-20 h-20 flex items-center justify-center">
                {/* Circular loading SVG or spinner */}
                <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                <span className="absolute text-xs font-bold text-foreground">{uploadProgress}%</span>
              </div>
            ) : (
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 animate-bounce">
                <CheckCircle className="w-10 h-10" />
              </div>
            )}
            
            <div className="space-y-1.5">
              <h3 className="font-bold text-sm text-foreground">
                {uploadProgress < 100 ? "Đang tải file lên đám mây..." : "Đang xử lý thông tin..."}
              </h3>
              <p className="text-xs text-muted-foreground">
                {uploadProgress < 100 
                  ? "Vui lòng giữ kết nối mạng ổn định, không tắt trình duyệt." 
                  : "Lưu thông tin bài review vào máy chủ."}
              </p>
            </div>

            {/* Horizontal progress bar */}
            <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden border border-border/30">
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
