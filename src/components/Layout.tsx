import React from 'react';
import { useLocation } from 'react-router-dom';
import logo from '../assets/ge-logo.png';
import { Moon, Sun, Sparkles, Award, BarChart3, Gift, FileText, Medal } from 'lucide-react';

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

export function Layout({ heroContent, bodyContent, theme = 'blue', onToggleTheme, footerText, footerLinks, headerTagline }: LayoutProps) {
  const isBlue = theme === 'blue';
  const location = useLocation();
  const currentPath = location.pathname;


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
            <a href="/results" className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-[0_4px_15px_rgba(245,158,11,0.4)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.6)] hover:scale-105 transition-all duration-300 no-underline">
              <Sparkles size={12} />
              Kết quả Thi đua
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
            {/* Kết quả Thi đua — link to results page */}
            <a
              href="/results"
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 text-[11px] sm:text-sm font-semibold transition-all duration-200 border-b-2 whitespace-nowrap shrink-0 no-underline ${
                currentPath === '/results'
                  ? 'text-amber-400 border-amber-400'
                  : 'text-white/50 border-transparent hover:text-white/80 hover:border-white/20'
              }`}
            >
              <Medal size={14} />
              Kết quả Thi đua
            </a>
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


    </div>
  );
}
