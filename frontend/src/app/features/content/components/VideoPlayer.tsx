import React, { useState, useRef } from "react";

interface VideoPlayerProps {
  videoUrl: string;
  description: string;
  merchantName: string;
  likes: number;
  commentsCount: number;
  onOpenComments: () => void;
}

export default function VideoPlayer({
  videoUrl,
  description,
  merchantName,
  likes,
  commentsCount,
  onOpenComments,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (isLiked) {
      setLikeCount(prev => prev - 1);
    } else {
      setLikeCount(prev => prev + 1);
    }
    setIsLiked(!isLiked);
  };

  return (
    <div 
      className="relative w-full h-full bg-black flex items-center justify-center cursor-pointer select-none"
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        loop
        playsInline
        className="w-full h-full object-cover"
      />

      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-white text-5xl">
          ▶️
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-16 p-4 bg-gradient-to-t from-black/80 to-transparent text-white space-y-1">
        <h3 className="font-bold text-sm text-orange-400">📍 {merchantName}</h3>
        <p className="text-xs text-gray-200 line-clamp-2">{description}</p>
      </div>

      <div className="absolute bottom-6 right-2 flex flex-col items-center gap-5 z-10">
        <button onClick={handleLike} className="flex flex-col items-center gap-1 group">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xl transition-all shadow-md ${
            isLiked ? "bg-red-500 scale-110" : "bg-white/20 hover:bg-white/30 backdrop-blur"
          }`}>
            {isLiked ? "❤️" : "🤍"}
          </div>
          <span className="text-[11px] text-white font-bold drop-shadow">{likeCount}</span>
        </button>

        <button 
          onClick={(e) => { e.stopPropagation(); onOpenComments(); }}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur flex items-center justify-center text-xl transition-all shadow-md">
            💬
          </div>
          <span className="text-[11px] text-white font-bold drop-shadow">{commentsCount}</span>
        </button>
      </div>
    </div>
  );
}