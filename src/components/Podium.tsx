import { motion } from 'framer-motion';
import type { Ambassador } from '../data/liveData';

interface PodiumProps {
  topRankers: Ambassador[];
  theme?: string;
  scoreLabels?: string[];
  categoryName?: string;
}

export function Podium({ topRankers, theme = 'blue', scoreLabels, categoryName }: PodiumProps) {
  const rank1 = topRankers[0];
  const rank2 = topRankers[1];
  const rank3 = topRankers[2];
  const isBlue = theme === 'blue';

  if (!rank1) return null;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const isEducationExcellence = categoryName?.toLowerCase().includes('giáo dục xuất sắc') && categoryName?.toLowerCase().includes('kỳ');

  const renderRank = (ranker: Ambassador | undefined, rank: number) => {
    if (!ranker) return <div className="flex-1" />;
    
    const isFirst = rank === 1;
    const isSecond = rank === 2;
    
    const rankColor = isFirst ? 'bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-600 border-t-[3px] border-yellow-200 shadow-[inset_0_4px_20px_rgba(255,255,255,0.5)]' 
                   : isSecond ? 'bg-gradient-to-b from-slate-200 via-slate-400 to-slate-500 border-t-[3px] border-white shadow-[inset_0_4px_20px_rgba(255,255,255,0.6)]'
                   : 'bg-gradient-to-b from-orange-300 via-orange-500 to-orange-700 border-t-[3px] border-orange-200 shadow-[inset_0_4px_20px_rgba(255,255,255,0.3)]';
    
    const heightClass = isFirst ? 'h-40 sm:h-48' 
                      : isSecond ? 'h-32 sm:h-36' 
                      : 'h-24 sm:h-28';

    const avatarBg = isBlue
      ? (isFirst ? 'bg-white ring-[4px] ring-amber-300 shadow-[0_0_30px_rgba(251,191,36,0.6)]' 
        : isSecond ? 'bg-white ring-[4px] ring-slate-300 shadow-[0_0_20px_rgba(148,163,184,0.4)]' 
        : 'bg-white ring-[4px] ring-orange-300 shadow-[0_0_20px_rgba(251,146,60,0.4)]')
      : (isFirst ? 'bg-slate-800 ring-[4px] ring-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.5)]' 
        : isSecond ? 'bg-slate-800 ring-[4px] ring-gray-400 shadow-[0_0_20px_rgba(156,163,175,0.3)]' 
        : 'bg-slate-800 ring-[4px] ring-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]');

    const scoreColor = isFirst 
      ? (isBlue ? 'text-amber-600' : 'text-yellow-400') 
      : isSecond 
        ? (isBlue ? 'text-slate-700' : 'text-gray-300') 
        : (isBlue ? 'text-amber-800' : 'text-amber-500');

    const nameColor = isBlue ? 'text-slate-800 font-extrabold' : 'text-white font-extrabold';
    const idColor = isBlue ? 'text-[#1B3A7A]/60' : 'text-blue-300/70';

    const formatScore = (score: number, label?: string) => {
      if (label && label.includes('%')) {
        return (score * 100).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + '%';
      }
      return score.toLocaleString('vi-VN');
    };

    return (
      <div className={`flex flex-col justify-end items-center flex-1 px-1 sm:px-2 ${isFirst ? 'z-20' : 'z-10'}`}>
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: rank * 0.15, duration: 0.5, type: "spring" }}
          className="flex flex-col items-center w-full relative"
        >
          {/* Star */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: rank * 0.15 + 0.3, type: "spring", stiffness: 200 }}
            className={`absolute ${isFirst ? 'w-10 h-10 -top-10 sm:-top-12 sm:w-14 sm:h-14' : 'w-8 h-8 -top-8 sm:-top-10 sm:w-10 sm:h-10'} z-30`}
            style={{ filter: isFirst ? 'drop-shadow(0px 3px 8px rgba(250,204,21,0.6))' 
                         : isSecond ? 'drop-shadow(0px 3px 6px rgba(156,163,175,0.4))' 
                         : 'drop-shadow(0px 3px 6px rgba(217,119,6,0.4))' }}
          >
            <svg viewBox="0 0 24 24" className="w-full h-full">
              <defs>
                <linearGradient id={`goldGrad-${rank}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FDE047" />
                  <stop offset="50%" stopColor="#EAB308" />
                  <stop offset="100%" stopColor="#A16207" />
                </linearGradient>
                <linearGradient id={`silverGrad-${rank}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E5E7EB" />
                  <stop offset="50%" stopColor="#9CA3AF" />
                  <stop offset="100%" stopColor="#6B7280" />
                </linearGradient>
                <linearGradient id={`bronzeGrad-${rank}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FCD34D" />
                  <stop offset="50%" stopColor="#D97706" />
                  <stop offset="100%" stopColor="#92400E" />
                </linearGradient>
              </defs>
              <path fill={isFirst ? `url(#goldGrad-${rank})` : isSecond ? `url(#silverGrad-${rank})` : `url(#bronzeGrad-${rank})`} d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z" />
            </svg>
          </motion.div>

          {/* Avatar */}
          <div className={`relative ${isFirst ? 'w-20 h-20 sm:w-28 sm:h-28' : 'w-16 h-16 sm:w-24 sm:h-24'} mb-4 shrink-0 z-20`}>
            {isFirst && (
              <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full scale-150 animate-pulse" />
            )}
            <div className={`w-full h-full rounded-full border-4 border-transparent overflow-hidden flex items-center justify-center font-bold text-lg sm:text-2xl relative z-10 ${avatarBg}`}>
              {ranker.avatar ? (
                <img src={ranker.avatar} alt={ranker.name} className="w-full h-full object-cover" />
              ) : (
                <span className={isBlue ? 'text-[#1B3A7A]' : 'text-blue-200'}>{getInitials(ranker.name)}</span>
              )}
            </div>
            {/* Rank badge */}
            <div className={`absolute -bottom-1.5 -right-1.5 w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-black text-white text-sm sm:text-base shadow-md z-20 ${
              isFirst ? 'bg-gradient-to-br from-yellow-400 to-amber-600' 
              : isSecond ? 'bg-gradient-to-br from-gray-300 to-gray-500' 
              : 'bg-gradient-to-br from-amber-500 to-amber-700'
            }`} style={{ border: isBlue ? '3px solid white' : '3px solid #121e40' }}>
              {rank}
            </div>
          </div>
          
          {/* Info */}
          <div className="text-center mb-5 px-1 min-h-[70px] flex flex-col items-center justify-end z-20">
            <h3 className={`text-[15px] sm:text-[18px] leading-[1.2] whitespace-normal break-words max-w-[120px] sm:max-w-[140px] drop-shadow-sm ${nameColor}`}>{ranker.name}</h3>
            <p className={`text-[11px] font-mono font-bold mt-1 ${idColor}`}>Mã: {ranker.id}</p>
            {isEducationExcellence && (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: rank * 0.15 + 0.4 }}
                className={`mt-2 px-3 py-1 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider relative overflow-hidden group shadow-lg ${
                isBlue 
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-amber-950 border border-yellow-200' 
                  : 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-white border border-amber-400/50'
              }`}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[-20deg] group-hover:animate-[shimmer_1.5s_infinite]" />
                <span className="relative z-10 flex items-center gap-1 drop-shadow-sm">✈️ 100% CHUYẾN DU LỊCH QUỐC TẾ</span>
              </motion.div>
            )}
            {categoryName?.toLowerCase().includes('quản lý xuất sắc kỳ i') && ranker.score >= 10000000000 && (ranker.score2 || 0) >= 40 && (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: rank * 0.15 + 0.4 }}
                className={`mt-2 px-3 py-1 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider relative overflow-hidden group shadow-lg ${
                isBlue 
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-amber-950 border border-yellow-200' 
                  : 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-white border border-amber-400/50'
              }`}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[-20deg] group-hover:animate-[shimmer_1.5s_infinite]" />
                <span className="relative z-10 flex items-center gap-1 drop-shadow-sm">
                  ✈️ {ranker.score >= 20000000000 && (ranker.score2 || 0) >= 80 ? '100% CHUYẾN DU LỊCH QUỐC TẾ' : '50% CHUYẾN DU LỊCH QUỐC TẾ'}
                </span>
              </motion.div>
            )}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: rank * 0.15 + 0.5 }}
              className={`mt-2.5 px-4 py-2 rounded-xl backdrop-blur-md flex flex-col items-center justify-center relative overflow-hidden ${
                isBlue 
                  ? 'bg-white/90 border border-white shadow-[0_8px_20px_rgba(0,0,0,0.06)]' 
                  : 'bg-white/10 border border-white/20 shadow-[0_8px_20px_rgba(0,0,0,0.3)]'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
              {scoreLabels && scoreLabels[0] && (
                <span className={`relative z-10 text-[9px] sm:text-[10px] mb-0.5 font-bold tracking-wide uppercase ${isBlue ? 'text-slate-500' : 'text-slate-300'}`}>{scoreLabels[0]}</span>
              )}
              <p className={`relative z-10 font-black tracking-tight ${scoreColor} text-[16px] sm:text-[20px] leading-none drop-shadow-sm`}>{formatScore(ranker.score, scoreLabels?.[0])}</p>
            </motion.div>
            {ranker.score2 !== undefined && ranker.score2 > 0 && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: rank * 0.15 + 0.6 }}
                className={`mt-1.5 px-3.5 py-1.5 rounded-lg backdrop-blur-sm text-center flex flex-col items-center justify-center relative overflow-hidden ${
                  isBlue 
                    ? 'bg-emerald-50/90 border border-emerald-100 shadow-sm' 
                    : 'bg-emerald-900/30 border border-emerald-500/20 shadow-sm'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/50 to-transparent pointer-events-none" />
                {scoreLabels && scoreLabels[1] && (
                  <span className={`relative z-10 text-[8.5px] sm:text-[9px] mb-0.5 font-bold uppercase tracking-wide ${isBlue ? 'text-emerald-600/80' : 'text-emerald-400/80'}`}>{scoreLabels[1]}</span>
                )}
                <p className={`relative z-10 font-black tracking-tight text-[13px] sm:text-[15px] leading-none ${isBlue ? 'text-emerald-700' : 'text-emerald-400'}`}>{formatScore(ranker.score2, scoreLabels?.[1])}</p>
              </motion.div>
            )}
          </div>
          
          {/* Podium pillar */}
          <div className={`w-full rounded-t-2xl ${rankColor} ${heightClass} flex justify-center items-start pt-4 relative overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
            <div className="absolute top-0 left-[-100%] w-[100%] h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-25deg] animate-[shimmer_3s_infinite]" />
            <span className={`font-heading font-black text-4xl sm:text-6xl relative z-10 drop-shadow-md ${isFirst ? 'text-yellow-100' : isSecond ? 'text-white' : 'text-orange-100'}`}>{rank}</span>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="relative pt-6 sm:pt-10 pb-2 px-1 flex justify-center items-end max-w-lg mx-auto">
      {renderRank(rank2, 2)}
      {renderRank(rank1, 1)}
      {renderRank(rank3, 3)}
    </div>
  );
}
