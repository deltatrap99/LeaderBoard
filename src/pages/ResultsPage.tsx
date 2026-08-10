import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { fetchResultsData, type ResultsData, type ResultSection } from '../data/resultsData';
import { q2ResultsData } from '../data/q2Results';
import { t06ResultsData } from '../data/t06Results';
import { t07ResultsData } from '../data/t07Results';
import { t05ResultsData } from '../data/t05Results';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Star, Crown, ChevronDown, ChevronUp, Award, Sparkles, Users, TrendingUp, Target } from 'lucide-react';

function getSectionIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes('top 3') || t.includes('giáo dục xuất sắc')) return <Crown className="w-5 h-5 text-amber-400" />;
  if (t.includes('vàng') || t.includes('egc')) return <Star className="w-5 h-5 text-yellow-400" />;
  if (t.includes('tuyển dụng')) return <Users className="w-5 h-5 text-blue-400" />;
  if (t.includes('thăng cấp')) return <TrendingUp className="w-5 h-5 text-emerald-400" />;
  if (t.includes('bứt tốc')) return <Sparkles className="w-5 h-5 text-orange-400" />;
  if (t.includes('tiêu biểu')) return <Award className="w-5 h-5 text-purple-400" />;
  if (t.includes('thử thách') || t.includes('challenge')) return <Target className="w-5 h-5 text-red-400" />;
  return <Medal className="w-5 h-5 text-amber-400" />;
}

function getSectionGradient(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('top 3') || t.includes('giáo dục xuất sắc')) return 'from-amber-600 via-yellow-600 to-amber-700';
  if (t.includes('vàng') || t.includes('egc')) return 'from-yellow-600 via-amber-600 to-orange-600';
  if (t.includes('tuyển dụng')) return 'from-blue-700 via-blue-600 to-indigo-700';
  if (t.includes('thăng cấp')) return 'from-emerald-700 via-emerald-600 to-teal-700';
  if (t.includes('bứt tốc')) return 'from-orange-700 via-orange-600 to-red-700';
  if (t.includes('tiêu biểu')) return 'from-purple-700 via-purple-600 to-indigo-700';
  if (t.includes('thử thách') || t.includes('challenge')) return 'from-red-700 via-rose-600 to-pink-700';
  return 'from-slate-700 via-slate-600 to-slate-700';
}

function isMoneyColumn(colName: string): boolean {
  const c = colName.toLowerCase();
  return c.includes('doanh số') || c.includes('doanh thu') || c.includes('thưởng') || c.includes('team dsc') || c.includes('l5');
}

function shouldShowRanking(title: string): boolean {
  const t = title.toLowerCase();
  // Chỉ Top 3 Đại sứ Xuất sắc mới cần đánh số
  return t.includes('top 3') || t.includes('giáo dục xuất sắc');
}

function ResultSectionCard({ section, index, theme }: { section: ResultSection; index: number; theme: string }) {
  const [expanded, setExpanded] = useState(true);
  const isBlue = theme === 'blue';
  const gradient = getSectionGradient(section.title);
  const icon = getSectionIcon(section.title);
  const showRanking = shouldShowRanking(section.title);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: 'easeOut' }}
      className={`rounded-3xl overflow-hidden mb-6 transition-all duration-500 ${
        isBlue
          ? 'bg-white shadow-[0_4px_25px_rgba(0,0,0,0.08)] border border-slate-200/80'
          : 'bg-white/[0.04] shadow-[0_8px_40px_rgba(0,0,0,0.4)] border border-white/[0.08]'
      }`}
    >
      {/* Section Header */}
      <div
        className={`relative px-4 sm:px-6 py-4 sm:py-5 cursor-pointer overflow-hidden bg-gradient-to-r ${gradient}`}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Decorative */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-8 -translate-x-8" />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-sm">
              {icon}
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-heading font-extrabold text-white uppercase tracking-wide leading-tight">
                {section.title}
              </h2>
              {!section.isEmpty && (
                <p className="text-white/60 text-xs font-medium mt-0.5">
                  {section.entries.length} Đại sứ
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!section.isEmpty && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 bg-white/15 rounded-full text-white/80 border border-white/20">
                <Trophy size={12} />
                Kết quả chính thức
              </span>
            )}
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
            {section.isEmpty ? (
              <div className={`px-6 py-10 text-center ${isBlue ? 'bg-slate-50' : 'bg-white/[0.02]'}`}>
                <p className={`text-sm font-medium ${isBlue ? 'text-slate-400' : 'text-white/40'}`}>
                  {section.emptyMessage || 'Chưa có Đại sứ đạt'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className={isBlue ? 'bg-slate-50' : 'bg-white/[0.03]'}>
                      {showRanking && (
                        <th className={`px-3 sm:px-4 py-3 text-center text-[10px] sm:text-[11px] font-bold uppercase tracking-wider whitespace-nowrap w-12 ${
                          isBlue ? 'text-slate-500 border-b border-slate-200' : 'text-white/40 border-b border-white/[0.06]'
                        }`}>
                          #
                        </th>
                      )}
                      {section.columns.map((col, ci) => (
                        <th
                          key={ci}
                          className={`px-3 sm:px-4 py-3 text-center text-[10px] sm:text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${
                            isBlue ? 'text-slate-500 border-b border-slate-200' : 'text-white/40 border-b border-white/[0.06]'
                          }`}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.entries.map((entry, ei) => {
                      const isTopThree = ei < 3;
                      return (
                        <tr
                          key={ei}
                          className={`transition-colors ${
                            isBlue
                              ? `${ei % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-blue-50/50 border-t border-slate-100`
                              : `${ei % 2 === 0 ? 'bg-white/[0.01]' : 'bg-white/[0.03]'} hover:bg-white/[0.05] border-t border-white/[0.04]`
                          }`}
                        >
                          {showRanking && (
                            <td className={`px-3 sm:px-4 py-3 text-center font-bold text-xs ${
                              isTopThree 
                                ? 'text-amber-500'
                                : isBlue ? 'text-slate-400' : 'text-white/30'
                            }`}>
                              {isTopThree ? (
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-[10px] font-black ${
                                  ei === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                                  ei === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-500' :
                                  'bg-gradient-to-br from-orange-400 to-orange-600'
                                }`}>
                                  {ei + 1}
                                </span>
                              ) : (
                                ei + 1
                              )}
                            </td>
                          )}
                          {entry.cells.slice(0, section.columns.length).map((cell, ci) => {
                            const isMoney = isMoneyColumn(section.columns[ci] || '');
                            const isName = section.columns[ci]?.toLowerCase().includes('tên') || section.columns[ci]?.toLowerCase().includes('họ và') || section.columns[ci]?.toLowerCase().includes('quản lý');
                            const isPrize = section.columns[ci]?.toLowerCase().includes('thưởng');
                            return (
                              <td
                                key={ci}
                                className={`px-3 sm:px-4 py-3 text-center whitespace-nowrap ${
                                  isPrize
                                    ? 'font-black text-emerald-600 text-sm'
                                    : isName
                                      ? `font-semibold text-left ${isBlue ? 'text-slate-800' : 'text-white/90'}`
                                      : isMoney
                                        ? `font-bold ${isBlue ? 'text-blue-700' : 'text-blue-300'}`
                                        : `font-medium ${isBlue ? 'text-slate-600' : 'text-white/60'}`
                                }`}
                              >
                                {cell || ''}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

type ResultPeriod = 'q2' | 't07' | 't06' | 't05' | 'q1' | 't04';

const RESULT_PERIODS: { key: ResultPeriod; label: string; icon: string }[] = [
  { key: 't07', label: 'Tháng 7', icon: '📅' },
  { key: 'q2', label: 'Quý II', icon: '🏆' },
  { key: 't06', label: 'Tháng 6', icon: '🌟' },
  { key: 't05', label: 'Tháng 5', icon: '🔥' },
  { key: 'q1', label: 'Quý I', icon: '⭐' },
  { key: 't04', label: 'Tháng 4', icon: '📅' },
];

const PERIOD_HERO: Record<ResultPeriod, { title: string; subtitle: string; description: string }> = {
  q2: {
    title: 'Quý II / 2026',
    subtitle: 'Kết quả chính thức',
    description: 'Danh sách các Đại sứ và Quản lý xuất sắc đạt giải chính thức trong chương trình Thi đua Quý II/2026',
  },
  t07: {
    title: 'Tháng 07 / 2026',
    subtitle: 'Kết quả chính thức',
    description: 'Danh sách các Đại sứ và Quản lý xuất sắc đạt giải chính thức trong chương trình Thi đua Tháng 07/2026',
  },
  t06: {
    title: 'Tháng 06 / 2026',
    subtitle: 'Kết quả chính thức',
    description: 'Danh sách các Đại sứ và Quản lý xuất sắc đạt giải Thưởng thi đua Tháng 06/2026',
  },
  t05: {
    title: 'Tháng 05 / 2026',
    subtitle: 'Kết quả chính thức',
    description: 'Danh sách các Đại sứ đạt giải Thưởng bứt phá vượt giới hạn Tháng 5/2026',
  },
  q1: {
    title: 'Quý I / 2026',
    subtitle: 'Kết quả chính thức',
    description: 'Danh sách các Đại sứ đạt giải chính thức trong chương trình Galaxy Elite Awards Quý I/2026',
  },
  t04: {
    title: 'Tháng 04 / 2026',
    subtitle: 'Đang đối soát',
    description: 'Kết quả thi đua Tháng 04/2026 đang trong quá trình đối soát và sẽ được công bố sớm nhất.',
  },
};

const STATIC_DATA_MAP: Record<string, ResultsData> = {
  q2: q2ResultsData,
  t07: t07ResultsData,
  t06: t06ResultsData,
  t05: t05ResultsData,
};

export function ResultsPage() {
  const { settings } = useSiteSettings();
  const [theme, setTheme] = useState<'blue' | 'dark'>(settings.defaultTheme || 'blue');
  const [activePeriod, setActivePeriod] = useState<ResultPeriod>('q2');
  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBlue = theme === 'blue';
  const hero = PERIOD_HERO[activePeriod];
  const displayData = STATIC_DATA_MAP[activePeriod] || data;

  useEffect(() => {
    if (!STATIC_DATA_MAP[activePeriod]) {
      setLoading(true);
      fetchResultsData(activePeriod)
        .then(d => { setData(d); setLoading(false); })
        .catch(e => { setError(String(e)); setLoading(false); });
    }
  }, [activePeriod]);

  const heroContent = (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center mb-5"
      >
        <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium">
          <Trophy size={14} className="text-amber-400" />
          {hero.subtitle}
        </span>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-2xl sm:text-4xl lg:text-5xl font-heading font-black text-white mb-3 tracking-[-0.01em] text-center leading-tight uppercase"
      >
        Kết quả Thi đua
        <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-400">
          {hero.title}
        </span>
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="text-xs sm:text-sm text-white/70 max-w-2xl mx-auto text-center font-medium leading-relaxed mb-7"
      >
        {hero.description}
      </motion.p>

      {/* Period Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="flex space-x-1.5 bg-white/10 backdrop-blur-xl p-1.5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] border border-white/15 overflow-x-auto no-scrollbar w-full max-w-sm mx-auto">
          {RESULT_PERIODS.map((btn) => {
            const isActive = activePeriod === btn.key;
            return (
              <button
                key={btn.key}
                onClick={() => setActivePeriod(btn.key)}
                className={`relative px-4 py-3 text-sm sm:text-base font-bold transition-all duration-300 whitespace-nowrap rounded-xl flex-1 outline-none ${
                  isActive ? 'text-[#1B3A7A]' : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="resultPeriodIndicator"
                    className="absolute inset-0 bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                    initial={false}
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center gap-1.5">
                  <span className="text-sm">{btn.icon}</span>
                  {btn.label}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </>
  );

  const bodyContent = activePeriod === 't04' ? (
    /* Tháng 4 — chưa có kết quả */
    <AnimatePresence mode="wait">
      <motion.div
        key="t04-placeholder"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        className="w-full"
      >
        <div className={`rounded-3xl border text-center py-16 sm:py-24 px-6 ${
          isBlue
            ? 'bg-white border-slate-200 shadow-[0_4px_25px_rgba(0,0,0,0.06)]'
            : 'bg-white/[0.03] border-white/[0.06]'
        }`}>
          <div className="max-w-md mx-auto flex flex-col items-center gap-5">
            <div className={`p-4 rounded-2xl ${
              isBlue ? 'bg-amber-50' : 'bg-amber-950/30'
            }`}>
              <Trophy className={`w-10 h-10 ${isBlue ? 'text-amber-500' : 'text-amber-400'}`} />
            </div>
            <div>
              <h3 className={`text-lg sm:text-xl font-heading font-bold mb-2 ${
                isBlue ? 'text-slate-800' : 'text-white/90'
              }`}>
                Kết quả đang được đối soát
              </h3>
              <p className={`text-sm leading-relaxed ${
                isBlue ? 'text-slate-500' : 'text-white/50'
              }`}>
                Kết quả thi đua Tháng 04/2026 sẽ được công bố sau khi hoàn thành đối soát.
                <br />
                Vui lòng quay lại sau để xem kết quả chính thức.
              </p>
            </div>
            <div className={`mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold ${
              isBlue
                ? 'bg-blue-50 text-blue-600 border border-blue-200/60'
                : 'bg-blue-950/30 text-blue-300 border border-blue-500/20'
            }`}>
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Đang xử lý
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  ) : (activePeriod !== 't05' && loading) ? (
    <div className="flex justify-center flex-col items-center py-20 gap-6">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-600" />
      <p className={`font-medium text-sm ${isBlue ? 'text-slate-400' : 'text-white/50'}`}>
        Đang tải kết quả thi đua...
      </p>
    </div>
  ) : error ? (
    <div className="text-center py-20">
      <p className="text-red-500 font-medium">Lỗi: {error}</p>
    </div>
  ) : displayData ? (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${activePeriod}-results`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        className="w-full flex flex-col gap-6"
      >
        {/* Summary banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl px-5 py-4 flex items-center gap-3 ${
            isBlue 
              ? 'bg-amber-50 border border-amber-200/60 text-amber-800' 
              : 'bg-amber-950/30 border border-amber-500/20 text-amber-300'
          }`}
        >
          <Medal className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">
            <span className="font-bold">{displayData.sections.length} hạng mục</span> giải thưởng đã được công bố chính thức.
            Xin chúc mừng tất cả các Đại sứ đạt giải!
          </p>
        </motion.div>

        {displayData.sections.map((section, index) => (
          <ResultSectionCard key={section.id} section={section} index={index} theme={theme} />
        ))}
      </motion.div>
    </AnimatePresence>
  ) : null;

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
