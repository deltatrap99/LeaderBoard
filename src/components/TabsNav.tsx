import { motion } from 'framer-motion';

export type TabType = 'month' | 'quarter' | 'semester' | 'challenge';

interface TabsNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  theme?: string;
}

const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: 'month', label: 'Tháng', icon: '📅' },
  { id: 'quarter', label: 'Quý', icon: '🏆' },
  { id: 'semester', label: 'Kỳ', icon: '⭐' },
  { id: 'challenge', label: 'Challenge', icon: '🔥' },
];

export function TabsNav({ activeTab, onTabChange }: TabsNavProps) {
  return (
    <div className="flex space-x-1.5 bg-white/10 backdrop-blur-xl p-1.5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] border border-white/15 overflow-x-auto no-scrollbar w-full max-w-2xl mx-auto">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative px-4 py-3 text-sm sm:text-base font-bold transition-all duration-300 whitespace-nowrap rounded-xl flex-1 outline-none ${
              isActive ? 'text-[#1B3A7A]' : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute inset-0 bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                initial={false}
                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-1.5">
              <span className="text-sm hidden sm:inline">{tab.icon}</span>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
