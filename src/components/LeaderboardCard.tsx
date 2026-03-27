import type { CategoryResult } from '../data/liveData';
import { Podium } from './Podium';
import { Trophy, TrendingUp, Star, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export function LeaderboardCard({ data, index, theme = 'blue', lastUpdated }: { data: CategoryResult, index: number, theme?: string, lastUpdated?: Date | null }) {
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const isBlue = theme === 'blue';

  const checkEligible = (ranker: any) => {
    if (ranker.highlight) return true;
    if (data.categoryName.toLowerCase().includes('vàng')) {
      return ranker.score >= 15 && (ranker.score2 ?? 0) >= 150000000;
    }
    return false;
  };

  const isManager = data.categoryName.toLowerCase().includes('tiêu biểu');
  const badgeText = isManager ? 'ĐẠT CHỈ TIÊU' : 'ĐẠT EGC';

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
      <div className="relative px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between overflow-hidden bg-gradient-to-r from-[#1B3A7A] via-[#1a4fa0] to-[#2563eb]">
        <div className="flex-1 min-w-0 relative z-10">
          <h2 className="text-base sm:text-xl font-heading font-extrabold text-white flex items-center gap-2 sm:gap-3 select-none">
            <div className="p-2 bg-white/15 rounded-xl backdrop-blur-sm shrink-0">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <span className="truncate">{data.categoryName}</span>
          </h2>
          {data.categorySubtitle && (
            <p className="text-[11px] sm:text-xs text-white/50 font-medium mt-1.5 ml-[52px] leading-relaxed">
              {data.categorySubtitle}
            </p>
          )}
        </div>
        <div className="relative z-10 hidden sm:flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-bold px-4 py-2 bg-emerald-400/20 rounded-full text-emerald-300 border border-emerald-400/30 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            Trực tuyến
          </span>
        </div>
      </div>
      
      {/* Podium */}
      <div className={`p-2 sm:p-6 pb-0 ${
        isBlue 
          ? 'bg-gradient-to-b from-[#e8f0fe] via-[#dce8fa] to-white' 
          : 'bg-gradient-to-b from-[#121e40] via-[#0d1a3c] to-transparent'
      }`}>
        {data.topRankers.length > 0 && <Podium topRankers={data.topRankers} theme={theme} />}
      </div>

      {/* Table */}
      {data.otherRankers.length > 0 && (
        <div className="px-2 sm:px-6 pb-4 pt-4">
          <div className={`rounded-2xl overflow-x-auto ${
            isBlue 
              ? 'border border-slate-200 bg-slate-50/50' 
              : 'border border-white/[0.06] bg-white/[0.02]'
          }`} style={{ WebkitOverflowScrolling: 'touch' as any }}>
            <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap">
              <thead className={`font-semibold uppercase text-[9px] sm:text-[10px] tracking-[0.1em] sm:tracking-[0.15em] ${
                isBlue 
                  ? 'bg-slate-100 text-slate-400 border-b border-slate-200' 
                  : 'bg-white/[0.03] text-white/30 border-b border-white/[0.06]'
              }`}>
                <tr>
                  <th className="px-1.5 sm:px-4 py-2.5 sm:py-3.5 text-center w-8 sm:w-16 hidden sm:table-cell">STT</th>
                  <th className="px-1 sm:px-4 py-2.5 sm:py-3.5 w-14 sm:w-28 text-center hidden sm:table-cell">Mã ĐS</th>
                  <th className="px-1.5 sm:px-4 py-2.5 sm:py-3.5">Tên Đại sứ</th>
                  {data.hasMultipleScores ? (
                    <>
                      <th className="px-1.5 sm:px-4 py-2.5 sm:py-3.5 text-right whitespace-normal sm:whitespace-nowrap">{data.scoreLabels?.[0] || 'SL N-1 active'}</th>
                      <th className="px-1.5 sm:px-4 py-2.5 sm:py-3.5 text-right whitespace-normal sm:whitespace-nowrap">{data.scoreLabels?.[1] || 'DS N-1 mới'}</th>
                    </>
                  ) : (
                    <th className="px-1.5 sm:px-4 py-2.5 sm:py-3.5 text-right">Thành tích</th>
                  )}
                </tr>
              </thead>
              <tbody className={`divide-y ${isBlue ? 'divide-slate-100' : 'divide-white/[0.04]'}`}>
                {data.otherRankers.map((ranker, i) => {
                  const isEligible = checkEligible(ranker);
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
                    <td className={`px-1.5 sm:px-4 py-2.5 sm:py-3.5 text-center font-bold text-xs sm:text-sm hidden sm:table-cell ${
                      isBlue ? 'text-slate-300 group-hover:text-[#1B3A7A]' : 'text-white/25 group-hover:text-amber-400'
                    } transition-colors`}>
                      {data.topRankers.length + i + 1}
                    </td>
                    <td className={`px-1 sm:px-4 py-2.5 sm:py-3.5 text-center font-mono font-medium text-[10px] sm:text-sm hidden sm:table-cell ${
                      isBlue ? 'text-slate-400' : 'text-blue-300/40'
                    }`}>
                      {ranker.id}
                    </td>
                    <td className="px-1.5 sm:px-4 py-2.5 sm:py-3.5">
                      <div className="flex items-center gap-1.5 sm:gap-3">
                        <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-sm shrink-0 ring-1 overflow-hidden transition-all ${
                          isEligible 
                            ? (isBlue ? 'bg-gradient-to-br from-amber-100 to-yellow-200 text-amber-700 ring-amber-300 group-hover:ring-amber-500' : 'bg-gradient-to-br from-amber-900/60 to-yellow-900/40 text-amber-400 ring-amber-500/30 group-hover:ring-amber-500/60')
                            : (isBlue 
                              ? 'bg-gradient-to-br from-blue-100 to-indigo-100 text-[#1B3A7A] ring-blue-200 group-hover:ring-blue-400' 
                              : 'bg-gradient-to-br from-blue-900/40 to-indigo-900/40 text-blue-300 ring-white/10')
                        }`}>
                          {ranker.avatar ? <img src={ranker.avatar} alt={ranker.name} className="w-full h-full object-cover"/> : getInitials(ranker.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                            <p className={`font-semibold text-[11px] sm:text-[15px] leading-tight transition-colors truncate ${
                              isEligible
                                ? (isBlue ? 'text-amber-800 group-hover:text-amber-950' : 'text-amber-400 group-hover:text-amber-300')
                                : (isBlue ? 'text-slate-700 group-hover:text-slate-900' : 'text-white/80 group-hover:text-white')
                            }`}>{ranker.name}</p>
                            {isEligible && (
                              <div className={`hidden sm:flex items-center justify-center px-1.5 sm:px-2 py-0.5 rounded border ${
                                isBlue ? 'border-amber-300/50 bg-amber-100/50 text-amber-700' : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                              }`}>
                                <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-500 text-amber-500 relative -top-[0.5px] mr-1" />
                                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">{badgeText}</span>
                              </div>
                            )}
                          </div>
                          {ranker.region && <p className={`text-[10px] sm:text-xs mt-0.5 ${isBlue ? 'text-slate-400' : 'text-white/25'} hidden sm:block`}>{ranker.region}</p>}
                        </div>
                      </div>
                    </td>
                    {data.hasMultipleScores ? (
                      <>
                        <td className="px-1.5 sm:px-4 py-2.5 sm:py-3.5 text-right">
                          <span className={`font-black text-[11px] sm:text-base transition-colors ${
                            isBlue ? 'text-[#1B3A7A] group-hover:text-blue-700' : 'text-amber-400/80 group-hover:text-amber-400'
                          }`}>
                            {ranker.score.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-1.5 sm:px-4 py-2.5 sm:py-3.5 text-right">
                          <span className={`font-black text-[11px] sm:text-base transition-colors ${
                            isBlue ? 'text-emerald-600 group-hover:text-emerald-700' : 'text-emerald-400/80 group-hover:text-emerald-400'
                          }`}>
                            {(ranker.score2 ?? 0).toLocaleString()}
                          </span>
                        </td>
                      </>
                    ) : (
                      <td className="px-1.5 sm:px-4 py-2.5 sm:py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          <TrendingUp size={14} className={`hidden sm:block transition-colors ${
                            isBlue ? 'text-emerald-400/40 group-hover:text-emerald-500' : 'text-emerald-400/30 group-hover:text-emerald-400'
                          }`} />
                          <span className={`font-black text-[11px] sm:text-base transition-colors ${
                            isBlue ? 'text-[#1B3A7A] group-hover:text-blue-700' : 'text-amber-400/80 group-hover:text-amber-400'
                          }`}>
                            {ranker.score.toLocaleString()}
                          </span>
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
