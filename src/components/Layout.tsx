import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import logo from '../assets/ge-logo.png';
import { Moon, Sun, Sparkles, Award, BarChart3, Gift, FileText, Medal, X, CalendarClock, PartyPopper, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutProps {
  heroContent: React.ReactNode;
  bodyContent: React.ReactNode;
  theme?: 'blue' | 'dark';
  onToggleTheme?: () => void;
  footerText?: string;
  footerLinks?: { label: string; url: string }[];
  headerTagline?: string;
  headerCtaText?: string;
  headerCtaUrl?: string;
}

export function Layout({ heroContent, bodyContent, theme = 'blue', onToggleTheme, footerText, footerLinks, headerTagline, headerCtaText, headerCtaUrl }: LayoutProps) {
  const isBlue = theme === 'blue';
  const location = useLocation();
  const currentPath = location.pathname;
  const [showResultsPopup, setShowResultsPopup] = useState(false);

  const pageNav = [
    { path: '/', label: 'Bảng xếp hạng', icon: <BarChart3 size={14} /> },
    { path: '/awards', label: 'Chi tiết Giải thưởng', icon: <Gift size={14} /> },
    { path: '/policies', label: 'Chính sách & Quy định', icon: <FileText size={14} /> },
  ];

  return (
    <div className={`min-h-screen font-body selection:bg-yellow-500/30 transition-all duration-700 overflow-x-hidden`}
      style={{ background: isBlue ? '#f0f4f8' : '#0a0f1e', color: isBlue ? '#1e293b' : '#dbe1ff' }}
    >
      {/* Header — Galaxy Blue luôn */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-[#1B3A7A] via-[#1a4fa0] to-[#1B3A7A] shadow-[0_4px_20px_rgba(27,58,122,0.3)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-3">
              <img src={logo} alt="Galaxy Education" className="h-7 sm:h-10 w-auto object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
            </a>
            <div className="h-6 w-px bg-white/25 mx-1 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2">
              <Award size={16} className="text-amber-400" />
              <h1 className="text-sm font-heading font-bold text-amber-400 tracking-widest uppercase">
                {headerTagline || 'Elite Awards'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="group flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/25 bg-white/10 hover:bg-white/20 transition-all duration-300 text-xs font-medium text-white shrink-0"
              >
                {isBlue
                  ? <Moon size={14} className="text-blue-200 group-hover:text-white transition-colors"/>
                  : <Sun size={14} className="text-amber-400 group-hover:rotate-90 transition-all duration-500"/>
                }
                <span className="hidden sm:inline">{isBlue ? 'Chế độ tối' : 'Galaxy Blue'}</span>
              </button>
            )}
            <a href={headerCtaUrl || '#'} className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-[0_4px_15px_rgba(245,158,11,0.4)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.6)] hover:scale-105 transition-all duration-300">
              <Sparkles size={12} />
              {headerCtaText || 'Bảng Vàng Tôn Vinh'}
            </a>
          </div>
        </div>

        {/* Page Navigation */}
        <div className="bg-[#132e63]/80 border-t border-white/[0.08]">
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 flex gap-0.5 sm:gap-1 overflow-x-auto no-scrollbar">
            {pageNav.map(nav => {
              const isActive = currentPath === nav.path;
              return (
                <a
                  key={nav.path}
                  href={nav.path}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 text-[11px] sm:text-sm font-semibold transition-all duration-200 border-b-2 whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'text-amber-400 border-amber-400'
                      : 'text-white/50 border-transparent hover:text-white/80 hover:border-white/20'
                  }`}
                >
                  {nav.icon}
                  {nav.label}
                </a>
              );
            })}
            {/* Kết quả Thi đua — popup trigger tab */}
            <button
              onClick={() => setShowResultsPopup(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 text-[11px] sm:text-sm font-semibold transition-all duration-200 border-b-2 whitespace-nowrap shrink-0 text-white/50 border-transparent hover:text-white/80 hover:border-white/20 cursor-pointer bg-transparent outline-none"
            >
              <Medal size={14} />
              Kết quả Thi đua
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner — Gradient xanh sống động */}
      <div className="relative overflow-hidden"
        style={{
          background: isBlue
            ? 'linear-gradient(135deg, #1B3A7A 0%, #1a4fa0 30%, #2563eb 60%, #3b82f6 100%)'
            : 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 100%)',
        }}
      >
        {/* Floating circles */}
        <div className="absolute top-[10%] right-[5%] w-[200px] h-[200px] rounded-full border border-white/10 opacity-30 hidden sm:block" />
        <div className="absolute bottom-[15%] left-[3%] w-[120px] h-[120px] rounded-full border border-white/10 opacity-20 hidden sm:block" />
        <div className="absolute top-[50%] right-[20%] w-[60px] h-[60px] rounded-full bg-white/5 hidden sm:block" />

        {/* Hero content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 pb-28 sm:pb-36">
          {heroContent}
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block" preserveAspectRatio="none">
            <path d="M0,50 C320,90 720,10 1080,50 C1260,70 1380,80 1440,60 L1440,90 L0,90 Z" fill={isBlue ? '#f0f4f8' : '#0a0f1e'} />
          </svg>
        </div>
      </div>

      {/* Body Content — Light/Dark background */}
      <div style={{ background: isBlue ? '#f0f4f8' : '#0a0f1e' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 -mt-8">
          {bodyContent}
        </div>
      </div>

      {/* Footer */}
      <footer className={`py-8 text-center text-xs ${
        isBlue ? 'text-slate-400 bg-[#f0f4f8]' : 'text-gray-500 bg-[#0a0f1e]'
      }`}>
        {footerLinks && footerLinks.length > 0 && (
          <div className="flex justify-center gap-6 mb-3">
            {footerLinks.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                className={`hover:underline ${isBlue ? 'text-blue-500' : 'text-blue-400'}`}
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
        <p>{footerText || '© 2026 Galaxy Education. Galaxy Elite Awards — Chương trình Vinh danh Đại sứ Giáo dục.'}</p>
      </footer>

      {/* ═══════ Results Popup Modal ═══════ */}
      <AnimatePresence>
        {showResultsPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={() => setShowResultsPopup(false)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: 'spring', bounce: 0.25, duration: 0.6 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.5)]"
            >
              {/* Animated gradient background */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(135deg, #1B3A7A 0%, #2563eb 25%, #7c3aed 50%, #2563eb 75%, #1B3A7A 100%)',
                  backgroundSize: '400% 400%',
                  animation: 'gradientShift 6s ease infinite',
                }}
              />

              {/* Floating particles */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: Math.random() * 8 + 4,
                    height: Math.random() * 8 + 4,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    background: ['#FDE047', '#F59E0B', '#FBBF24', '#FCD34D', '#EAB308', '#F97316'][i % 6],
                    opacity: 0.5,
                  }}
                  animate={{
                    y: [0, -20, 0],
                    x: [0, Math.random() * 10 - 5, 0],
                    opacity: [0.3, 0.7, 0.3],
                    scale: [1, 1.3, 1],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}

              {/* Decorative rings */}
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full border-2 border-white/10 opacity-40" />
              <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full border-2 border-amber-400/15 opacity-30" />

              {/* Content */}
              <div className="relative z-10 px-6 sm:px-8 py-10 sm:py-12 text-center">

                {/* Close button */}
                <button
                  onClick={() => setShowResultsPopup(false)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/25 transition-all duration-200 text-white/70 hover:text-white"
                >
                  <X size={18} />
                </button>

                {/* Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                  className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-500 shadow-[0_8px_30px_rgba(245,158,11,0.5)] mb-6"
                >
                  <PartyPopper className="w-10 h-10 sm:w-12 sm:h-12 text-white" strokeWidth={2} />
                </motion.div>

                {/* Title */}
                <motion.h3
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl sm:text-2xl font-heading font-black text-white mb-2 uppercase tracking-wide"
                >
                  Kết quả Thi đua
                </motion.h3>

                {/* Divider */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  className="w-16 h-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full mx-auto mb-6"
                />

                {/* Message */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="text-base sm:text-lg text-white/90 font-medium leading-relaxed mb-8 max-w-sm mx-auto"
                >
                  Kết quả chính thức sẽ được công bố vào{' '}
                  <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-300 to-orange-400">
                    đầu tháng 04/2026
                  </span>
                  , Đại sứ hãy cùng chờ đón nhé!
                </motion.p>

                {/* Countdown-style badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.55 }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 text-sm font-semibold mb-8"
                >
                  <CalendarClock size={16} className="text-amber-400" />
                  <span>Tháng 04/2026</span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <Clock size={13} />
                    Sắp công bố
                  </span>
                </motion.div>

                {/* CTA Button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <button
                    onClick={() => setShowResultsPopup(false)}
                    className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold text-sm shadow-[0_6px_24px_rgba(245,158,11,0.4)] hover:shadow-[0_8px_30px_rgba(245,158,11,0.6)] hover:scale-105 transition-all duration-300"
                  >
                    ✨ Đã hiểu, cảm ơn!
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
