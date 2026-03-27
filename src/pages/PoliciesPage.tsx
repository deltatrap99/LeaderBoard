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
        title="Nguyên tắc ghi nhận quyền khai thác khách hàng"
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
            <p className="font-semibold mb-1">Căn cứ xác định dấu thời gian khách hàng</p>
            <p>
              Khách hàng được hỗ trợ bởi Đại sứ được xác định dựa vào thông tin và dấu thời gian đăng ký trên <strong>Landing page có gắn Mã Đại sứ / Mã đối tác</strong> của anh chị.
            </p>
          </CalloutBox>

          <CalloutBox
            icon={<AlertTriangle size={18} />}
            variant="danger"
            theme={theme}
          >
            <p className="font-semibold">
              ⚠️ Đây là cơ sở <strong>DUY NHẤT</strong> để ghi nhận khách hàng của Đại sứ, bất kỳ hình thức ghi nhận nào khác đều <strong>không có giá trị</strong>.
            </p>
          </CalloutBox>
        </div>
      </PolicySection>

      {/* ═══════  SECTION 2  ═══════ */}
      <PolicySection
        icon={<Scale className="w-5 h-5 text-white" />}
        number="02"
        title="Quy tắc xác định quyền ưu tiên chăm sóc khách hàng"
        theme={theme}
        delay={0.1}
        accentColor="#7c3aed"
      >
        <div className="space-y-5">
          {/* Trùng trước khi đóng học phí */}
          <div className={`rounded-2xl p-5 ${isBlue ? 'bg-amber-50/50 border border-amber-100' : 'bg-amber-950/20 border border-amber-500/10'}`}>
            <SubHeading theme={theme}>
              <Clock size={15} className={isBlue ? 'text-amber-600' : 'text-amber-400'} />
              Trường hợp khách hàng trùng TRƯỚC khi đóng học phí
            </SubHeading>
            <div className="space-y-3">
              <BulletItem icon={<ArrowRight size={14} />} theme={theme}>
                Khách hàng hệ thống làm việc của <strong>kênh bán nào trước</strong> thì kênh đó được <strong>ưu tiên chăm sóc tiếp</strong>.
              </BulletItem>
              <BulletItem icon={<ArrowRight size={14} />} theme={theme}>
                Thời gian tối đa thuộc quyền ưu tiên chăm sóc khách hàng là <strong>30 ngày</strong> kể từ thời điểm vào kho dữ liệu.
              </BulletItem>
              <BulletItem icon={<ArrowRight size={14} />} theme={theme}>
                Sau 30 ngày nếu khách hàng vẫn chưa đóng học phí, các bên khác được quyền chăm sóc tự do và <strong>thiết lập lại vòng lặp 30 ngày</strong> chăm sóc tiếp theo.
              </BulletItem>
            </div>
          </div>

          <SectionDivider theme={theme} />

          {/* Trùng sau khi đóng học phí */}
          <div className={`rounded-2xl p-5 ${isBlue ? 'bg-blue-50/50 border border-blue-100' : 'bg-blue-950/20 border border-blue-500/10'}`}>
            <SubHeading theme={theme}>
              <CheckCircle2 size={15} className={isBlue ? 'text-blue-600' : 'text-blue-400'} />
              Trường hợp khách hàng trùng SAU khi đóng học phí
            </SubHeading>
            <div className="space-y-3">
              <BulletItem icon={<ArrowRight size={14} />} theme={theme}>
                Nếu check trùng <strong>trong vòng 24 giờ</strong> kể từ thời điểm thanh toán thành công → việc xử lý được áp dụng theo <strong>nguyên tắc trùng trước khi thanh toán</strong>.
              </BulletItem>
              <BulletItem icon={<ArrowRight size={14} />} theme={theme}>
                Nếu check trùng <strong>sau 24 giờ</strong> → quyền lợi được xác định theo <strong>dữ liệu thanh toán</strong>: khách hàng thanh toán qua đường link hoặc số tài khoản gắn mã của bên nào thì bên đó được ghi nhận quyền lợi.
              </BulletItem>
            </div>
          </div>
        </div>
      </PolicySection>

      {/* ═══════  SECTION 3  ═══════ */}
      <PolicySection
        icon={<BadgeAlert className="w-5 h-5 text-white" />}
        number="03"
        title="Hành xử khi có dấu hiệu trùng / được thông báo trùng khai thác"
        theme={theme}
        delay={0.15}
        accentColor="#b45309"
      >
        <div className="space-y-5">
          <p className={`text-sm leading-relaxed ${isBlue ? 'text-slate-500' : 'text-white/50'}`}>
            Khi tư vấn, Đại sứ/Đối tác cần <strong className={isBlue ? 'text-slate-700' : 'text-white/80'}>chủ động xác minh</strong> thông tin khách hàng bằng các cách sau:
          </p>

          <div className={`rounded-2xl p-5 ${isBlue ? 'bg-amber-50/50 border border-amber-100' : 'bg-amber-950/20 border border-amber-500/10'}`}>
            <SubHeading theme={theme}>
              <BadgeAlert size={15} className={isBlue ? 'text-amber-600' : 'text-amber-400'} />
              Các cách xác minh thông tin khách hàng
            </SubHeading>
            <div className="space-y-3">
              <BulletItem icon={<ArrowRight size={14} />} theme={theme}>
                Trao đổi với khách hàng về <strong>lịch sử đã từng đăng ký, học tập hoặc tìm hiểu</strong> khóa học tại GE.
              </BulletItem>
              <BulletItem icon={<ArrowRight size={14} />} theme={theme}>
                Kiểm tra trạng thái contact tại mục <strong>Kho Contact trên hệ thống AMS</strong>.
              </BulletItem>
              <BulletItem icon={<ArrowRight size={14} />} theme={theme}>
                Khi lên đơn nếu hệ thống thông báo khách hàng <strong>đã có tài khoản hoặc đang bị khóa</strong>.
              </BulletItem>
            </div>
          </div>

          <CalloutBox
            icon={<AlertTriangle size={18} />}
            variant="warning"
            theme={theme}
          >
            <p>
              Nếu có <strong>ít nhất 1</strong> trong các dấu hiệu trên, Đối tác/Đại sứ <strong>lập tức báo về Support</strong> thực hiện kiểm tra trùng.
            </p>
          </CalloutBox>

          <CalloutBox
            icon={<Info size={18} />}
            variant="info"
            theme={theme}
          >
            <p>
              Khi phát sinh việc trùng khai thác: Support sẽ <strong>thông báo lại quyền ưu tiên khai thác tạm thời</strong> / doanh thu phát sinh nếu có ghi nhận về bên nào theo quy định chung.
            </p>
          </CalloutBox>
        </div>
      </PolicySection>

      {/* ═══════  SECTION 4  ═══════ */}
      <PolicySection
        icon={<Handshake className="w-5 h-5 text-white" />}
        number="04"
        title="Nguyên tắc ứng xử khi phát sinh trùng khai thác"
        theme={theme}
        delay={0.2}
        accentColor="#b91c1c"
      >
        <div className="space-y-5">
          {/* Thông điệp mẫu */}
          <div className={`rounded-2xl p-5 ${isBlue ? 'bg-emerald-50/50 border border-emerald-100' : 'bg-emerald-950/20 border border-emerald-500/10'}`}>
            <SubHeading theme={theme}>
              <CheckCircle2 size={15} className={isBlue ? 'text-emerald-600' : 'text-emerald-400'} />
              Thông điệp trao đổi đúng mực tới khách hàng
            </SubHeading>
            <div className={`rounded-xl p-4 italic text-sm leading-relaxed ${
              isBlue ? 'bg-white border border-emerald-200 text-slate-600' : 'bg-white/[0.03] border border-emerald-500/10 text-white/60'
            }`}>
              "Hiện tại trên hệ thống GE có nhiều kênh chăm sóc khách hàng. Theo dữ liệu kiểm tra, Anh/Chị đang được một kênh khác hỗ trợ. Bộ phận liên quan sẽ phối hợp để đảm bảo Anh/Chị được tiếp tục chăm sóc theo đúng quy trình. Các chính sách bán hàng của GE là thống nhất trên toàn hệ thống."
            </div>
          </div>

          <SectionDivider theme={theme} />

          {/* Hành vi bị cấm */}
          <div className={`rounded-2xl p-5 ${isBlue ? 'bg-red-50/50 border border-red-100' : 'bg-red-950/20 border border-red-500/10'}`}>
            <SubHeading theme={theme}>
              <FileWarning size={15} className={isBlue ? 'text-red-600' : 'text-red-400'} />
              Đại sứ / Đối tác KHÔNG thực hiện các hành vi sau
            </SubHeading>
            <div className="space-y-3">
              <ViolationItem theme={theme}>
                Cung cấp <strong>thông tin sai lệch hoặc tiêu cực</strong> về kênh khác.
              </ViolationItem>
              <ViolationItem theme={theme}>
                Tự ý <strong>điều chỉnh thông tin cá nhân</strong> của học viên nhằm thay đổi trạng thái ghi nhận trên hệ thống.
              </ViolationItem>
            </div>
          </div>

          <CalloutBox
            icon={<AlertTriangle size={18} />}
            variant="danger"
            theme={theme}
          >
            <p className="font-semibold mb-2">⚠️ Lưu ý quan trọng</p>
            <p>
              Đại sứ <strong>không tự ý thay đổi thông tin cá nhân</strong> của học viên khi lên đơn khi thấy có dấu hiệu trùng. Mọi hành vi chỉnh sửa thông tin của học viên đều được <strong>phát hiện sau đó bởi hệ thống/con người</strong> và khi phát hiện trùng (dù vô tình hay cố ý) đều được xem là <strong>vi phạm Quy định</strong> — quyền ưu tiên khai thác khách hàng mặc định thuộc về bên còn lại và có thể bị xử lý theo quy định đã ban hành.
            </p>
            <p className={`mt-2 font-semibold ${isBlue ? 'text-red-700' : 'text-red-300'}`}>
              👉 Điều này là bất lợi cho Đại sứ trong mọi đề xuất nếu có sau đó.
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
