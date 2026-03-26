import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';

export interface SiteSettings {
  heroTitle: string;
  heroTitleHighlight: string;
  heroSubtitle: string;
  badgeText: string;
  sheetUrl: string;
  footerText: string;
  tabLabels: { month: string; quarter: string; semester: string; challenge: string };
}

const DEFAULTS: SiteSettings = {
  heroTitle: 'Vinh danh Đại sứ Giáo dục',
  heroTitleHighlight: 'Galaxy Education',
  heroSubtitle: '"Đây không chỉ là những cái tên dẫn đầu thành tích, đây là những tấm gương truyền cảm hứng sự nỗ lực không ngừng trên hành trình lan tỏa những giải pháp giáo dục chất lượng cao đến Phụ huynh và Học sinh trên mọi miền đất nước."',
  badgeText: 'Galaxy Elite Awards 2026',
  sheetUrl: 'https://docs.google.com/spreadsheets/d/1LktWs8p4xbTToJJaEu2y6RBwj5W26daoVFKiKMNHhJs/export?format=xlsx',
  footerText: '© 2026 Galaxy Education. Galaxy Elite Awards — Chương trình Vinh danh Đại sứ Giáo dục.',
  tabLabels: { month: 'Tháng', quarter: 'Quý', semester: 'Kỳ', challenge: 'Challenge' },
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
        // Firestore error — use defaults
        setLoaded(true);
      }
    );
    return () => unsubscribe();
  }, []);

  return { settings, loaded, DEFAULTS };
}
