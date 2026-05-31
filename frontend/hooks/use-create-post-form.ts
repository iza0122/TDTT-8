"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export interface Restaurant {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance_km?: number;
}

function generateVideoThumbnail(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.style.position = "absolute";
    video.style.width = "1px";
    video.style.height = "1px";
    video.style.opacity = "0";
    video.style.pointerEvents = "none";
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.src = URL.createObjectURL(file);
    
    // Append to body to force mobile hardware decoders to process frames
    document.body.appendChild(video);
    
    // Set a timeout of 3.5 seconds to prevent hanging on mobile
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("Timeout khi trích xuất ảnh thumbnail từ video"));
    }, 3500);

    const cleanup = () => {
      clearTimeout(timeoutId);
      if (video.parentNode) {
        try {
          video.parentNode.removeChild(video);
        } catch (e) {}
      }
      try {
        URL.revokeObjectURL(video.src);
      } catch (e) {}
    };
    
    video.onloadeddata = () => {
      video.currentTime = 1.0;
    };
    
    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            cleanup();
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Không thể trích xuất ảnh thumbnail từ video"));
            }
          }, "image/jpeg", 0.85);
        } else {
          cleanup();
          reject(new Error("Không thể tạo canvas context"));
        }
      } catch (err) {
        cleanup();
        reject(err);
      }
    };
    
    video.onerror = () => {
      cleanup();
      reject(new Error("Lỗi khi tải file video để tạo thumbnail"));
    };

    // Force load start on mobile
    try {
      video.load();
    } catch (e) {
      console.warn("video.load() warning:", e);
    }
  });
}

export function useCreatePostForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { token, user, loading } = useAuth();

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      toast({
        title: "Yêu cầu đăng nhập",
        description: "Vui lòng đăng nhập để tạo bài viết mới.",
        variant: "destructive",
      });
      router.push("/login");
    }
  }, [user, loading, router, toast]);

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [postType, setPostType] = useState<"video" | "image">("video");
  const [taggedMerchantId, setTaggedMerchantId] = useState<number | null>(null);
  const [selectedMerchant, setSelectedMerchant] = useState<Restaurant | null>(null);
  
  // Media File & Preview
  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

  // Restaurant search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Restaurant[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Orchestrator States
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  // Handle file drop / selection with validation
  const handleFileChange = useCallback((selectedFile: File | null) => {
    setError(null);
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy.file;
      return copy;
    });

    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }

    if (!selectedFile) {
      setFile(null);
      return;
    }

    // Validate size and format
    const maxVideoSize = 100 * 1024 * 1024; // 100MB
    const maxImageSize = 10 * 1024 * 1024; // 10MB

    const isVideo = selectedFile.type.startsWith("video/");
    const isImage = selectedFile.type.startsWith("image/");

    if (!isVideo && !isImage) {
      setFieldErrors((prev) => ({
        ...prev,
        file: "Định dạng file không hợp lệ. Vui lòng chọn file Video hoặc Hình ảnh.",
      }));
      setFile(null);
      return;
    }

    if (isVideo && selectedFile.size > maxVideoSize) {
      setFieldErrors((prev) => ({
        ...prev,
        file: "Dung lượng video vượt quá 100MB. Vui lòng nén video hoặc chọn file nhỏ hơn.",
      }));
      setFile(null);
      return;
    }

    if (isImage && selectedFile.size > maxImageSize) {
      setFieldErrors((prev) => ({
        ...prev,
        file: "Dung lượng hình ảnh vượt quá 10MB. Vui lòng chọn file nhỏ hơn.",
      }));
      setFile(null);
      return;
    }

    // Auto switch post type based on file detection
    const detectedType = isVideo ? "video" : "image";
    setPostType(detectedType);
    setFile(selectedFile);
    setFilePreviewUrl(URL.createObjectURL(selectedFile));
  }, [filePreviewUrl]);

  // Geo-search restaurants matching keyword
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        // HCMC center coordinates
        const lat = 10.775;
        const lng = 106.700;
        const radius = 50.0; // 50km radius to cover all seeded restaurants

        const response = await fetch(
          `/api/search?q=${encodeURIComponent(searchQuery)}&lat=${lat}&lng=${lng}&radius=${radius}&limit=10`
        );
        
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data);
        } else {
          console.error("Lỗi khi tìm kiếm nhà hàng");
        }
      } catch (err) {
        console.error("Lỗi mạng khi tìm kiếm nhà hàng:", err);
      } finally {
        setIsSearching(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const selectMerchant = (merchant: Restaurant | null) => {
    setSelectedMerchant(merchant);
    setTaggedMerchantId(merchant ? merchant.id : null);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Submit Orchestration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    let hasError = false;
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = "Vui lòng nhập tiêu đề cho bài viết.";
      hasError = true;
    }

    if (!file) {
      errors.file = "Vui lòng chọn file hình ảnh hoặc video review.";
      setFieldErrors(errors);
      setError("Vui lòng bổ sung đầy đủ thông tin bắt buộc.");
      return;
    }

    const currentFile = file;

    setIsLoading(true);
    setUploadProgress(0);

    try {
      if (!token) {
        throw new Error("Phiên làm việc hết hạn. Vui lòng đăng nhập lại.");
      }

      // Step 1: Extract Video Thumbnail if it's a video review
      let thumbnailUrl = "";
      if (postType === "video") {
        try {
          const thumbnailBlob = await generateVideoThumbnail(currentFile);
          
          // Request presigned URL for thumbnail image
          const thumbPresignedRes = await fetch("/api/content/presigned-url", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              file_name: `${currentFile.name.split(".")[0]}_thumb.jpg`,
              content_type: "image/jpeg",
              folder: "images"
            })
          });

          if (thumbPresignedRes.ok) {
            const { upload_url: thumbUploadUrl, public_url: thumbPublicUrl } = await thumbPresignedRes.json();
            
            // Upload thumbnail to R2
            await fetch(thumbUploadUrl, {
              method: "PUT",
              headers: {
                "Content-Type": "image/jpeg"
              },
              body: thumbnailBlob
            });
            
            thumbnailUrl = thumbPublicUrl;
          }
        } catch (thumbErr) {
          console.error("Lỗi tự động tạo thumbnail từ video:", thumbErr);
        }
      }

      // Step 2: Request Presigned URL from Cloudflare R2 via Backend for the main file
      const folderName = postType === "video" ? "videos" : "images";
      const presignedRes = await fetch("/api/content/presigned-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          file_name: currentFile.name,
          content_type: currentFile.type,
          folder: folderName
        })
      });

      if (!presignedRes.ok) {
        const errorData = await presignedRes.json().catch(() => ({}));
        throw new Error(errorData.detail || "Không thể khởi tạo link tải lên Cloudflare R2.");
      }

      const { upload_url, public_url } = await presignedRes.json();

      // Step 3: Upload File to Cloudflare R2 directly with Premium Progress Tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", upload_url, true);
        xhr.setRequestHeader("Content-Type", currentFile.type);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentage = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentage);
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve();
          } else {
            reject(new Error(`Tải file lên Cloudflare R2 thất bại (Mã lỗi: ${xhr.status}).`));
          }
        };

        xhr.onerror = () => {
          reject(new Error("Lỗi mạng xảy ra trong quá trình tải file lên Cloudflare R2. Vui lòng kiểm tra lại kích thước và kết nối mạng."));
        };

        xhr.send(currentFile);
      });

      // Step 4: Save Metadata to database
      // If it's an image, the video_url holds the image public URL.
      // The thumbnail_url can be the image itself. For videos, we use the auto-generated thumbnail.
      const defaultVideoThumb = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400";
      const thumbnail_url = postType === "image" ? public_url : (thumbnailUrl || defaultVideoThumb);

      const metadataRes = await fetch("/api/content/videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          video_url: public_url,
          thumbnail_url: thumbnail_url,
          description: description.trim() || null,
          tagged_merchant_id: taggedMerchantId,
          post_type: postType
        })
      });

      if (!metadataRes.ok) {
        const errorData = await metadataRes.json().catch(() => ({}));
        throw new Error(errorData.detail || "Lưu siêu dữ liệu bài đăng vào Database thất bại.");
      }

      const responseData = await metadataRes.json();

      toast({
        title: "Đăng tải thành công! 🎉",
        description: postType === "video" 
          ? "Bài review video của bạn đã được đăng và đang chờ duyệt!" 
          : "Bài viết hình ảnh của bạn đã được đăng thành công!",
      });

      // Redirect back to user's profile tab
      router.push("/profile");
    } catch (err: any) {
      console.error("Lỗi đăng bài viết:", err);
      setError(err.message || "Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.");
      toast({
        title: "Tải lên thất bại",
        description: err.message || "Không thể đăng bài viết. Vui lòng kiểm tra kết nối.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  return {
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
  };
}
