import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellRing, X } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

export function NotificationBanner() {
  const { permission, toast, loading, requestPermission, dismissToast } = useNotifications();

  return (
    <>
      {/* Permission banner — shown only if user hasn't decided yet */}
      <AnimatePresence>
        {permission === 'default' && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-md"
          >
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl shadow-2xl shadow-blue-900/30 border border-blue-400/20 p-4 flex items-start gap-3">
              <div className="p-2.5 bg-white/15 rounded-xl shrink-0">
                <Bell className="w-5 h-5 text-amber-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm leading-snug">
                  🔔 Bật thông báo từ Đại sứ Giáo dục
                </p>
                <p className="text-blue-200/80 text-xs mt-1 leading-relaxed">
                  Nhận nhắc nhở theo dõi Bảng xếp hạng thi đua mỗi ngày và cập nhật chương trình thưởng hấp dẫn từ Galaxy Education.
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={requestPermission}
                    disabled={loading}
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-blue-900 text-xs font-extrabold rounded-xl transition-colors shadow-sm disabled:opacity-60"
                  >
                    {loading ? 'Đang xử lý...' : 'Bật thông báo'}
                  </button>
                  <button
                    onClick={() => {
                      // Dismiss by changing permission state locally (won't re-show)
                      sessionStorage.setItem('notif_dismissed', '1');
                      window.dispatchEvent(new Event('notif_dismissed'));
                    }}
                    className="px-3 py-2 text-blue-200/70 hover:text-white text-xs font-medium rounded-xl transition-colors"
                  >
                    Để sau
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Foreground toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -80, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -80, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-md"
          >
            <div className="bg-white rounded-2xl shadow-2xl shadow-black/15 border border-slate-200 p-4 flex items-start gap-3">
              <div className="p-2.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shrink-0">
                <BellRing className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-800 font-bold text-sm leading-snug">{toast.title}</p>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">{toast.body}</p>
              </div>
              <button onClick={dismissToast} className="text-slate-300 hover:text-slate-500 transition-colors shrink-0 mt-0.5">
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
