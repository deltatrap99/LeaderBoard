import { useAuth } from '../../hooks/useAuth';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { LayoutDashboard, Settings, Users, ExternalLink, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AdminOverview() {
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const isSuperAdmin = user?.role === 'superadmin';

  const cards = [
    {
      icon: <Settings size={22} className="text-blue-400" />,
      title: 'Cài đặt Website',
      desc: 'Chỉnh sửa nội dung hero, tabs, footer',
      to: '/admin/settings',
      color: 'from-blue-500/10 to-blue-600/5 border-blue-500/15',
    },
    ...(isSuperAdmin ? [{
      icon: <Users size={22} className="text-emerald-400" />,
      title: 'Quản lý Users',
      desc: 'Thêm, xóa, phân quyền người dùng',
      to: '/admin/users',
      color: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/15',
    }] : []),
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <LayoutDashboard size={24} className="text-blue-400" />
          Tổng quan
        </h1>
        <p className="text-white/50 text-sm mt-1">
          Xin chào, <span className="text-white/80 font-medium">{user?.displayName || user?.email}</span>
        </p>
      </div>

      {/* Quick info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center gap-2 text-white/40 text-xs font-medium mb-2">
            <Clock size={14} />
            Badge Text
          </div>
          <p className="text-white font-medium text-sm">{settings.badgeText}</p>
        </div>
        <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center gap-2 text-white/40 text-xs font-medium mb-2">
            <ExternalLink size={14} />
            Google Sheet
          </div>
          <p className="text-white/60 font-mono text-xs truncate">{settings.sheetUrl.substring(0, 60)}...</p>
        </div>
        <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center gap-2 text-white/40 text-xs font-medium mb-2">
            <Users size={14} />
            Vai trò
          </div>
          <p className="text-white font-medium text-sm capitalize">{user?.role}</p>
        </div>
      </div>

      {/* Quick actions */}
      <h2 className="text-lg font-semibold text-white mb-4">Truy cập nhanh</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map(card => (
          <Link
            key={card.to}
            to={card.to}
            className={`group bg-gradient-to-br ${card.color} border rounded-xl p-6 hover:scale-[1.02] transition-all duration-300`}
          >
            <div className="mb-3">{card.icon}</div>
            <h3 className="text-white font-semibold mb-1">{card.title}</h3>
            <p className="text-white/40 text-sm">{card.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
