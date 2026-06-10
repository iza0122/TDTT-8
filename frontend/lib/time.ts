export function formatRelativeTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return "Vừa xong";
  try {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    const now = new Date();
    
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffSec < 60) {
      return "Vừa xong";
    } else if (diffMin < 60) {
      return `${diffMin} phút trước`;
    } else if (diffHr < 24) {
      return `${diffHr} giờ trước`;
    } else if (diffDays < 30) {
      return `${diffDays} ngày trước`;
    } else {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (e) {
    console.error("Lỗi format thời gian:", e);
    return "Vừa xong";
  }
}
