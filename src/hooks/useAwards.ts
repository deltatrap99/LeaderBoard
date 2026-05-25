import { useState, useEffect } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';

export interface AwardTier {
  label: string;         // "Top 1", ">= 3,000,000", etc.
  condition: string;     // Doanh số / Số lượng HV mới
  condition2?: string;   // Điều kiện bổ sung (doanh số đi kèm)
  quantity: string;      // Số lượng giải
  prizeValue: string;    // Giá trị giải thưởng
  extraCondition?: string; // Điều kiện ràng buộc
  cellValues?: string[]; // Giá trị cell theo thứ tự cột (ưu tiên dùng khi render)
}

export interface Award {
  id?: string;
  title: string;          // "Thưởng Đại sứ Mới"
  period: string;         // "Tháng 05 Năm 2026"
  category: 'month' | 'quarter' | 'semester';
  mechanism: string;      // Cơ chế thưởng (mô tả)
  columns: string[];      // Header cột bảng
  tiers: AwardTier[];     // Các mức giải
  footnote?: string;      // Ghi chú cuối
  order?: number;         // Thứ tự hiển thị
}

// Default awards data from "Diễn giải Tháng 5" sheet
const DEFAULT_AWARDS: Award[] = [
  // ============================================================
  // I. Chương trình Thưởng tháng 05
  // ============================================================
  {
    id: 'dai-su-moi-t05',
    title: 'Thưởng Đại sứ Mới',
    period: 'Tháng 05 Năm 2026',
    category: 'month',
    mechanism: 'Thưởng Đại sứ mới lần đầu phát sinh doanh số, ghi nhận nỗ lực triển khai bán hàng trong giai đoạn đầu tham gia cộng đồng và đạt khởi đầu tích cực với doanh số tổng tháng từ 3 triệu trở lên.\n\nDoanh số xét thưởng là doanh số tổng của tháng đầu tiên Đại sứ phát sinh doanh số.',
    columns: ['Tháng đầu tiên phát sinh doanh số đạt từ', 'Giá trị giải thưởng', 'Số lượng giải'],
    tiers: [
      { label: '>= 10,000,000', condition: '>= 10,000,000', quantity: '10', prizeValue: '99,000', cellValues: ['10.000.000 đ', '99.000 đ', '10'] },
      { label: '>= 30,000,000', condition: '>= 30,000,000', quantity: '10', prizeValue: '199,000', cellValues: ['30.000.000 đ', '199.000 đ', '10'] },
      { label: '>= 50,000,000', condition: '>= 50,000,000', quantity: '10', prizeValue: '299,000', cellValues: ['50.000.000 đ', '299.000 đ', '10'] },
    ],
    order: 1,
  },
  {
    id: 'ds-gd-xuat-sac-t05',
    title: 'Thưởng Đại sứ Giáo dục Xuất sắc',
    period: 'Tháng 05 Năm 2026',
    category: 'month',
    mechanism: 'Thưởng Đại sứ đạt Top doanh số cá nhân, nhằm tôn vinh thành tích nổi bật và đóng góp tích cực trong hoạt động triển khai bán hàng.',
    columns: ['Giải', 'Doanh số >=', 'Số lượng giải', 'Giá trị giải thưởng'],
    tiers: [
      { label: 'Top 1', condition: '>= 200,000,000', quantity: '1', prizeValue: '1,000,000', cellValues: ['Top 1', '200.000.000 đ', '1', '1.000.000 đ'] },
      { label: 'Top 2', condition: '>= 150,000,000', quantity: '1', prizeValue: '800,000', cellValues: ['Top 2', '150.000.000 đ', '1', '800.000 đ'] },
      { label: 'Top 3', condition: '>= 100,000,000', quantity: '1', prizeValue: '500,000', cellValues: ['Top 3', '100.000.000 đ', '1', '500.000 đ'] },
    ],
    order: 2,
  },
  {
    id: 'ql-tuyen-dung-t05',
    title: 'Thưởng Quản lý Tuyển dụng Xuất sắc',
    period: 'Tháng 05 Năm 2026',
    category: 'month',
    mechanism: 'Thưởng ghi nhận Đại sứ tuyển dụng hiệu quả, đóng góp vào tăng trưởng đội ngũ.\n\n- Đại sứ active có học viên đăng kí ít nhất 1 khóa học chính',
    columns: ['Giải', 'Số lượng Đại sứ mới active', 'Tổng doanh số Đại sứ mới active', 'Số lượng giải', 'Giá trị giải thưởng'],
    tiers: [
      { label: 'Top 1', condition: '>= 5', condition2: '>= 30,000,000đ', quantity: '1', prizeValue: '500,000', cellValues: ['Top 1', '>= 5', '>= 30.000.000đ', '1', '500.000 đ'] },
    ],
    order: 3,
  },
  {
    id: 'ql-tieu-bieu-t05',
    title: 'Thưởng Quản lý Tiêu biểu',
    period: 'Tháng 05 Năm 2026',
    category: 'month',
    mechanism: 'Điều kiện đề cử & Xét giải:\n- Hoàn thành từ 100% mục tiêu cam kết theo cấp bậc\n- Thể hiện dấu ấn và ảnh hưởng tích cực trong đội ngũ và trong hệ thống Đại sứ Giáo dục Galaxy Education\n- Là tấm gương tiêu biểu của tinh thần sáng tạo, đột phá, tích cực và lan tỏa giá trị giáo dục\n- Đại sứ active có học viên đăng kí ít nhất 1 khóa học chính\n- **Điều kiện đủ**: Thông qua đề xuất/ bình chọn/ xét duyệt dựa trên các yếu tố biểu dương khác.',
    columns: ['Quản lý', 'Thực đạt mục tiêu cam kết', 'Đại sứ mới active trong đội ngũ', 'Số lượng giải', 'Giá trị giải thưởng'],
    tiers: [
      { label: 'Cấp Nhóm', condition: '>= 100%', condition2: '>= 5', quantity: '1', prizeValue: '500,000', cellValues: ['Cấp Nhóm', '>= 100%', '>= 5', '1', '500.000 đ'] },
      { label: 'Cấp Phòng', condition: '>= 100%', condition2: '>= 10', quantity: '1', prizeValue: '800,000', cellValues: ['Cấp Phòng', '>= 100%', '>= 10', '1', '800.000 đ'] },
      { label: 'Cấp Khu vực', condition: '>= 100%', condition2: '>= 15', quantity: '1', prizeValue: '1,000,000', cellValues: ['Cấp Khu vực', '>= 100%', '>= 15', '1', '1.000.000 đ'] },
    ],
    order: 4,
  },
  {
    id: 'thuong-but-pha-vuot-gioi-han-t05',
    title: 'Thưởng bứt phá vượt giới hạn',
    period: 'Tháng 05 Năm 2026',
    category: 'month',
    mechanism: 'Đối tượng: Toàn bộ Đại sứ phát sinh doanh số ICANCONNECT trong thời gian diễn ra chương trình\nThời gian áp dụng: 16/5 - 22/5\n\n* Việc khấu trừ thuế thu nhập cá nhân của các khoản thưởng đều tuân thủ theo quy định của nhà nước.',
    columns: ['Mốc doanh thu hợp lệ', 'Điều kiện lead học thử', 'Mức thưởng', 'Số lượng giải'],
    tiers: [
      { label: '10.000.000', condition: '10.000.000', condition2: '3', quantity: '30', prizeValue: '68.000', cellValues: ['10.000.000', '3', '68.000 đ', '30'] },
      { label: '20.000.000', condition: '20.000.000', condition2: '5', quantity: '20', prizeValue: '139.000', cellValues: ['20.000.000', '5', '139.000 đ', '20'] },
      { label: '30.000.000', condition: '30.000.000', condition2: '5', quantity: '20', prizeValue: '168.000', cellValues: ['30.000.000', '5', '168.000 đ', '20'] },
      { label: '50.000.000', condition: '50.000.000', condition2: '10', quantity: '20', prizeValue: '268.000', cellValues: ['50.000.000', '10', '268.000 đ', '20'] },
      { label: '80.000.000', condition: '80.000.000', condition2: '10', quantity: '8', prizeValue: '368.000', cellValues: ['80.000.000', '10', '368.000 đ', '8'] },
      { label: '120.000.000', condition: '120.000.000', condition2: '10', quantity: '5', prizeValue: '500.000', cellValues: ['120.000.000', '10', '500.000 đ', '5'] },
    ],
    order: 4.5,
  },

  // ============================================================
  // II. Thưởng Quý II/2026
  // ============================================================
  {
    id: 'ds-gd-xuat-sac-q2',
    title: 'Thưởng Đại sứ Giáo dục Xuất sắc',
    period: 'Quý II Năm 2026',
    category: 'quarter',
    mechanism: 'Thưởng ghi nhận nỗ lực tuyển sinh của Đại sứ, dựa trên số lượng học sinh tuyển sinh mới;\n\nHọc sinh mới: học sinh đăng ký các khóa học theo hình thức học liveclass;\nCác giải thưởng Top 1 - Top 2 - Top 3: Xét trao thưởng cho cá nhân đạt điều kiện chính cao nhất và thoả mãn mọi điều kiện khác;',
    columns: ['Giải', 'Chỉ tiêu số lượng học sinh mới', 'Số lượng giải', 'Giá trị giải thưởng', '', 'Điều kiện ràng buộc doanh số'],
    tiers: [
      { label: 'Top 1', condition: '>= 55', quantity: '1', prizeValue: '1,500,000', cellValues: ['Top 1', '>= 55', '1', '1.500.000 đ', 'Suất tham dự GEA', '>= 250 triệu đồng'] },
      { label: 'Top 2', condition: '>= 40', quantity: '1', prizeValue: '1,000,000', cellValues: ['Top 2', '>= 40', '1', '1.000.000 đ', 'Suất tham dự GEA', '>= 250 triệu đồng'] },
      { label: 'Top 3', condition: '>= 25', quantity: '1', prizeValue: '800,000', cellValues: ['Top 3', '>= 25', '1', '800.000 đ', 'Suất tham dự GEA', '>= 250 triệu đồng'] },
    ],
    footnote: '* Elite Galaxy Circle (sau đây viết tắt là: EGC) là vòng tròn danh giá quy tụ những Đại sứ Giáo dục đạt thành tích tuyển sinh xuất sắc, với tinh thần bền bỉ và nỗ lực vượt trội trong hành trình lan tỏa tri thức – Kiến tạo tương lai.',
    order: 5,
  },
  {
    id: 'egc-vang-q2',
    title: 'Giải thưởng EGC - Đại sứ Vàng',
    period: 'Quý II Năm 2026',
    category: 'quarter',
    mechanism: 'Elite Galaxy Circle (EGC) là vòng tròn danh giá quy tụ những Đại sứ Giáo dục đạt thành tích tuyển sinh xuất sắc, với tinh thần bền bỉ và nỗ lực vượt trội trong hành trình lan tỏa tri thức – Kiến tạo tương lai.',
    columns: ['Giải', 'Chỉ tiêu số lượng học sinh mới', 'Số lượng giải', 'Giá trị giải thưởng', '', 'Điều kiện ràng buộc doanh số'],
    tiers: [
      { label: '⭐ EGC', condition: '>= 25', quantity: '30', prizeValue: '500,000', cellValues: ['⭐ EGC', '>= 25', '30', '500.000 đ', 'Suất tham dự GEA', '>= 200 triệu đồng'] },
    ],
    order: 6,
  },
  {
    id: 'ql-moi-thang-cap-q2',
    title: 'Thưởng Quản lý Mới thăng cấp',
    period: 'Quý II Năm 2026',
    category: 'quarter',
    mechanism: 'Thưởng ghi nhận nỗ lực vượt mục tiêu cấp bậc, xuất sắc Thăng cấp lên các cấp bậc tiếp theo của Đại sứ.',
    columns: ['Đại sứ thăng cấp', '', 'Phần thưởng thăng cấp', ''],
    tiers: [
      { label: 'Trưởng nhóm', condition: 'Chứng nhận', quantity: '', prizeValue: '300,000', cellValues: ['Trưởng nhóm', 'Chứng nhận', 'Suất tham dự GEA', '300.000 đ'] },
      { label: 'Trưởng nhóm cấp cao', condition: 'Chứng nhận', quantity: '', prizeValue: '500,000', cellValues: ['Trưởng nhóm cấp cao', 'Chứng nhận', 'Suất tham dự GEA', '500.000 đ'] },
      { label: 'Trưởng phòng', condition: 'Chứng nhận', quantity: '', prizeValue: '1,000,000', cellValues: ['Trưởng phòng', 'Chứng nhận', 'Suất tham dự GEA', '1.000.000 đ'] },
      { label: 'Trưởng phòng cấp cao', condition: 'Chứng nhận', quantity: '', prizeValue: '1,000,000', cellValues: ['Trưởng phòng cấp cao', 'Chứng nhận', 'Suất tham dự GEA', '1.000.000 đ'] },
      { label: 'Giám đốc khu vực', condition: 'Chứng nhận', quantity: '', prizeValue: '1,000,000', cellValues: ['Giám đốc khu vực', 'Chứng nhận', 'Suất tham dự GEA', '1.000.000 đ'] },
      { label: 'Giám đốc khu vực cấp cao', condition: 'Chứng nhận', quantity: '', prizeValue: '1,000,000', cellValues: ['Giám đốc khu vực cấp cao', 'Chứng nhận', 'Suất tham dự GEA', '1.000.000 đ'] },
      { label: 'Giám đốc Vùng', condition: 'Chứng nhận', quantity: '', prizeValue: '1,000,000', cellValues: ['Giám đốc Vùng', 'Chứng nhận', 'Suất tham dự GEA', '1.000.000 đ'] },
    ],
    order: 7,
  },
  {
    id: 'ql-tuyen-dung-q2',
    title: 'Thưởng Quản lý Tuyển dụng Xuất sắc',
    period: 'Quý II Năm 2026',
    category: 'quarter',
    mechanism: 'Thưởng ghi nhận Đại sứ tuyển dụng hiệu quả, đóng góp vào tăng trưởng đội ngũ.\n\nĐại sứ active có học viên liveclass.',
    columns: ['Giải', 'Số lượng Đại sứ mới active', 'Tổng doanh số Đại sứ mới active', 'Số lượng giải', 'Giá trị giải thưởng'],
    tiers: [
      { label: 'Top 1', condition: '>= 15', condition2: '>= 100,000,000đ', quantity: '1', prizeValue: '1,000,000', cellValues: ['Top 1', '>= 15', '>= 100.000.000đ', '1', '1.000.000 đ'] },
    ],
    order: 8,
  },
  {
    id: 'ql-tieu-bieu-q2',
    title: 'Thưởng Quản lý Tiêu biểu',
    period: 'Quý II Năm 2026',
    category: 'quarter',
    mechanism: 'Điều kiện đề cử & Xét giải:\n- Hoàn thành từ 100% mục tiêu cam kết theo cấp bậc\n- Thể hiện dấu ấn và ảnh hưởng tích cực trong đội ngũ và trong hệ thống Đại sứ Giáo dục Galaxy Education\n- Là tấm gương tiêu biểu của tinh thần sáng tạo, đột phá, tích cực và lan tỏa giá trị giáo dục\n- Đại sứ active có học viên đăng kí ít nhất 1 khóa học chính\n- **Điều kiện đủ**: Thông qua đề xuất/ bình chọn/ xét duyệt dựa trên các yếu tố biểu dương khác.',
    columns: ['Quản lý', 'Thực đạt mục tiêu cam kết', 'Đại sứ mới active trong đội ngũ', 'Giá trị giải thưởng'],
    tiers: [
      { label: 'Cấp Nhóm', condition: '>= 100%', condition2: '>= 10', quantity: '1', prizeValue: '500,000', cellValues: ['Cấp Nhóm', '>= 100%', '>= 10', '500.000 đ'] },
      { label: 'Cấp Phòng', condition: '>= 100%', condition2: '>= 20', quantity: '1', prizeValue: '1,000,000', cellValues: ['Cấp Phòng', '>= 100%', '>= 20', '1.000.000 đ'] },
      { label: 'Cấp Khu vực', condition: '>= 100%', condition2: '>= 30', quantity: '1', prizeValue: '2,000,000', cellValues: ['Cấp Khu vực', '>= 100%', '>= 30', '2.000.000 đ'] },
    ],
    order: 9,
  },

  // ============================================================
  // III. Chương trình Thưởng Kỳ (H1)
  // ============================================================
  {
    id: 'ds-gd-xuat-sac-k1',
    title: 'Thưởng Đại sứ Giáo dục Xuất sắc',
    period: 'Kỳ I Năm 2026 (Từ 1/1 đến 30/6)',
    category: 'semester',
    mechanism: 'Thưởng Đại sứ đạt Top doanh số cá nhân, nhằm tôn vinh thành tích nổi bật và đóng góp tích cực trong hoạt động triển khai bán hàng.\n\n- Doanh số và thành tích tuyển sinh phát sinh trong kỳ xét giải.',
    columns: ['Giải', 'Số lượng giải', 'Doanh số cá nhân >=', 'Giá trị giải thưởng'],
    tiers: [
      { label: 'Top 1 - 3', condition: '3', condition2: '>= 800,000,000', quantity: '3', prizeValue: '100% chuyến du lịch quốc tế', cellValues: ['Top 1 - 3', '3', '800.000.000 đ', '100% chuyến du lịch quốc tế'] },
      { label: 'Top 4 - Top 8', condition: '5', condition2: '>= 500,000,000', quantity: '5', prizeValue: '50% chuyến du lịch quốc tế', cellValues: ['Top 4 - Top 8', '5', '500.000.000 đ', '50% chuyến du lịch quốc tế'] },
    ],
    order: 10,
  },
  {
    id: 'ql-xuat-sac-k1',
    title: 'Thưởng Quản lý Xuất sắc',
    period: 'Kỳ I Năm 2026 (Từ 1/1 đến 30/6)',
    category: 'semester',
    mechanism: 'Thưởng ghi nhận đội ngũ tiên phong, dám cam kết và xuất sắc đạt các mốc thử thách doanh số 10 tỷ – 20 tỷ.\n\n- Doanh số và thành tích tuyển sinh phát sinh trong kỳ xét giải.\n- **Điều kiện cần**: Chấp nhận và xuất sắc vượt qua thử thách.',
    columns: ['Doanh số đội ngũ >=', 'Số lượng giải', 'Đại sứ mới active trong đội ngũ', 'Giá trị giải thưởng'],
    tiers: [
      { label: '>= 10 tỷ', condition: '5', condition2: '>= 40', quantity: '5', prizeValue: '50% chuyến du lịch quốc tế', cellValues: ['10 tỷ', '5', '>= 40', '50% chuyến du lịch quốc tế'] },
      { label: '>= 20 tỷ', condition: '3', condition2: '>= 80', quantity: '3', prizeValue: '100% chuyến du lịch quốc tế', cellValues: ['20 tỷ', '3', '>= 80', '100% chuyến du lịch quốc tế'] },
    ],
    order: 11,
  },
];

export function useAwards() {
  const [awards, setAwards] = useState<Award[]>(DEFAULT_AWARDS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      setLoaded(true);
      return;
    }

    const q = query(collection(db, 'awards'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Award[];
          setAwards(data);
        }
        setLoaded(true);
      },
      () => {
        setLoaded(true);
      }
    );
    return () => unsubscribe();
  }, []);

  return { awards, loaded, DEFAULT_AWARDS };
}
