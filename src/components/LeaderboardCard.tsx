import type { CategoryResult } from '../data/liveData';
import { Podium } from './Podium';
import { Trophy, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export function LeaderboardCard({ data, index, theme = 'blue', lastUpdated }: { data: CategoryResult, index: number, theme?: string, lastUpdated?: Date | null }) {
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const isBlue = theme === 'blue';

  const getEligibilityInfo = (ranker: any, rank?: number) => {
    if (ranker.status) {
      // Always show badge with status text for all rankers
      return { isEligible: !!ranker.highlight, text: ranker.status, showBadge: showBadge };
    }

    const catNameLower = data.categoryName.toLowerCase();
    
    if (catNameLower.includes('quản lý xuất sắc kỳ i')) {
      const ds = ranker.score || 0;
      const active = ranker.score2 || 0;
      
      const passDS10 = ds >= 10000000000;
      const passActive40 = active >= 40;
      
      const passDS20 = ds >= 20000000000;
      const passActive80 = active >= 80;
      
      if (rank !== undefined) {
        if (rank <= 3 && passDS20 && passActive80) {
          return { isEligible: true, text: '100% CHUYẾN DU LỊCH QUỐC TẾ', showBadge: true };
        }
        if (rank <= 8 && passDS10 && passActive40) {
          return { isEligible: true, text: '50% CHUYẾN DU LỊCH QUỐC TẾ', showBadge: true };
        }
      }
      
      let reason = 'Chưa đủ điều kiện';
      if (!passDS10 && !passActive40) reason = 'Chưa đạt DS & SL Active';
      else if (!passDS10) reason = 'Chưa đạt Doanh số';
      else if (!passActive40) reason = 'Chưa đạt SL Active';
      else if (rank && rank > 8) reason = 'Hết suất thưởng';
      
      return { isEligible: false, text: reason, showBadge: false };
    }

    let isEligible = false;
    if (ranker.highlight) {
      isEligible = true;
    } else if (catNameLower.includes('vàng')) {
      if (catNameLower.includes('quý ii') || catNameLower.includes('quý 2')) {
        isEligible = ranker.score >= 25;
      } else {
        isEligible = ranker.score >= 15 && (ranker.score2 ?? 0) >= 150000000;
      }
    } else if (catNameLower.includes('đại sứ mới') && /tháng\s*\d+|t\d+/.test(catNameLower)) {
      isEligible = (ranker.score ?? 0) >= 30000000 || (ranker.score2 ?? 0) >= 30000000;
    }
    let currentBadgeText = badgeText;
    let currentShowBadge = showBadge;
    if (isEligible && catNameLower.includes('giáo dục xuất sắc') && catNameLower.includes('kỳ') && !catNameLower.includes('quý')) {
      if (rank !== undefined) {
        if (rank >= 1 && rank <= 3) currentBadgeText = '100% CHUYẾN DU LỊCH QUỐC TẾ';
        else if (rank >= 4 && rank <= 8) currentBadgeText = '50% CHUYẾN DU LỊCH QUỐC TẾ';
        else {
          currentShowBadge = false;
          isEligible = false;
        }
      }
    }
    if (ranker.hideBadge) {
      return { isEligible, text: '', showBadge: false };
    }
    
    return { isEligible, text: isEligible ? currentBadgeText : 'Chưa đủ điều kiện', showBadge: currentShowBadge };
  };

  const isManager = data.categoryName.toLowerCase().includes('tiêu biểu');
  const isNewAmbassador = data.categoryName.toLowerCase().includes('đại sứ mới');
  const isKyII = data.categoryName.includes('KỲ II');
  let badgeText = 'ĐẠT ĐIỀU KIỆN';
  let showBadge = true;
  if (isManager) badgeText = 'ĐẠT CHỈ TIÊU';
  else if (data.categoryName.toLowerCase().includes('vàng')) badgeText = 'ĐẠT EGC';
  else if (isNewAmbassador) {
    badgeText = 'ĐỦ ĐIỀU KIỆN';
    showBadge = true; // Always show status for new ambassador
  }

  const hasPodium = !isManager && data.topRankers.length > 0;
  const tableRankers = isManager ? [...data.topRankers, ...data.otherRankers] : data.otherRankers;

  // Check if table already has a status/condition column (to avoid showing duplicate badges under names)
  const hasStatusColumn = data.scoreLabels?.some((l: string) => {
    const ll = l.toLowerCase();
    return ll.includes('trạng thái') || ll.includes('điều kiện') || ll.includes('đạt/cận') || ll.includes('đạt/chưa');
  }) ?? false;

  const formatLastUpdated = (date: Date) => {
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatScore = (score: number | string | undefined | null, label?: string) => {
    if (score == null) return '—';
    if (typeof score === 'string') return score;
    if (label && label.includes('%')) {
      return (score * 100).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + '%';
    }
    return score.toLocaleString('vi-VN');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
      className={`rounded-3xl overflow-hidden mb-6 transition-all duration-500 ${
        isBlue 
          ? 'bg-white shadow-[0_4px_25px_rgba(0,0,0,0.08)] border border-slate-200/80 hover:shadow-[0_8px_40px_rgba(0,0,0,0.12)]' 
          : 'bg-white/[0.04] shadow-[0_8px_40px_rgba(0,0,0,0.4)] border border-white/[0.08] hover:border-white/[0.15]'
      }`}
    >
      {/* Card Header — Galaxy Blue gradient */}
      <div className="relative px-4 sm:px-6 py-4 sm:py-5 flex items-start justify-between overflow-hidden bg-gradient-to-r from-[#1B3A7A] via-[#1a4fa0] to-[#2563eb]">
        <div className="flex-1 min-w-0 relative z-10 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-base sm:text-xl font-heading font-extrabold text-white flex items-center gap-2 sm:gap-3 select-none">
              <div className="p-2 bg-white/15 rounded-xl backdrop-blur-sm shrink-0">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
              <span className="truncate">{data.categoryName.toLowerCase().includes('kỳ') ? data.categoryName.replace(/\s*-\s*Cấp\s+(Nhóm|Phòng|Khu\s*vực)/i, '') : data.categoryName}</span>
            </h2>
            {data.categorySubtitle && (
              <p className="text-[11px] sm:text-xs text-white/50 font-medium mt-1.5 ml-[52px] leading-relaxed pr-2">
                {data.categorySubtitle}
              </p>
            )}
          </div>
          <div className="ml-[52px] sm:ml-0 shrink-0 flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold px-4 py-2 bg-emerald-400/20 rounded-full text-emerald-300 border border-emerald-400/30 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              Trực tuyến
            </span>
            <a href="/awards" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white border border-white/20 transition-colors whitespace-nowrap">
              Xem lại Chương trình thi đua
            </a>
          </div>
        </div>
      </div>

      <div className={`px-4 sm:px-6 py-2.5 text-[10px] sm:text-[11px] font-medium italic border-b flex gap-2 ${
        isBlue ? 'bg-amber-50 text-amber-800 border-amber-100/50' : 'bg-amber-500/10 text-amber-200/80 border-amber-500/20'
      }`}>
        <span className={isBlue ? 'text-amber-500 font-black' : 'text-amber-400 font-black'}>*</span> 
        <span>Đây chỉ là kết quả tạm tính. Kết quả đạt giải chính thức sẽ được công bố sau khi tổng kết kỳ xét giải dựa trên dữ liệu đã được đối soát theo quy định của Galaxy Education.</span>
      </div>
      
      {/* Podium */}
      {hasPodium && (
        <div className={`p-2 sm:p-6 pb-0 ${
          isBlue 
            ? 'bg-gradient-to-b from-[#e8f0fe] via-[#dce8fa] to-white' 
            : 'bg-gradient-to-b from-[#121e40] via-[#0d1a3c] to-transparent'
        }`}>
          <Podium topRankers={data.topRankers} theme={theme} scoreLabels={data.scoreLabels} categoryName={data.categoryName} />
        </div>
      )}

      {/* Table */}
      {data.isUpdating ? (
        <div className="px-6 py-12 text-center">
          <div className={`inline-flex items-center justify-center p-3 rounded-full mb-3 ${isBlue ? 'bg-blue-50 text-blue-400' : 'bg-blue-900/30 text-blue-400'}`}>
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <p className={`font-medium ${isBlue ? 'text-slate-500' : 'text-white/50'}`}>Hạng mục giải thưởng đang được cập nhật...</p>
        </div>
      ) : tableRankers.length > 0 && (
        <div className="px-2 sm:px-6 pb-4 pt-4">
          <div className={`rounded-2xl overflow-x-auto ${
            isBlue 
              ? 'border border-slate-200 bg-slate-50/50' 
              : 'border border-white/[0.06] bg-white/[0.02]'
          }`} style={{ WebkitOverflowScrolling: 'touch' as any }}>
            <table className="w-full text-left whitespace-nowrap">
              <thead className={`text-left text-[11px] sm:text-[13px] font-bold uppercase tracking-wider ${isBlue ? 'text-slate-500 bg-slate-50' : 'text-slate-400 bg-white/[0.02]'} border-b ${isBlue ? 'border-slate-200' : 'border-white/10'}`}>
                <tr>
                  {!isKyII && !isManager && <th className="py-3 px-2 sm:px-4 text-center w-12 sm:w-16">Hạng</th>}
                  <th className="py-3 px-2 sm:px-4 w-20 sm:w-24">Mã Đại sứ</th>
                  <th className="py-3 px-2 sm:px-4">Tên Đại sứ</th>
                  {data.scoreLabels?.map((label, idx) => (
                      <th key={idx} className="px-0.5 sm:px-4 py-2 sm:py-3.5 text-right whitespace-normal leading-tight">
                        {label}
                      </th>
                    ))
                  }
                  {!data.scoreLabels && (data.hasMultipleScores ? (
                    <>
                      <th className="px-0.5 sm:px-4 py-2 sm:py-3.5 text-right whitespace-normal leading-tight">SL N-1</th>
                      <th className="px-1 sm:px-4 py-2 sm:py-3.5 text-right whitespace-normal leading-tight">DS N-1</th>
                    </>
                  ) : (
                    <th className="px-1 sm:px-4 py-2 sm:py-3.5 text-right">Thành tích</th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${isBlue ? 'divide-slate-100' : 'divide-white/[0.04]'}`}>
                {tableRankers.map((ranker, i) => {
                  const rank = ranker.rank || (isManager ? i + 1 : data.topRankers.length + i + 1);
                  const { isEligible, text: statusText, showBadge: rankerShowBadge } = getEligibilityInfo(ranker, rank);

                  return (
                  <motion.tr 
                    key={ranker.id} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.03 }}
                    className={`group transition-all duration-300 cursor-pointer ${
                      isEligible 
                        ? (isBlue ? 'bg-gradient-to-r from-amber-50/80 to-transparent hover:from-amber-100/80' : 'bg-gradient-to-r from-amber-500/10 to-transparent hover:from-amber-500/20')
                        : (isBlue ? 'hover:bg-blue-50/60' : 'hover:bg-white/[0.04]')
                    }`}
                  >
                  {!isKyII && !isManager && (
                  <td className="py-3 sm:py-4 px-2 sm:px-4 text-center">
                    <span className={`font-black text-[13px] sm:text-[15px] ${isBlue ? 'text-slate-400' : 'text-slate-500'}`}>
                      {rank}
                    </span>
                  </td>
                  )}
                  <td className="px-0.5 sm:px-4 py-2 sm:py-3.5 text-center font-mono font-medium text-[9px] sm:text-sm text-slate-400">
                      {ranker.id}
                  </td>
                  <td className="px-0.5 sm:px-4 py-2 sm:py-3.5">
                      <div className="flex items-center gap-1 sm:gap-3">
                        <div className={`hidden sm:flex w-10 h-10 rounded-full items-center justify-center font-bold text-sm shrink-0 ring-1 overflow-hidden transition-all ${
                          isEligible 
                            ? (isBlue ? 'bg-gradient-to-br from-amber-100 to-yellow-200 text-amber-700 ring-amber-300 group-hover:ring-amber-500' : 'bg-gradient-to-br from-amber-900/60 to-yellow-900/40 text-amber-400 ring-amber-500/30 group-hover:ring-amber-500/60')
                            : (isBlue 
                              ? 'bg-gradient-to-br from-blue-100 to-indigo-100 text-[#1B3A7A] ring-blue-200 group-hover:ring-blue-400' 
                              : 'bg-gradient-to-br from-blue-900/40 to-indigo-900/40 text-blue-300 ring-white/10')
                        }`}>
                          {ranker.avatar ? <img src={ranker.avatar} alt={ranker.name} className="w-full h-full object-cover"/> : getInitials(ranker.name)}
                        </div>
                        <div className="min-w-0">
                          <p className={`font-semibold text-[10px] sm:text-[15px] leading-tight transition-colors truncate max-w-[100px] sm:max-w-none ${
                            isEligible
                              ? (isBlue ? 'text-amber-800 group-hover:text-amber-950' : 'text-amber-400 group-hover:text-amber-300')
                              : (isBlue ? 'text-slate-700 group-hover:text-slate-900' : 'text-white/80 group-hover:text-white')
                          }`}>{ranker.name}</p>
                          {rankerShowBadge && !hasStatusColumn && (
                            <div className={`hidden sm:flex items-center mt-0.5 px-1.5 py-0.5 rounded border w-fit transition-colors ${
                              isEligible 
                                ? (isBlue ? 'border-amber-300/50 bg-amber-100/50 text-amber-700' : 'border-amber-500/30 bg-amber-500/10 text-amber-400')
                                : (isBlue ? 'border-slate-200 bg-slate-100 text-slate-500' : 'border-white/10 bg-white/5 text-white/40')
                            }`}>
                              <span className={`text-[9px] font-bold uppercase tracking-wider ${!isEligible ? 'opacity-80' : ''}`}>
                                {statusText}
                              </span>
                            </div>
                          )}
                          {rankerShowBadge && !hasStatusColumn && (
                            <div className="flex sm:hidden mt-0.5 items-center gap-1">
                              {isEligible ? (
                                <div className={`w-1.5 h-1.5 rounded-full ${isBlue ? 'bg-amber-400' : 'bg-amber-500'}`} />
                              ) : (
                                <div className={`flex items-center gap-1`}>
                                  <div className={`w-1 h-1 rounded-full ${isBlue ? 'bg-slate-300' : 'bg-white/20'}`} />
                                  <span className={`text-[8px] italic ${isBlue ? 'text-slate-400' : 'text-white/30'}`}>{!isEligible && statusText.includes('Chưa đạt') ? statusText : 'Chưa đủ ĐK'}</span>
                                </div>
                              )}
                            </div>
                          )}
                          {/* Bỏ region dưới tên cho QL Tiêu biểu vì đã có cột Cấp bậc riêng */}
                          {ranker.region && !isManager && <p className={`text-[10px] mt-0.5 ${isBlue ? 'text-slate-400' : 'text-white/25'} hidden sm:block`}>{ranker.region}</p>}
                        </div>
                      </div>
                    </td>
                    {/* Score columns */}
                    {ranker.columns && ranker.columns.length > 0 ? (
                      ranker.columns.map((col, idx) => (
                        <td key={idx} className="px-0.5 sm:px-4 py-2 sm:py-3.5 text-right">
                          <span className={`font-bold tracking-tight text-[11px] sm:text-[14px] ${
                            isEligible
                              ? (isBlue ? (idx === 0 ? 'text-[#1B3A7A]' : 'text-emerald-600') : (idx === 0 ? 'text-amber-400' : 'text-emerald-400'))
                              : (isBlue ? 'text-slate-600' : 'text-slate-400')
                          }`}>
                            {col.value}
                          </span>
                        </td>
                      ))
                    ) : data.hasMultipleScores ? (
                      <>
                        <td className="px-0.5 sm:px-4 py-2 sm:py-3.5 text-right">
                          <span className={`font-black text-[10px] sm:text-base transition-colors ${
                            isBlue ? 'text-[#1B3A7A] group-hover:text-blue-700' : 'text-amber-400/80 group-hover:text-amber-400'
                          }`}>
                            {formatScore(ranker.score, data.scoreLabels?.[0])}
                          </span>
                        </td>
                        <td className="px-1 sm:px-4 py-2 sm:py-3.5 text-right">
                            <span className={`font-bold tracking-tight text-[12px] sm:text-[14px] ${
                              isEligible
                                ? (isBlue ? 'text-emerald-600' : 'text-emerald-400')
                                : (isBlue ? 'text-emerald-700/60' : 'text-emerald-600/50')
                            }`}>
                              {formatScore(ranker.score2 ?? 0, data.scoreLabels?.[1])}
                            </span>
                        </td>
                      </>
                    ) : (
                      <td className="px-1 sm:px-4 py-2 sm:py-3.5 text-right">
                          <div className={`flex items-center justify-end gap-1.5 font-black tracking-tight text-[13px] sm:text-[15px] ${
                            isEligible
                              ? (isBlue ? 'text-[#0F172A]' : 'text-white')
                              : (isBlue ? 'text-slate-600' : 'text-slate-400')
                          }`}>
                            {isEligible && (
                              <svg className={`w-3 h-3 ${isBlue ? 'text-emerald-500' : 'text-emerald-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                            )}
                            {formatScore(ranker.score, data.scoreLabels?.[0])}
                          </div>
                      </td>
                    )}
                  </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Last Updated Note */}
      {lastUpdated && (
        <div className={`px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-end gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-medium border-t flex-wrap ${
          isBlue 
            ? 'border-slate-100 text-slate-400 bg-slate-50/30' 
            : 'border-white/[0.04] text-white/30 bg-white/[0.01]'
        }`}>
          <Clock size={12} className={isBlue ? 'text-blue-400' : 'text-blue-400/60'} />
          <span>Số liệu đang được cập nhật đến: <strong className={isBlue ? 'text-slate-600' : 'text-white/60'}>{formatLastUpdated(lastUpdated)}</strong></span>
        </div>
      )}
    </motion.div>
  );
}
