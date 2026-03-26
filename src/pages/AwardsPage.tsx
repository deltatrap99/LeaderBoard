import { useState } from 'react';
import { Layout } from '../components/Layout';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { useAwards, type Award } from '../hooks/useAwards';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Award as AwardIcon, Gift, ChevronDown, ChevronUp } from 'lucide-react';

type PeriodFilter = 'all' | 'month' | 'quarter' | 'semester';

function AwardCard({ award, index, theme }: { award: Award; index: number; theme: string }) {
  const [expanded, setExpanded] = useState(true);
  const isBlue = theme === 'blue';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
      className={`rounded-3xl overflow-hidden mb-6 transition-all duration-500 ${
        isBlue
          ? 'bg-white shadow-[0_4px_25px_rgba(0,0,0,0.08)] border border-slate-200/80'
          : 'bg-white/[0.04] shadow-[0_8px_40px_rgba(0,0,0,0.4)] border border-white/[0.08]'
      }`}
    >
      {/* Card Header — Red/Gold Galaxy gradient */}
      <div
        className="relative px-6 py-5 cursor-pointer overflow-hidden"
        onClick={() => setExpanded(!expanded)}
        style={{
          background: 'linear-gradient(135deg, #8B1A1A 0%, #C62828 30%, #B71C1C 60%, #8B1A1A 100%)',
        }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-400/20 to-transparent rounded-full -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-amber-400/10 to-transparent rounded-full translate-y-6 -translate-x-6" />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl shadow-lg shadow-amber-600/30">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-heading font-extrabold text-white uppercase tracking-wide">
                {award.title}
              </h2>
              <p className="text-amber-300/80 text-xs font-semibold mt-0.5">{award.period}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 bg-amber-400/20 rounded-full text-amber-300 border border-amber-400/30">
              <Gift size={12} />
              {award.tiers.length} mức giải
            </span>
            {expanded ? (
              <ChevronUp size={20} className="text-white/60" />
            ) : (
              <ChevronDown size={20} className="text-white/60" />
            )}
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {/* Mechanism */}
            <div className={`px-6 py-5 ${isBlue ? 'bg-amber-50/50' : 'bg-amber-950/20'}`}>
              <h3 className={`text-sm font-bold mb-2.5 flex items-center gap-2 ${
                isBlue ? 'text-red-800' : 'text-amber-400'
              }`}>
                <AwardIcon size={14} />
                1. Cơ chế thưởng
              </h3>
              <div className={`text-sm leading-relaxed whitespace-pre-line ${
                isBlue ? 'text-slate-600' : 'text-white/60'
              }`}>
                {award.mechanism.split('\n').map((line, i) => (
                  <p key={i} className={line.startsWith('*') || line.startsWith('-') ? 'ml-2 mt-1' : 'mt-1'}>
                    {line}
                  </p>
                ))}
              </div>
            </div>

            {/* Criteria Table */}
            <div className={`px-6 py-5 ${isBlue ? 'bg-white' : ''}`}>
              <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${
                isBlue ? 'text-red-800' : 'text-amber-400'
              }`}>
                <Star size={14} />
                2. Chỉ tiêu xét thưởng và Giá trị giải thưởng
              </h3>

              <div className={`rounded-2xl overflow-hidden border ${
                isBlue ? 'border-red-200/60' : 'border-amber-500/20'
              }`}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{
                      background: isBlue
                        ? 'linear-gradient(135deg, #8B1A1A, #C62828)'
                        : 'linear-gradient(135deg, #451a03, #78350f)',
                    }}>
                      {award.columns.map((col, i) => (
                        <th
                          key={i}
                          className="px-4 py-3.5 text-center text-[11px] font-bold text-white uppercase tracking-wider"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {award.tiers.map((tier, i) => (
                      <tr
                        key={i}
                        className={`transition-colors ${
                          isBlue
                            ? `${i % 2 === 0 ? 'bg-white' : 'bg-red-50/30'} hover:bg-red-50/60 border-t border-red-100`
                            : `${i % 2 === 0 ? 'bg-white/[0.02]' : 'bg-white/[0.04]'} hover:bg-white/[0.06] border-t border-white/[0.06]`
                        }`}
                      >
                      {/* Render columns generically based on column definition */}
                        {(() => {
                          // Build cell values in column order from tier data
                          const cells: string[] = [];
                          const colCount = award.columns.length;
                          
                          if (colCount === 3) {
                            // 3 cols: condition | quantity | prizeValue
                            cells.push(tier.condition, tier.quantity, tier.prizeValue);
                          } else if (colCount === 4) {
                            // 4 cols: label | condition | condition2 OR quantity | prizeValue
                            cells.push(tier.label, tier.condition, tier.condition2 || tier.quantity, tier.prizeValue);
                          } else {
                            // 5+ cols: map directly to columns from tier fields
                            cells.push(tier.label);
                            cells.push(tier.condition);
                            if (tier.condition2 !== undefined) cells.push(tier.condition2);
                            cells.push(tier.prizeValue);
                            if (tier.extraCondition !== undefined) cells.push(tier.extraCondition || '—');
                          }

                          return cells.map((val, ci) => {
                            const isPrize = val === tier.prizeValue;
                            const isLabel = ci === 0 && colCount > 3;
                            const isEGC = isLabel && tier.label.includes('EGC');

                            return (
                              <td key={ci} className={`px-4 py-3.5 text-center ${
                                isPrize
                                  ? 'font-black text-red-700 text-base'
                                  : isEGC
                                    ? 'font-bold text-amber-600'
                                    : isLabel
                                      ? `font-bold ${isBlue ? 'text-slate-700' : 'text-white/70'}`
                                      : `font-semibold ${isBlue ? 'text-slate-600' : 'text-white/60'}`
                              }`}>
                                {isEGC ? (
                                  <span className="flex items-center justify-center gap-1">
                                    <Star size={12} className="fill-amber-500 text-amber-500" />
                                    {val.replace('⭐ ', '')}
                                  </span>
                                ) : val}
                              </td>
                            );
                          });
                        })()}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footnote */}
            {award.footnote && (
              <div className={`px-6 py-3 border-t text-xs italic leading-relaxed ${
                isBlue
                  ? 'border-slate-100 text-slate-400 bg-slate-50/30'
                  : 'border-white/[0.04] text-white/30 bg-white/[0.01]'
              }`}>
                {award.footnote}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function AwardsPage() {
  const { settings } = useSiteSettings();
  const { awards, loaded } = useAwards();
  const [theme, setTheme] = useState<'blue' | 'dark'>(settings.defaultTheme || 'blue');
  const [filter, setFilter] = useState<PeriodFilter>('all');

  const isBlue = theme === 'blue';

  const filteredAwards = filter === 'all' ? awards : awards.filter(a => a.category === filter);

  const filterButtons: { key: PeriodFilter; label: string; icon: string }[] = [
    { key: 'all', label: 'Tất cả', icon: '🏆' },
    { key: 'month', label: 'Tháng', icon: '📅' },
    { key: 'quarter', label: 'Quý', icon: '⭐' },
    { key: 'semester', label: 'Kỳ', icon: '🎓' },
  ];

  const heroContent = (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center mb-5"
      >
        <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium">
          <Gift size={14} className="text-amber-400" />
          Chi tiết Giải thưởng
        </span>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-2xl sm:text-4xl lg:text-5xl font-heading font-black text-white mb-3 tracking-[-0.01em] text-center leading-tight uppercase"
      >
        Cơ cấu giải thưởng
        <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-400">
          Galaxy Elite Awards
        </span>
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="text-xs sm:text-sm text-white/70 max-w-2xl mx-auto text-center font-medium leading-relaxed mb-7"
      >
        Tìm hiểu chi tiết điều kiện, số lượng giải và giá trị giải thưởng cho từng hạng mục thi đua.
      </motion.p>

      {/* Period Filter */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="flex space-x-1.5 bg-white/10 backdrop-blur-xl p-1.5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] border border-white/15 overflow-x-auto no-scrollbar w-full max-w-lg mx-auto">
          {filterButtons.map((btn) => {
            const isActive = filter === btn.key;
            return (
              <button
                key={btn.key}
                onClick={() => setFilter(btn.key)}
                className={`relative px-4 py-3 text-sm sm:text-base font-bold transition-all duration-300 whitespace-nowrap rounded-xl flex-1 outline-none ${
                  isActive ? 'text-[#1B3A7A]' : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="awardFilterIndicator"
                    className="absolute inset-0 bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                    initial={false}
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center gap-1.5">
                  <span className="text-sm hidden sm:inline">{btn.icon}</span>
                  {btn.label}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </>
  );

  const bodyContent = !loaded ? (
    <div className="flex justify-center flex-col items-center py-20 gap-6">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-600" />
      <p className={`font-medium text-sm ${isBlue ? 'text-slate-400' : 'text-white/50'}`}>
        Đang tải thông tin giải thưởng...
      </p>
    </div>
  ) : (
    <AnimatePresence mode="wait">
      <motion.div
        key={filter}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        className="w-full flex flex-col gap-6"
      >
        {filteredAwards.map((award, index) => (
          <AwardCard key={award.id || index} award={award} index={index} theme={theme} />
        ))}

        {filteredAwards.length === 0 && (
          <div className={`text-center py-20 rounded-3xl border ${
            isBlue
              ? 'bg-white border-slate-200 text-slate-400 shadow-sm'
              : 'bg-white/[0.03] border-white/[0.06] text-white/30'
          }`}>
            <p className="text-lg font-medium">Chưa có thông tin giải thưởng cho bộ lọc này.</p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );

  return (
    <Layout
      theme={theme}
      onToggleTheme={() => setTheme(t => (t === 'blue' ? 'dark' : 'blue'))}
      heroContent={heroContent}
      bodyContent={bodyContent}
      footerText={settings.footerText}
      footerLinks={settings.footerLinks}
      headerTagline={settings.headerTagline}
      headerCtaText={settings.headerCtaText}
      headerCtaUrl={settings.headerCtaUrl}
    />
  );
}
