import { motion } from 'framer-motion';
import type { Ambassador } from '../data/liveData';

interface PodiumProps {
  topRankers: Ambassador[];
  theme?: string;
}

export function Podium({ topRankers, theme = 'blue' }: PodiumProps) {
  const rank1 = topRankers[0];
  const rank2 = topRankers[1];
  const rank3 = topRankers[2];
  const isBlue = theme === 'blue';

  if (!rank1) return null;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const renderRank = (ranker: Ambassador | undefined, rank: number) => {
    if (!ranker) return <div className="flex-1" />;
    
    const isFirst = rank === 1;
    const isSecond = rank === 2;
    
    const rankColor = isFirst ? 'bg-gradient-to-t from-yellow-500 via-yellow-400 to-yellow-300' 
                   : isSecond ? 'bg-gradient-to-t from-gray-400 via-gray-300 to-gray-200'
                   : 'bg-gradient-to-t from-amber-700 via-amber-600 to-amber-500';
    
    const heightClass = isFirst ? 'h-36 sm:h-44' 
                      : isSecond ? 'h-28 sm:h-32' 
                      : 'h-20 sm:h-24';

    const avatarBg = isBlue
      ? (isFirst ? 'bg-gradient-to-br from-amber-50 to-yellow-100 ring-amber-300' 
        : isSecond ? 'bg-gradient-to-br from-gray-100 to-slate-200 ring-gray-300' 
        : 'bg-gradient-to-br from-orange-50 to-amber-100 ring-amber-400')
      : (isFirst ? 'bg-gradient-to-br from-yellow-900/40 to-amber-800/40 ring-yellow-500/50' 
        : isSecond ? 'bg-gradient-to-br from-gray-700/40 to-slate-600/40 ring-gray-400/50' 
        : 'bg-gradient-to-br from-amber-900/40 to-orange-800/40 ring-amber-500/50');

    const scoreColor = isFirst 
      ? (isBlue ? 'text-amber-600' : 'text-yellow-400') 
      : isSecond 
        ? (isBlue ? 'text-slate-700' : 'text-gray-300') 
        : (isBlue ? 'text-amber-800' : 'text-amber-500');

    const nameColor = isBlue ? 'text-slate-800 font-extrabold' : 'text-white font-extrabold';
    const idColor = isBlue ? 'text-[#1B3A7A]/60' : 'text-blue-300/70';

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
          <div className={`relative ${isFirst ? 'w-18 h-18 sm:w-24 sm:h-24' : 'w-14 h-14 sm:w-20 sm:h-20'} mb-3 shrink-0 z-20`}>
            <div className={`w-full h-full rounded-full border-2 ring-2 overflow-hidden flex items-center justify-center font-bold text-lg sm:text-xl ${avatarBg}`}>
              {ranker.avatar ? (
                <img src={ranker.avatar} alt={ranker.name} className="w-full h-full object-cover" />
              ) : (
                <span className={isBlue ? 'text-[#1B3A7A]' : 'text-blue-200'}>{getInitials(ranker.name)}</span>
              )}
            </div>
            {/* Rank badge */}
            <div className={`absolute -bottom-1.5 -right-1.5 w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-black text-white text-sm sm:text-base shadow-md ${
              isFirst ? 'bg-gradient-to-br from-yellow-400 to-amber-600' 
              : isSecond ? 'bg-gradient-to-br from-gray-300 to-gray-500' 
              : 'bg-gradient-to-br from-amber-500 to-amber-700'
            }`} style={{ border: isBlue ? '3px solid white' : '3px solid #121e40' }}>
              {rank}
            </div>
          </div>
          
          {/* Info */}
          <div className="text-center mb-4 px-1 min-h-[70px] flex flex-col items-center justify-end z-20">
            <h3 className={`text-[14px] sm:text-[16px] leading-[1.2] whitespace-normal break-words max-w-[110px] sm:max-w-[130px] ${nameColor}`}>{ranker.name}</h3>
            <p className={`text-[11px] font-mono font-semibold mt-0.5 ${idColor}`}>Mã: {ranker.id}</p>
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: rank * 0.15 + 0.5 }}
              className={`mt-2 px-4 py-1.5 rounded-full shadow-sm ${
                isBlue ? 'bg-white border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)]' : 'bg-white/[0.08] border border-white/[0.1]'
              }`}
            >
              <p className={`font-black tracking-wide ${scoreColor} text-[15px] sm:text-lg`}>{ranker.score.toLocaleString()}</p>
            </motion.div>
            {ranker.score2 !== undefined && ranker.score2 > 0 && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: rank * 0.15 + 0.6 }}
                className={`mt-1.5 px-3 py-1 rounded-full text-center ${
                  isBlue ? 'bg-emerald-50 border border-emerald-200' : 'bg-emerald-900/20 border border-emerald-500/20'
                }`}
              >
                <p className={`font-bold text-[12px] sm:text-sm ${isBlue ? 'text-emerald-700' : 'text-emerald-400'}`}>{ranker.score2.toLocaleString()}</p>
              </motion.div>
            )}
          </div>
          
          {/* Podium pillar */}
          <div className={`w-full rounded-t-2xl ${rankColor} ${heightClass} flex justify-center items-start pt-3 relative overflow-hidden shadow-[0_-2px_15px_rgba(0,0,0,0.1)]`}>
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
            <div className="absolute top-0 left-[-100%] w-[100%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] animate-[shimmer_3s_infinite]" />
            <span className="font-heading font-black text-white/30 text-4xl sm:text-6xl relative z-10">{rank}</span>
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
