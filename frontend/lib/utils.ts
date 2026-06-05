import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimeAgo(dateInput: Date | string | number | undefined | null): string {
  if (!dateInput) return "Vừa xong";
  
  let dateStr = String(dateInput);
  
  // Nếu là naive ISO datetime string từ Backend (ví dụ '2026-06-05T03:56:46' không chứa múi giờ),
  // ta tách phần time và kiểm tra để thêm 'Z' nhằm parse đúng giờ UTC.
  if (dateStr.includes('T')) {
    const parts = dateStr.split('T');
    const timePart = parts[1];
    if (!timePart.includes('Z') && !timePart.includes('+') && !timePart.includes('-')) {
      dateStr += 'Z';
    }
  }
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Vừa xong";

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Vừa xong";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} giờ trước`;
  }

  // Quá 1 ngày (24 giờ) -> hiện ngày tháng cụ thể dạng "DD thg MM"
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day} thg ${month}`;
}
