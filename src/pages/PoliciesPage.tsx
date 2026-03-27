import { useState } from 'react';
import { Layout } from '../components/Layout';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { motion } from 'framer-motion';
import {
  Shield,
  Users,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Info,
  FileWarning,
  Scale,
  Handshake,
  BadgeAlert,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface PolicySectionProps {
  icon: React.ReactNode;
  number: string;
  title: string;
  children: React.ReactNode;
  theme: string;
  delay?: number;
  accentColor: string;
  defaultOpen?: boolean;
}

function PolicySection({ icon, number, title, children, theme, delay = 0, accentColor, defaultOpen = true }: PolicySectionProps) {
  const [expanded, setExpanded] = useState(defaultOpen);
  const isBlue = theme === 'blue';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      className={`rounded-3xl overflow-hidden transition-all duration-500 ${
        isBlue
          ? 'bg-white shadow-[0_4px_25px_rgba(0,0,0,0.08)] border border-slate-200/80'
          : 'bg-white/[0.04] shadow-[0_8px_40px_rgba(0,0,0,0.4)] border border-white/[0.08]'
      }`}
    >
      {/* Section Header */}
      <div
        className="relative px-4 sm:px-6 py-4 sm:py-5 cursor-pointer overflow-hidden"
        onClick={() => setExpanded(!expanded)}
        style={{
          background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 50%, ${accentColor}bb 100%)`,
        }}
      >
        {/* Decorative */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/[0.07] rounded-full -translate-y-12 translate-x-12" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/[0.05] rounded-full translate-y-8 -translate-x-8" />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <div className="p-3 bg-white/15 rounded-2xl backdrop-blur-sm border border-white/10 shadow-lg">
              {icon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold px-2.5 py-0.5 bg-white/20 rounded-full text-white/90 tracking-wider uppercase">
                  Điều {number}
                </span>
              </div>
              <h2 className="text-sm sm:text-lg font-heading font-extrabold text-white leading-tight">
                {title}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {expanded ? (
              <ChevronUp size={20} className="text-white/60" />
            ) : (
              <ChevronDown size={20} className="text-white/60" />
            )}
          </div>
        </div>
      </div>

      {/* Section Content */}
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className={`px-5 sm:px-8 py-6 sm:py-8 ${isBlue ? '' : ''}`}>
            {children}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ── Reusable styled components ─────────────────── */

function CalloutBox({ icon, children, variant = 'info', theme }: { icon: React.ReactNode; children: React.ReactNode; variant?: 'info' | 'warning' | 'danger' | 'success' | 'highlight'; theme: string }) {
  const isBlue = theme === 'blue';
  const styles = {
    info: isBlue
      ? 'bg-blue-50 border-blue-200 text-blue-800'
      : 'bg-blue-950/30 border-blue-500/20 text-blue-200',
    warning: isBlue
      ? 'bg-amber-50 border-amber-200 text-amber-800'
      : 'bg-amber-950/30 border-amber-500/20 text-amber-200',
    danger: isBlue
      ? 'bg-red-50 border-red-200 text-red-800'
      : 'bg-red-950/30 border-red-500/20 text-red-200',
    success: isBlue
      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
      : 'bg-emerald-950/30 border-emerald-500/20 text-emerald-200',
    highlight: isBlue
      ? 'bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200 text-indigo-800'
      : 'bg-gradient-to-r from-indigo-950/30 to-blue-950/30 border-indigo-500/20 text-indigo-200',
  };

  return (
    <div className={`flex gap-2.5 sm:gap-3 px-3.5 sm:px-5 py-3 sm:py-4 rounded-2xl border ${styles[variant]} text-sm leading-relaxed`}>
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function BulletItem({ icon, children, theme }: { icon: React.ReactNode; children: React.ReactNode; theme: string }) {
  const isBlue = theme === 'blue';
  return (
    <div className="flex gap-3 items-start">
      <div className={`shrink-0 mt-1 ${isBlue ? 'text-blue-500' : 'text-blue-400'}`}>{icon}</div>
      <div className={`text-sm leading-relaxed ${isBlue ? 'text-slate-600' : 'text-white/60'}`}>{children}</div>
    </div>
  );
}

function ViolationItem({ children, theme }: { children: React.ReactNode; theme: string }) {
  const isBlue = theme === 'blue';
  return (
    <div className="flex gap-3 items-start">
      <div className={`shrink-0 mt-0.5 p-1 rounded-lg ${isBlue ? 'bg-red-100 text-red-500' : 'bg-red-500/10 text-red-400'}`}>
        <XCircle size={14} />
      </div>
      <div className={`text-sm leading-relaxed ${isBlue ? 'text-slate-600' : 'text-white/60'}`}>{children}</div>
    </div>
  );
}

function RequirementItem({ children, theme }: { children: React.ReactNode; theme: string }) {
  const isBlue = theme === 'blue';
  return (
    <div className="flex gap-3 items-start">
      <div className={`shrink-0 mt-0.5 p-1 rounded-lg ${isBlue ? 'bg-emerald-100 text-emerald-500' : 'bg-emerald-500/10 text-emerald-400'}`}>
        <CheckCircle2 size={14} />
      </div>
      <div className={`text-sm leading-relaxed ${isBlue ? 'text-slate-600' : 'text-white/60'}`}>{children}</div>
    </div>
  );
}

function SectionDivider({ theme }: { theme: string }) {
  const isBlue = theme === 'blue';
  return (
    <div className={`my-6 border-t ${isBlue ? 'border-slate-100' : 'border-white/[0.06]'}`} />
  );
}

function SubHeading({ children, theme }: { children: React.ReactNode; theme: string }) {
  const isBlue = theme === 'blue';
  return (
    <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${isBlue ? 'text-slate-800' : 'text-white/90'}`}>
      {children}
    </h3>
  );
}

/* ── Main page ─────────────────── */

export function PoliciesPage() {
  const { settings } = useSiteSettings();
  const [theme, setTheme] = useState<'blue' | 'dark'>(settings.defaultTheme || 'blue');
  const isBlue = theme === 'blue';

  const heroContent = (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center mb-5"
      >
        <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium">
          <Scale size={14} className="text-amber-400" />
          Quy định nội bộ
        </span>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-2xl sm:text-4xl lg:text-5xl font-heading font-black text-white mb-3 tracking-[-0.01em] text-center leading-tight uppercase"
      >
        Chính sách & Quy định
        <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-400">
          Tuyển sinh
        </span>
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="text-xs sm:text-sm text-white/70 max-w-2xl mx-auto text-center font-medium leading-relaxed mb-7"
      >
        Những nguyên tắc cốt lõi mà mỗi Đại sứ Giáo dục cần nắm vững để bảo vệ quyền lợi cá nhân, duy trì uy tín thương hiệu và phát triển bền vững cùng Galaxy Education.
      </motion.p>
    </>
  );

  const bodyContent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="w-full flex flex-col gap-6"
    >
      {/* ═══════  SECTION 1  ═══════ */}
      <PolicySection
        icon={<Shield className="w-5 h-5 text-white" />}
        number="01"
        title="Nguyên tắc bảo vệ quyền khai thác khách hàng"
        theme={theme}
        delay={0.05}
        accentColor="#1B3A7A"
      >
        <div className="space-y-5">
          <CalloutBox
            icon={<Info size={18} />}
            variant="highlight"
            theme={theme}
          >
            <p className="font-semibold mb-1">Nguyên tắc ghi nhận quyền chăm sóc</p>
            <p>
              Quyền chăm sóc khách hàng <strong>CHỈ</strong> được ghi nhận dựa trên dữ liệu đăng ký trên <strong>Landing Page có gắn mã Đại sứ</strong>.
            </p>
          </CalloutBox>

          <div className={`rounded-2xl p-5 ${isBlue ? 'bg-slate-50 border border-slate-100' : 'bg-white/[0.03] border border-white/[0.06]'}`}>
            <SubHeading theme={theme}>
              <Clock size={15} className={isBlue ? 'text-blue-500' : 'text-blue-400'} />
              Yêu cầu đối với Đại sứ
            </SubHeading>
            <div className="space-y-4">
              <BulletItem icon={<ArrowRight size={14} />} theme={theme}>
                <span className="font-semibold">Ngay tại thời điểm</span> (thậm chí sớm hơn) tiếp cận khách hàng, bắt đầu tư vấn → Đại sứ <strong>phải chủ động khai báo lead trên hệ thống</strong>.
              </BulletItem>
              <BulletItem icon={<ArrowRight size={14} />} theme={theme}>
                Nếu Anh/Chị Đại sứ thu thập được dữ liệu khách hàng theo dạng <strong>danh sách</strong>, Agent Success luôn sẵn sàng tiếp nhận để <strong>đẩy dữ liệu đồng bộ lên AMS</strong> thay vì Anh/Chị phải nhập tay từng dữ liệu.
              </BulletItem>
            </div>
          </div>

          <CalloutBox
            icon={<AlertTriangle size={18} />}
            variant="warning"
            theme={theme}
          >
            <p>
              Mọi trường hợp <strong>không có dấu thời gian hợp lệ</strong> trên hệ thống → <strong>không được bảo vệ quyền lợi</strong>.
            </p>
          </CalloutBox>

          <CalloutBox
            icon={<Shield size={18} />}
            variant="info"
            theme={theme}
          >
            <p className="font-semibold">
              👉 Đây là nguyên tắc cốt lõi, áp dụng cho tất cả các kênh bán trong Galaxy Education.
            </p>
          </CalloutBox>
        </div>
      </PolicySection>

      {/* ═══════  SECTION 2  ═══════ */}
      <PolicySection
        icon={<Handshake className="w-5 h-5 text-white" />}
        number="02"
        title="Nguyên tắc hành xử khi cùng tiếp cận & chăm sóc khách hàng"
        theme={theme}
        delay={0.1}
        accentColor="#7c3aed"
      >
        <div className="space-y-5">
          <p className={`text-sm leading-relaxed ${isBlue ? 'text-slate-500' : 'text-white/50'}`}>
            Trong hệ thống đa kênh, việc nhiều người tư vấn (Đại sứ Giáo dục, Tư vấn viên, Cộng tác viên…) đồng thời tiếp cận và chăm sóc <strong className={isBlue ? 'text-slate-700' : 'text-white/80'}>cùng một khách hàng</strong> là tình huống thường xuyên xảy ra, đặc biệt gia tăng trong các giai đoạn cao điểm tuyển sinh.
          </p>

          <CalloutBox
            icon={<Scale size={18} />}
            variant="highlight"
            theme={theme}
          >
            Trong mọi trường hợp phát sinh trùng khai thác, tất cả các kênh bán và cá nhân liên quan <strong>bắt buộc phải tuân thủ nguyên tắc hành xử chung</strong> nhằm đảm bảo trải nghiệm khách hàng nhất quán, duy trì uy tín thương hiệu và bảo vệ quyền lợi hợp lệ của các bên.
          </CalloutBox>

          {/* Dấu hiệu trùng */}
          <div className={`rounded-2xl p-5 ${isBlue ? 'bg-amber-50/50 border border-amber-100' : 'bg-amber-950/20 border border-amber-500/10'}`}>
            <SubHeading theme={theme}>
              <BadgeAlert size={15} className={isBlue ? 'text-amber-600' : 'text-amber-400'} />
              Dấu hiệu trùng khai thác — Báo ngay về Support
            </SubHeading>
            <p className={`text-sm mb-4 ${isBlue ? 'text-slate-500' : 'text-white/50'}`}>
              Ngay khi nhận thấy có <strong className={isBlue ? 'text-slate-700' : 'text-white/80'}>1 trong các dấu hiệu</strong> dưới đây, Anh/Chị Đại sứ <strong className={isBlue ? 'text-slate-700' : 'text-white/80'}>lập tức báo về Support</strong> để kiểm trùng:
            </p>
            <div className="space-y-3">
              <BulletItem icon={<ArrowRight size={14} />} theme={theme}>
                Khách hàng báo đã từng tìm hiểu trên <strong>fanpage / website</strong>, có tài khoản học thử, hoặc đã từng đăng ký khóa học cụ thể khác trước đó.
              </BulletItem>
              <BulletItem icon={<ArrowRight size={14} />} theme={theme}>
                Contact hiển thị <strong>Khóa</strong> trên kho Contact AMS.
              </BulletItem>
              <BulletItem icon={<ArrowRight size={14} />} theme={theme}>
                Cảnh báo <strong>"Đã có tài khoản / Liên kết tài khoản"</strong> khi nhập thông tin khách hàng lên đơn.
              </BulletItem>
              <BulletItem icon={<ArrowRight size={14} />} theme={theme}>
                Hoặc <strong>các dấu hiệu nghi vấn khác</strong>...
              </BulletItem>
            </div>
          </div>

          <SectionDivider theme={theme} />

          {/* Hành vi vi phạm */}
          <div className={`rounded-2xl p-5 ${isBlue ? 'bg-red-50/50 border border-red-100' : 'bg-red-950/20 border border-red-500/10'}`}>
            <SubHeading theme={theme}>
              <FileWarning size={15} className={isBlue ? 'text-red-600' : 'text-red-400'} />
              Hành vi bị xác định là VI PHẠM — Hủy bỏ / thu hồi mọi quyền lợi
            </SubHeading>
            <p className={`text-sm mb-4 ${isBlue ? 'text-slate-500' : 'text-white/50'}`}>
              Quyền chăm sóc, ghi nhận doanh thu và thù lao đối với khách hàng trùng sẽ bị <strong className={isBlue ? 'text-red-700' : 'text-red-300'}>hủy bỏ / thu hồi</strong> nếu:
            </p>
            <div className="space-y-3">
              <ViolationItem theme={theme}>
                Nhận biết trùng nhưng <strong>không tiến hành khai báo</strong> và yêu cầu Support kiểm tra tình trạng trùng.
              </ViolationItem>
              <ViolationItem theme={theme}>
                <strong>Tự ý thay đổi thông tin khách hàng</strong> để lên đơn.
              </ViolationItem>
              <ViolationItem theme={theme}>
                Tiếp tục tư vấn, <strong>lôi kéo khách hàng</strong> / trao đổi thông tin theo hướng tiêu cực khiến khách hàng hiểu không đúng về chất lượng sản phẩm, khung dịch vụ chăm sóc và <strong>làm ảnh hưởng tới thương hiệu GE</strong> — khi đã được thông báo khách hàng thuộc quyền chăm sóc của kênh/người tư vấn khác.
              </ViolationItem>
            </div>
          </div>
        </div>
      </PolicySection>

      {/* ═══════  SECTION 3  ═══════ */}
      <PolicySection
        icon={<BookOpen className="w-5 h-5 text-white" />}
        number="03"
        title="Tuân thủ chính sách học phí & Quy trình tư vấn sản phẩm"
        theme={theme}
        delay={0.15}
        accentColor="#b91c1c"
      >
        <div className="space-y-5">
          <p className={`text-sm leading-relaxed ${isBlue ? 'text-slate-500' : 'text-white/50'}`}>
            Hiện tại, GE đã ghi nhận một số trường hợp <strong className={isBlue ? 'text-slate-700' : 'text-white/80'}>vi phạm chính sách học phí</strong> như:
          </p>

          {/* Vi phạm đã ghi nhận */}
          <div className={`rounded-2xl p-5 ${isBlue ? 'bg-red-50/50 border border-red-100' : 'bg-red-950/20 border border-red-500/10'}`}>
            <SubHeading theme={theme}>
              <AlertTriangle size={15} className={isBlue ? 'text-red-600' : 'text-red-400'} />
              Các vi phạm đã ghi nhận
            </SubHeading>
            <div className="space-y-3">
              <ViolationItem theme={theme}>
                Báo giá <strong>không đúng chính sách</strong>.
              </ViolationItem>
              <ViolationItem theme={theme}>
                <strong>Tự ý giảm giá</strong> để chốt sale.
              </ViolationItem>
              <ViolationItem theme={theme}>
                Tư vấn <strong>gây hiểu nhầm</strong> về sản phẩm / quyền lợi.
              </ViolationItem>
            </div>
          </div>

          <SectionDivider theme={theme} />

          {/* Yêu cầu bắt buộc */}
          <div className={`rounded-2xl p-5 ${isBlue ? 'bg-emerald-50/50 border border-emerald-100' : 'bg-emerald-950/20 border border-emerald-500/10'}`}>
            <SubHeading theme={theme}>
              <CheckCircle2 size={15} className={isBlue ? 'text-emerald-600' : 'text-emerald-400'} />
              Yêu cầu bắt buộc
            </SubHeading>
            <div className="space-y-3">
              <RequirementItem theme={theme}>
                Sử dụng <strong>chính sách học phí chung, chính thức từ GE</strong>.
              </RequirementItem>
              <RequirementItem theme={theme}>
                Tư vấn <strong>đúng – đủ – minh bạch</strong> về các quyền lợi.
              </RequirementItem>
              <RequirementItem theme={theme}>
                <strong>Không sử dụng giá</strong> như công cụ cạnh tranh không lành mạnh.
              </RequirementItem>
            </div>
          </div>

          <CalloutBox
            icon={<AlertTriangle size={18} />}
            variant="danger"
            theme={theme}
          >
            <p className="font-semibold">
              ⚠️ Mọi sai lệch về giá không chỉ ảnh hưởng cá nhân, mà trực tiếp làm <strong>suy giảm uy tín hệ thống</strong>.
            </p>
          </CalloutBox>
        </div>
      </PolicySection>

      {/* ═══════  FOOTER NOTE  ═══════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className={`text-center py-6 mt-2 rounded-2xl border ${
          isBlue
            ? 'bg-slate-50 border-slate-200 text-slate-400'
            : 'bg-white/[0.02] border-white/[0.06] text-white/30'
        }`}
      >
        <Users size={20} className="mx-auto mb-2 opacity-60" />
        <p className="text-xs font-medium leading-relaxed max-w-md mx-auto">
          Mọi thắc mắc vui lòng liên hệ <strong className={isBlue ? 'text-slate-600' : 'text-white/60'}>Agent Success Team</strong> hoặc <strong className={isBlue ? 'text-slate-600' : 'text-white/60'}>Growth Marketing Team</strong> — Galaxy Education.
        </p>
      </motion.div>
    </motion.div>
  );

  return (
    <Layout
      theme={theme}
      onToggleTheme={() => setTheme(t => (t === 'blue' ? 'dark' : 'blue'))}
      heroContent={heroContent}
      bodyContent={bodyContent}
      footerText={settings.footerText}
      footerLinks={settings.footerLinks}
      headerTagline={settings.headerTagline}
      headerCtaText={settings.headerCtaText}
      headerCtaUrl={settings.headerCtaUrl}
    />
  );
}
