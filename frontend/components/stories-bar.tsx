"use client";

import { Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const stories = [
  {
    id: "your-story",
    name: "Tin của bạn",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    isYours: true,
    hasNew: false,
  },
  {
    id: "s1",
    name: "Minh Anh",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    isYours: false,
    hasNew: true,
  },
  {
    id: "s2",
    name: "Hoàng Nam",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    isYours: false,
    hasNew: true,
  },
  {
    id: "s3",
    name: "Thu Hương",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    isYours: false,
    hasNew: true,
  },
  {
    id: "s4",
    name: "Đức Minh",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    isYours: false,
    hasNew: false,
  },
  {
    id: "s5",
    name: "Linh Chi",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
    isYours: false,
    hasNew: true,
  },
];

export function StoriesBar() {
  return (
    <div className="bg-card border-b border-border">
      <div className="max-w-lg mx-auto px-4 py-3 overflow-x-auto scrollbar-hide">
        <div className="flex gap-4">
          {stories.map((story) => (
            <button
              key={story.id}
              className="flex flex-col items-center gap-1 min-w-[64px]"
            >
              <div
                className={`p-0.5 rounded-full ${
                  story.hasNew
                    ? "bg-gradient-to-tr from-primary to-accent"
                    : "bg-border"
                }`}
              >
                <div className="p-0.5 bg-card rounded-full relative">
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={story.avatar} alt={story.name} />
                    <AvatarFallback>{story.name[0]}</AvatarFallback>
                  </Avatar>
                  {story.isYours && (
                    <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-card">
                      <Plus className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
              </div>
              <span className="text-xs text-muted-foreground truncate w-full text-center">
                {story.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
