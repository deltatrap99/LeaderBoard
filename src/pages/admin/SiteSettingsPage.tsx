import { useState, useEffect } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useSiteSettings, type SiteSettings } from '../../hooks/useSiteSettings';
import { Settings, Save, RotateCcw, Check, AlertCircle } from 'lucide-react';

export function SiteSettingsPage() {
  const { settings, loaded, DEFAULTS } = useSiteSettings();
  const [form, setForm] = useState<SiteSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (loaded) setForm(settings);
  }, [loaded, settings]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await setDoc(doc(db, 'siteSettings', 'main'), {
        ...form,
        updatedAt: serverTimestamp(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm(DEFAULTS);
  };

  const inputClass = 'w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all text-sm';
  const labelClass = 'block text-sm font-medium text-white/70 mb-2';

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-blue-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Settings size={24} className="text-blue-400" />
            Cài đặt Website
          </h1>
          <p className="text-white/50 text-sm mt-1">Chỉnh sửa nội dung hiển thị trên trang chủ</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm mb-6">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="space-y-8">
        {/* Hero Section */}
        <section className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-5">🏆 Hero Section</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Badge Text</label>
              <input
                value={form.badgeText}
                onChange={e => setForm({ ...form, badgeText: e.target.value })}
                className={inputClass}
                placeholder="Galaxy Elite Awards 2026"
              />
            </div>
            <div>
              <label className={labelClass}>Tiêu đề chính</label>
              <input
                value={form.heroTitle}
                onChange={e => setForm({ ...form, heroTitle: e.target.value })}
                className={inputClass}
                placeholder="Vinh danh Đại sứ Giáo dục"
              />
            </div>
            <div>
              <label className={labelClass}>Tiêu đề highlight (dòng 2)</label>
              <input
                value={form.heroTitleHighlight}
                onChange={e => setForm({ ...form, heroTitleHighlight: e.target.value })}
                className={inputClass}
                placeholder="Galaxy Education"
              />
            </div>
            <div>
              <label className={labelClass}>Mô tả phụ</label>
              <textarea
                value={form.heroSubtitle}
                onChange={e => setForm({ ...form, heroSubtitle: e.target.value })}
                rows={3}
                className={inputClass + ' resize-none'}
                placeholder="Mô tả ngắn gọn..."
              />
            </div>
          </div>
        </section>

        {/* Data Source */}
        <section className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-5">📊 Nguồn dữ liệu</h2>
          <div>
            <label className={labelClass}>Google Sheet URL (export XLSX)</label>
            <input
              value={form.sheetUrl}
              onChange={e => setForm({ ...form, sheetUrl: e.target.value })}
              className={inputClass + ' font-mono text-xs'}
              placeholder="https://docs.google.com/spreadsheets/d/.../export?format=xlsx"
            />
            <p className="text-xs text-white/30 mt-2">URL phải ở dạng export XLSX. Ví dụ: https://docs.google.com/spreadsheets/d/ID/export?format=xlsx</p>
          </div>
        </section>

        {/* Tab Labels */}
        <section className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-5">📑 Tên các Tab</h2>
          <div className="grid grid-cols-2 gap-4">
            {(['month', 'quarter', 'semester', 'challenge'] as const).map(key => (
              <div key={key}>
                <label className={labelClass}>{key === 'month' ? 'Tháng' : key === 'quarter' ? 'Quý' : key === 'semester' ? 'Kỳ' : 'Challenge'}</label>
                <input
                  value={form.tabLabels[key]}
                  onChange={e => setForm({ ...form, tabLabels: { ...form.tabLabels, [key]: e.target.value } })}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <section className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-5">📝 Footer</h2>
          <div>
            <label className={labelClass}>Footer text</label>
            <input
              value={form.footerText}
              onChange={e => setForm({ ...form, footerText: e.target.value })}
              className={inputClass}
            />
          </div>
        </section>

        {/* Action buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold text-sm shadow-lg shadow-blue-700/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
            ) : saved ? (
              <Check size={16} className="text-green-400" />
            ) : (
              <Save size={16} />
            )}
            {saved ? 'Đã lưu!' : 'Lưu thay đổi'}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/5 border border-white/10 text-sm font-medium transition-all duration-200"
          >
            <RotateCcw size={16} />
            Khôi phục mặc định
          </button>
        </div>
      </div>
    </div>
  );
}
