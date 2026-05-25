import React, { useState } from "react";

interface CommentSectionProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommentSection({ isOpen, onClose }: CommentSectionProps) {
  const [comments, setComments] = useState([
    { id: 1, user: "Hoàng", text: "Quán này bún bò nhiều thịt cực, nước ngọt thanh!" },
    { id: 2, user: "Trí", text: "Giá hạt dẻ hợp ví sinh viên lắm nha mọi người." },
  ]);
  const [newComment, setNewComment] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments([...comments, { id: Date.now(), user: "Tôi", text: newComment }]);
    setNewComment("");
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-y-0 right-0 w-80 bg-white shadow-2xl z-40 flex flex-col border-l border-gray-100 animate-slide-left">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h4 className="font-bold text-sm text-gray-800">Bình luận ({comments.length})</h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-100">
            <span className="font-bold text-gray-800 block mb-0.5">{c.user}</span>
            <span className="text-gray-600 leading-relaxed">{c.text}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-gray-100 flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => e.target.value}
          placeholder="Thêm bình luận công khai..."
          className="flex-1 px-3 py-2 bg-gray-100 rounded-xl outline-none text-xs focus:bg-white focus:ring-1 focus:ring-orange-500 transition-all"
        />
        <button type="submit" className="px-3 py-2 bg-orange-500 text-white font-bold text-xs rounded-xl">Gửi</button>
      </form>
    </div>
  );
}