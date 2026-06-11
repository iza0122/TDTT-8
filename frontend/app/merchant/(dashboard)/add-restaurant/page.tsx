"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Sparkles, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { createMerchant } from "@/lib/services/merchant";
import { useToast } from "@/hooks/use-toast";

export default function AddRestaurantPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState("");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user || user.role !== "merchant") {
    // Optionally redirect or show an access denied message
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-red-500">Access Denied: Only merchants can add restaurants.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!token) {
      setError("Authentication token not found. Please log in again.");
      setIsLoading(false);
      return;
    }

    try {
      const newMerchant = await createMerchant(token, {
        name,
        address,
        category,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        description,
      });
      toast({
        title: "Thành công! 🎉",
        description: `Quán ăn '${newMerchant.name}' đã được thêm.`, // Use newMerchant.name if available from response
        variant: "default"
      });
      router.push("/merchant"); // Redirect to merchant dashboard
    } catch (err: any) {
      console.error("Lỗi khi thêm quán ăn:", err);
      setError(err.message || "Đã xảy ra lỗi khi thêm quán ăn.");
      toast({
        title: "Lỗi 🙁",
        description: err.message || "Đã xảy ra lỗi khi thêm quán ăn.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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
          <Link href="/merchant">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 group h-9 w-9">
              <ArrowLeft className="w-4 h-4 text-foreground group-hover:-translate-x-0.5 transition-transform" />
            </Button>
          </Link>
          <h1 className="font-bold text-[10px] tracking-[0.2em] flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent uppercase">
            <Sparkles className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
            Thêm Quán Ăn Mới
          </h1>
          <div className="w-9 h-9" /> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 mt-8 relative">
        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 animate-shake">
              <Sparkles className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-500 font-medium">{error}</p>
            </div>
          )}

          <div className="rounded-[2.5rem] bg-white/40 dark:bg-neutral-900/10 border border-neutral-200/50 dark:border-neutral-800/50 backdrop-blur-xl p-2.5 shadow-xl shadow-neutral-200/10 dark:shadow-black/20">
            <div className="rounded-[calc(2.5rem-0.625rem)] bg-card/90 dark:bg-neutral-900/90 border border-neutral-100/70 dark:border-neutral-800/60 p-6 md:p-8 space-y-6 shadow-inner">
              
              {/* Name Input */}
              <div className="space-y-3">
                <Label htmlFor="name">Tên quán <span className="text-orange-500">*</span></Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Ví dụ: Phở An, Bún đậu Mắm tôm Cô Tuyết..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Address Input */}
              <div className="space-y-3">
                <Label htmlFor="address">Địa chỉ <span className="text-orange-500">*</span></Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="Ví dụ: 123 Đường ABC, Quận 1, TP.HCM..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              {/* Category Input */}
              <div className="space-y-3">
                <Label htmlFor="category">Danh mục <span className="text-orange-500">*</span></Label>
                <Input
                  id="category"
                  type="text"
                  placeholder="Ví dụ: Món ăn Việt, Cafe, Trà sữa..."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                />
              </div>

              {/* Latitude Input */}
              <div className="space-y-3">
                <Label htmlFor="latitude">Vĩ độ <span className="text-orange-500">*</span></Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="Ví dụ: 10.762622"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  required
                />
              </div>

              {/* Longitude Input */}
              <div className="space-y-3">
                <Label htmlFor="longitude">Kinh độ <span className="text-orange-500">*</span></Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="Ví dụ: 106.660172"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  required
                />
              </div>

              {/* Description Textarea */}
              <div className="space-y-3">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  placeholder="Mô tả chi tiết về quán ăn của bạn..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-7 text-sm shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35 hover:scale-[1.01] active:scale-[0.98] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex items-center justify-center gap-2 group relative overflow-hidden"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang thêm quán ăn...
              </span>
            ) : (
              <>
                <span className="tracking-wide">Thêm Quán Ăn</span>
                <span className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center transition-all duration-300 group-hover:translate-x-1 group-hover:scale-105 shadow-sm">
                  <Home className="w-4 h-4 text-white" />
                </span>
              </>
            )}
          </Button>
        </form>
      </main>
    </div>
  );
}