import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { TabsNav } from '../components/TabsNav';
import { LeaderboardCard } from '../components/LeaderboardCard';
import { fetchLeaderboardData } from '../data/liveData';
import type { LeaderboardData } from '../data/liveData';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Users, Trophy, TrendingUp, Info, CheckCircle, AlertTriangle } from 'lucide-react';

export type TabType = 'month' | 'quarter' | 'semester' | 'challenge';

export function LeaderboardPage() {
  const { settings } = useSiteSettings();
  const [activeTab, setActiveTab] = useState<TabType>(settings.defaultTab || 'month');
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'blue' | 'dark'>(settings.defaultTheme || 'blue');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Sync default tab/theme khi settings thay đổi
  useEffect(() => {
    if (settings.defaultTab) setActiveTab(settings.defaultTab);
  }, [settings.defaultTab]);

  useEffect(() => {
    if (settings.defaultTheme) setTheme(settings.defaultTheme);
  }, [settings.defaultTheme]);

  // Update page title
  useEffect(() => {
    document.title = settings.pageTitle || 'Bảng thi đua Galaxy Elite Awards 2026';
  }, [settings.pageTitle]);

  // Fetch lần đầu + auto-refresh
  useEffect(() => {
    const doFetch = () => {
      fetchLeaderboardData(settings.sheetUrl).then(d => {
        setData(d);
        setLastUpdated(new Date());
        setLoading(false);
      }).catch(e => {
        console.error(e);
        setLoading(false);
      });
    };

    doFetch();
    const interval = setInterval(doFetch, (settings.refreshInterval || 30) * 1000);
    return () => clearInterval(interval);
  }, [settings.sheetUrl, settings.refreshInterval]);

  const currentData = data ? data[activeTab] : [];
  const isBlue = theme === 'blue';
  const totalAmbassadors = currentData.reduce((acc, cat) => acc + cat.topRankers.length + cat.otherRankers.length, 0);

  // Announcement bar icon
  const announcementIcons = {
    info: <Info size={14} />,
    success: <CheckCircle size={14} />,
    warning: <AlertTriangle size={14} />,
  };
  const announcementColors = {
    info: 'bg-blue-500/20 border-blue-500/30 text-blue-200',
    success: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200',
    warning: 'bg-amber-500/20 border-amber-500/30 text-amber-200',
  };

  const heroContent = (
    <>
      {/* Announcement Bar */}
      {settings.announcementEnabled && settings.announcementText && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl border text-sm mb-4 ${announcementColors[settings.announcementType || 'info']}`}
        >
          {announcementIcons[settings.announcementType || 'info']}
          {settings.announcementText}
        </motion.div>
      )}

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center mb-5"
      >
        <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium">
          <Star size={14} className="text-amber-400" fill="currentColor" />
          {settings.badgeText}
        </span>
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-2xl sm:text-4xl lg:text-5xl font-heading font-black text-white mb-3 tracking-[-0.01em] text-center leading-tight uppercase"
      >
        {settings.heroTitle}
        <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-400">
          {settings.heroTitleHighlight}
        </span>
      </motion.h2>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="text-xs sm:text-sm text-white/70 max-w-2xl mx-auto text-center font-medium leading-relaxed mb-7"
      >
        {settings.heroSubtitle}
      </motion.p>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex justify-center gap-8 sm:gap-14 mb-8"
      >
        {[
          { icon: <Users size={18} />, value: `${totalAmbassadors}+`, label: settings.statsLabels?.ambassadors || 'Đại sứ' },
          { icon: <Trophy size={18} />, value: currentData.length.toString(), label: settings.statsLabels?.categories || 'Hạng mục' },
          { icon: <TrendingUp size={18} />, value: 'Live', label: settings.statsLabels?.update || 'Cập nhật' },
        ].map((stat, i) => (
          <div key={i} className="text-center text-white">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-amber-400">{stat.icon}</span>
              <span className="text-xl sm:text-2xl font-heading font-black">{stat.value}</span>
            </div>
            <span className="text-[11px] sm:text-xs text-white/50 font-medium">{stat.label}</span>
          </div>
        ))}
      </motion.div>

      {/* Tabs */}
      <TabsNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        theme={theme}
        tabLabels={settings.tabLabels}
        tabVisibility={settings.tabVisibility}
      />
    </>
  );

  const bodyContent = loading ? (
    <div className="flex justify-center flex-col items-center py-20 gap-6">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-600" />
      <p className={`font-medium text-sm ${isBlue ? 'text-slate-400' : 'text-white/50'}`}>Đang đồng bộ dữ liệu vinh danh...</p>
    </div>
  ) : (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="w-full flex flex-col gap-6"
      >
        {/* Disclaimer note */}
        <div className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium ${
          isBlue
            ? 'bg-amber-50 border-amber-200 text-amber-700'
            : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
        }`}>
          <Info size={14} className="shrink-0" />
          <span>Bảng xếp hạng hiển thị theo dữ liệu realtime tại thời điểm truy cập, thứ hạng có thể thay đổi liên tục!</span>
        </div>

        {currentData.map((category, index) => (
          <LeaderboardCard key={category.categoryId} data={category} index={index} theme={theme} lastUpdated={lastUpdated} />
        ))}

        {currentData.length === 0 && (
          <div className={`text-center py-20 rounded-3xl border ${
            isBlue
              ? 'bg-white border-slate-200 text-slate-400 shadow-sm'
              : 'bg-white/[0.03] border-white/[0.06] text-white/30'
          }`}>
            <p className="text-lg font-medium">Chưa có dữ liệu cho bảng thi đua này.</p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );

  return (
    <Layout
      theme={theme}
      onToggleTheme={() => setTheme(t => t === 'blue' ? 'dark' : 'blue')}
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
