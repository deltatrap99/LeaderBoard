import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { TabsNav } from './components/TabsNav';
import { LeaderboardCard } from './components/LeaderboardCard';
import { fetchLeaderboardData } from './data/liveData';
import type { LeaderboardData } from './data/liveData';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Users, Trophy, TrendingUp } from 'lucide-react';

export type TabType = 'month' | 'quarter' | 'semester' | 'challenge';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('month');
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'blue' | 'dark'>('blue');

  // Fetch lần đầu + auto-refresh mỗi 30 giây
  useEffect(() => {
    const doFetch = () => {
      fetchLeaderboardData().then(d => {
        setData(d);
        setLoading(false);
      }).catch(e => {
        console.error(e);
        setLoading(false);
      });
    };
    
    doFetch(); // Lần đầu
    const interval = setInterval(doFetch, 30_000); // Mỗi 30s
    return () => clearInterval(interval);
  }, []);

  const currentData = data ? data[activeTab] : [];
  const isBlue = theme === 'blue';
  const totalAmbassadors = currentData.reduce((acc, cat) => acc + cat.topRankers.length + cat.otherRankers.length, 0);

  const heroContent = (
    <>
      {/* Badge */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center mb-5"
      >
        <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium">
          <Star size={14} className="text-amber-400" fill="currentColor" />
          Galaxy Elite Awards 2026
        </span>
      </motion.div>

      {/* Title */}
      <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-2xl sm:text-4xl lg:text-5xl font-heading font-black text-white mb-3 tracking-[-0.01em] text-center leading-tight uppercase"
      >
        Đại sứ Giáo dục{' '}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-400">
          Galaxy Education
        </span>
      </motion.h2>

      {/* Subtitle */}
      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="text-xs sm:text-sm text-white/70 max-w-2xl mx-auto text-center font-medium leading-relaxed mb-7"
      >
        "Đây không chỉ là những cái tên dẫn đầu thành tích, đây là những tấm gương truyền cảm hứng sự nỗ lực không ngừng trên hành trình lan tỏa những giải pháp giáo dục chất lượng cao đến{' '}
        <strong className="text-amber-400">Phụ huynh</strong> và <strong className="text-amber-400">Học sinh</strong> trên mọi miền đất nước."
      </motion.p>

      {/* Stats row */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex justify-center gap-8 sm:gap-14 mb-8"
      >
        {[
          { icon: <Users size={18} />, value: `${totalAmbassadors}+`, label: 'Đại sứ' },
          { icon: <Trophy size={18} />, value: currentData.length.toString(), label: 'Hạng mục' },
          { icon: <TrendingUp size={18} />, value: 'Live', label: 'Cập nhật' },
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
      <TabsNav activeTab={activeTab} onTabChange={setActiveTab} theme={theme} />
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
        {currentData.map((category, index) => (
          <LeaderboardCard key={category.categoryId} data={category} index={index} theme={theme} />
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
    />
  );
}

export default App;
