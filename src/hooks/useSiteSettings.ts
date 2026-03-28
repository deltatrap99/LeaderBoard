import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';

export interface SiteSettings {
  // SEO & Meta
  pageTitle: string;

  // Header
  headerTagline: string;
  headerCtaText: string;
  headerCtaUrl: string;

  // Announcement Bar
  announcementEnabled: boolean;
  announcementText: string;
  announcementType: 'info' | 'success' | 'warning';

  // Hero Section
  heroTitle: string;
  heroTitleHighlight: string;
  heroSubtitle: string;
  badgeText: string;

  // Stats Row
  statsLabels: { ambassadors: string; categories: string; update: string };

  // Data Source
  sheetUrl: string;
  refreshInterval: number; // seconds

  // Tabs
  tabLabels: { month: string; quarter: string; semester: string; challenge: string };
  tabVisibility: { month: boolean; quarter: boolean; semester: boolean; challenge: boolean };
  defaultTab: 'month' | 'quarter' | 'semester' | 'challenge';

  // Appearance
  defaultTheme: 'blue' | 'dark';

  // Footer
  footerText: string;
  footerLinks: { label: string; url: string }[];
}

const DEFAULTS: SiteSettings = {
  // SEO & Meta
  pageTitle: 'Bảng thi đua Galaxy Elite Awards 2026',

  // Header
  headerTagline: 'Elite Awards',
  headerCtaText: 'Kết quả Thi đua',
  headerCtaUrl: '#',

  // Announcement Bar
  announcementEnabled: false,
  announcementText: '',
  announcementType: 'info',

  // Hero Section
  heroTitle: 'Vinh danh Đại sứ Giáo dục',
  heroTitleHighlight: 'Galaxy Education',
  heroSubtitle: '"Đây không chỉ là những cái tên dẫn đầu thành tích, đây là những tấm gương truyền cảm hứng sự nỗ lực không ngừng trên hành trình lan tỏa những giải pháp giáo dục chất lượng cao đến Phụ huynh và Học sinh trên mọi miền đất nước."',
  badgeText: 'Galaxy Elite Awards 2026',

  // Stats Row
  statsLabels: { ambassadors: 'Đại sứ', categories: 'Hạng mục', update: 'Cập nhật' },

  // Data Source
  sheetUrl: 'https://docs.google.com/spreadsheets/d/1LktWs8p4xbTToJJaEu2y6RBwj5W26daoVFKiKMNHhJs/export?format=xlsx',
  refreshInterval: 30,

  // Tabs
  tabLabels: { month: 'Tháng', quarter: 'Quý', semester: 'Kỳ', challenge: 'Challenge' },
  tabVisibility: { month: true, quarter: true, semester: true, challenge: true },
  defaultTab: 'month',

  // Appearance
  defaultTheme: 'blue',

  // Footer
  footerText: '© 2026 Galaxy Education. Galaxy Elite Awards — Chương trình Vinh danh Đại sứ Giáo dục.',
  footerLinks: [],
};

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      setLoaded(true);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'siteSettings', 'main'),
      (snap) => {
        if (snap.exists()) {
          setSettings({ ...DEFAULTS, ...snap.data() } as SiteSettings);
        }
        setLoaded(true);
      },
      () => {
        setLoaded(true);
      }
    );
    return () => unsubscribe();
  }, []);

  return { settings, loaded, DEFAULTS };
}
