import { GE_LEADERBOARD_DATA } from './mockData';

export interface Ambassador {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  score2?: number | string;        // Cột thứ 2 (vd: Doanh số N-1 mới, Ngày tham gia)
  scoreLabel?: string;    // Label cột 1 (vd: Số lượng N-1 mới active)
  score2Label?: string;   // Label cột 2
  region?: string;
  highlight?: boolean;    // Badge highlight cho người đạt target
  status?: string;        // Ghi chú trạng thái (đủ điều kiện, chưa đủ điều kiện,...)
  columns?: { label: string; value: string | number }[]; // Mảng các cột dữ liệu động
  rank?: number;          // Xếp hạng cụ thể (nếu có từ file)
  hideBadge?: boolean;    // Ẩn badge trạng thái
}

export interface CategoryResult {
  categoryId: string;
  categoryName: string;
  categorySubtitle?: string;
  topRankers: Ambassador[]; 
  otherRankers: Ambassador[];
  hasMultipleScores?: boolean;
  scoreLabels?: string[];
  isUpdating?: boolean;   // Đánh dấu hạng mục đang cập nhật giải
}

export interface LeaderboardData {
  month: CategoryResult[];
  quarter: CategoryResult[];
  challenge: CategoryResult[];
  semester: CategoryResult[];
}

/**
 * Fetch leaderboard data from Vercel API (cached, pre-parsed JSON).
 * Fallback: fetch directly from Apps Script URL.
 */
export async function fetchLeaderboardData(_sheetUrl?: string): Promise<LeaderboardData> {
  // Try Vercel API first (has CDN cache)
  try {
    const res = await fetch('/api/leaderboard');
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback below
  }

  // Fallback: direct Apps Script call
  const appsScriptUrl = import.meta.env.VITE_APPS_SCRIPT_URL;
  if (appsScriptUrl) {
    try {
      const res = await fetch(`${appsScriptUrl}?action=leaderboard`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback below
    }
  }

  // Nếu không fetch được (ví dụ chạy local không có .env)
  // Trả về mock data thay vì mảng rỗng để dễ test UI
  console.warn("Dùng Mock Data do không kết nối được với API");
  return GE_LEADERBOARD_DATA;
}
