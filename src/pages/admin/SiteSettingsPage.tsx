import { useState, useEffect } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db as _db } from '../../firebase';
const db = _db!;
import { useSiteSettings, type SiteSettings } from '../../hooks/useSiteSettings';
import { Settings, Save, RotateCcw, Check, AlertCircle, Globe, Type, BarChart3, Database, Layout, Palette, Link2, BellRing, Eye, EyeOff, Plus, X } from 'lucide-react';

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

  const handleReset = () => setForm(DEFAULTS);

  const inputClass = 'w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all text-sm';
  const labelClass = 'block text-sm font-medium text-white/70 mb-2';
  const sectionClass = 'bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6';

  const addFooterLink = () => {
    setForm({ ...form, footerLinks: [...(form.footerLinks || []), { label: '', url: '' }] });
  };

  const removeFooterLink = (index: number) => {
    const links = [...(form.footerLinks || [])];
    links.splice(index, 1);
    setForm({ ...form, footerLinks: links });
  };

  const updateFooterLink = (index: number, field: 'label' | 'url', value: string) => {
    const links = [...(form.footerLinks || [])];
    links[index] = { ...links[index], [field]: value };
    setForm({ ...form, footerLinks: links });
  };

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
          <p className="text-white/50 text-sm mt-1">Chỉnh sửa toàn bộ nội dung hiển thị trên trang chủ</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm mb-6">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* 1. SEO & Meta */}
        <section className={sectionClass}>
          <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <Globe size={18} className="text-blue-400" />
            SEO & Tiêu đề trang
          </h2>
          <div>
            <label className={labelClass}>Tiêu đề tab trình duyệt</label>
            <input
              value={form.pageTitle}
              onChange={e => setForm({ ...form, pageTitle: e.target.value })}
              className={inputClass}
              placeholder="Bảng thi đua Galaxy Elite Awards 2026"
            />
            <p className="text-xs text-white/30 mt-1.5">Hiển thị trên tab trình duyệt và kết quả tìm kiếm Google</p>
          </div>
        </section>

        {/* 2. Header */}
        <section className={sectionClass}>
          <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <Type size={18} className="text-indigo-400" />
            Header
          </h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Tagline (bên cạnh logo)</label>
              <input
                value={form.headerTagline}
                onChange={e => setForm({ ...form, headerTagline: e.target.value })}
                className={inputClass}
                placeholder="Elite Awards"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nút CTA — Text</label>
                <input
                  value={form.headerCtaText}
                  onChange={e => setForm({ ...form, headerCtaText: e.target.value })}
                  className={inputClass}
                  placeholder="Bảng Vàng Tôn Vinh"
                />
              </div>
              <div>
                <label className={labelClass}>Nút CTA — Link</label>
                <input
                  value={form.headerCtaUrl}
                  onChange={e => setForm({ ...form, headerCtaUrl: e.target.value })}
                  className={inputClass}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        </section>

        {/* 3. Announcement Bar */}
        <section className={sectionClass}>
          <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <BellRing size={18} className="text-amber-400" />
            Thanh thông báo
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white/70">Bật thanh thông báo</label>
              <button
                onClick={() => setForm({ ...form, announcementEnabled: !form.announcementEnabled })}
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${form.announcementEnabled ? 'bg-blue-500' : 'bg-white/10'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${form.announcementEnabled ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>
            {form.announcementEnabled && (
              <>
                <div>
                  <label className={labelClass}>Nội dung thông báo</label>
                  <input
                    value={form.announcementText}
                    onChange={e => setForm({ ...form, announcementText: e.target.value })}
                    className={inputClass}
                    placeholder="🎉 Dữ liệu được cập nhật mỗi 30 giây!"
                  />
                </div>
                <div>
                  <label className={labelClass}>Loại thông báo</label>
                  <select
                    value={form.announcementType}
                    onChange={e => setForm({ ...form, announcementType: e.target.value as any })}
                    className={inputClass}
                  >
                    <option value="info">ℹ️ Thông tin (xanh)</option>
                    <option value="success">✅ Thành công (xanh lá)</option>
                    <option value="warning">⚠️ Cảnh báo (vàng)</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </section>

        {/* 4. Hero Section */}
        <section className={sectionClass}>
          <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            🏆 Hero Section
          </h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Badge nhỏ (phía trên tiêu đề)</label>
              <input
                value={form.badgeText}
                onChange={e => setForm({ ...form, badgeText: e.target.value })}
                className={inputClass}
                placeholder="Galaxy Elite Awards 2026"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Tiêu đề dòng 1 (trắng)</label>
                <input
                  value={form.heroTitle}
                  onChange={e => setForm({ ...form, heroTitle: e.target.value })}
                  className={inputClass}
                  placeholder="Vinh danh Đại sứ Giáo dục"
                />
              </div>
              <div>
                <label className={labelClass}>Tiêu đề dòng 2 (vàng cam)</label>
                <input
                  value={form.heroTitleHighlight}
                  onChange={e => setForm({ ...form, heroTitleHighlight: e.target.value })}
                  className={inputClass}
                  placeholder="Galaxy Education"
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Mô tả phụ</label>
              <textarea
                value={form.heroSubtitle}
                onChange={e => setForm({ ...form, heroSubtitle: e.target.value })}
                rows={3}
                className={inputClass + ' resize-none'}
              />
            </div>
          </div>
        </section>

        {/* 5. Stats Labels */}
        <section className={sectionClass}>
          <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <BarChart3 size={18} className="text-emerald-400" />
            Nhãn thống kê (Stats)
          </h2>
          <p className="text-xs text-white/30 mb-4">3 chỉ số hiển thị bên dưới hero (ví dụ: "500+ Đại sứ | 12 Hạng mục | Live Cập nhật")</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Chỉ số 1</label>
              <input
                value={form.statsLabels?.ambassadors || 'Đại sứ'}
                onChange={e => setForm({ ...form, statsLabels: { ...form.statsLabels, ambassadors: e.target.value } })}
                className={inputClass}
                placeholder="Đại sứ"
              />
            </div>
            <div>
              <label className={labelClass}>Chỉ số 2</label>
              <input
                value={form.statsLabels?.categories || 'Hạng mục'}
                onChange={e => setForm({ ...form, statsLabels: { ...form.statsLabels, categories: e.target.value } })}
                className={inputClass}
                placeholder="Hạng mục"
              />
            </div>
            <div>
              <label className={labelClass}>Chỉ số 3</label>
              <input
                value={form.statsLabels?.update || 'Cập nhật'}
                onChange={e => setForm({ ...form, statsLabels: { ...form.statsLabels, update: e.target.value } })}
                className={inputClass}
                placeholder="Cập nhật"
              />
            </div>
          </div>
        </section>

        {/* 6. Data Source */}
        <section className={sectionClass}>
          <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <Database size={18} className="text-cyan-400" />
            Nguồn dữ liệu
          </h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Google Sheet URL (XLSX export)</label>
              <input
                value={form.sheetUrl}
                onChange={e => setForm({ ...form, sheetUrl: e.target.value })}
                className={inputClass + ' font-mono text-xs'}
                placeholder="https://docs.google.com/spreadsheets/d/.../export?format=xlsx"
              />
              <p className="text-xs text-white/30 mt-1.5">URL phải ở dạng export XLSX</p>
            </div>
            <div>
              <label className={labelClass}>Tần suất tự động refresh (giây)</label>
              <input
                type="number"
                min={10}
                max={300}
                value={form.refreshInterval || 30}
                onChange={e => setForm({ ...form, refreshInterval: parseInt(e.target.value) || 30 })}
                className={inputClass + ' w-32'}
              />
              <p className="text-xs text-white/30 mt-1.5">Tối thiểu 10 giây, tối đa 300 giây</p>
            </div>
          </div>
        </section>

        {/* 7. Tabs */}
        <section className={sectionClass}>
          <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <Layout size={18} className="text-purple-400" />
            Cấu hình Tab
          </h2>
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Tab mặc định khi mở trang</label>
              <select
                value={form.defaultTab || 'month'}
                onChange={e => setForm({ ...form, defaultTab: e.target.value as any })}
                className={inputClass + ' w-48'}
              >
                <option value="month">Tháng</option>
                <option value="quarter">Quý</option>
                <option value="semester">Kỳ</option>
                <option value="challenge">Challenge</option>
              </select>
            </div>
            <div>
              <p className={labelClass}>Tên và trạng thái hiển thị</p>
              <div className="space-y-3">
                {(['month', 'quarter', 'semester', 'challenge'] as const).map(key => {
                  const icons: Record<string, string> = { month: '📅', quarter: '🏆', semester: '⭐', challenge: '🔥' };
                  const defaults: Record<string, string> = { month: 'Tháng', quarter: 'Quý', semester: 'Kỳ', challenge: 'Challenge' };
                  const visible = form.tabVisibility?.[key] !== false;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <button
                        onClick={() => setForm({ ...form, tabVisibility: { ...form.tabVisibility, [key]: !visible } })}
                        className={`p-2 rounded-lg border transition-colors ${visible ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'bg-white/5 border-white/10 text-white/30'}`}
                        title={visible ? 'Đang hiện' : 'Đang ẩn'}
                      >
                        {visible ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <span className="text-lg">{icons[key]}</span>
                      <input
                        value={form.tabLabels?.[key] || defaults[key]}
                        onChange={e => setForm({ ...form, tabLabels: { ...form.tabLabels, [key]: e.target.value } })}
                        className={inputClass + ' flex-1'}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* 8. Appearance */}
        <section className={sectionClass}>
          <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <Palette size={18} className="text-pink-400" />
            Giao diện
          </h2>
          <div>
            <label className={labelClass}>Theme mặc định</label>
            <div className="flex gap-3">
              {[
                { value: 'blue' as const, label: 'Galaxy Blue', color: 'from-blue-600 to-blue-700' },
                { value: 'dark' as const, label: 'Dark Mode', color: 'from-slate-700 to-slate-800' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setForm({ ...form, defaultTheme: opt.value })}
                  className={`flex items-center gap-3 px-5 py-3 rounded-xl border transition-all duration-200 ${
                    form.defaultTheme === opt.value
                      ? 'bg-blue-600/20 border-blue-500/30 text-white'
                      : 'bg-white/[0.03] border-white/10 text-white/50 hover:text-white hover:border-white/20'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${opt.color}`} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 9. Footer */}
        <section className={sectionClass}>
          <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <Link2 size={18} className="text-orange-400" />
            Footer
          </h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Footer text</label>
              <input
                value={form.footerText}
                onChange={e => setForm({ ...form, footerText: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Liên kết Footer</label>
              <div className="space-y-2">
                {(form.footerLinks || []).map((link, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={link.label}
                      onChange={e => updateFooterLink(i, 'label', e.target.value)}
                      className={inputClass + ' flex-1'}
                      placeholder="Tên liên kết"
                    />
                    <input
                      value={link.url}
                      onChange={e => updateFooterLink(i, 'url', e.target.value)}
                      className={inputClass + ' flex-1'}
                      placeholder="https://..."
                    />
                    <button onClick={() => removeFooterLink(i)} className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button onClick={addFooterLink} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 border border-dashed border-white/10 transition-all">
                  <Plus size={14} /> Thêm liên kết
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Action Buttons - Sticky */}
        <div className="sticky bottom-4 z-20 flex items-center gap-3 bg-slate-800/95 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-4 shadow-2xl">
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
          {saved && <span className="text-xs text-green-400 ml-2">✓ Thay đổi sẽ hiển thị trên trang chủ ngay lập tức</span>}
        </div>
      </div>
    </div>
  );
}
