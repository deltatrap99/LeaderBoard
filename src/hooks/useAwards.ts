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
  period: string;         // "Tháng 03 Năm 2026"
  category: 'month' | 'quarter' | 'semester';
  mechanism: string;      // Cơ chế thưởng (mô tả)
  columns: string[];      // Header cột bảng
  tiers: AwardTier[];     // Các mức giải
  footnote?: string;      // Ghi chú cuối
  order?: number;         // Thứ tự hiển thị
}

// Default awards data from reference images
const DEFAULT_AWARDS: Award[] = [
  {
    id: 'dai-su-moi-t03',
    title: 'Thưởng Đại sứ Mới',
    period: 'Tháng 03 Năm 2026',
    category: 'month',
    mechanism: 'Thưởng Đại sứ mới lần đầu phát sinh doanh số, ghi nhận nỗ lực triển khai tuyển sinh trong giai đoạn đầu tham gia cộng đồng và đạt khởi đầu tích cực với doanh số tổng tháng từ 3 triệu trở lên.\n\nDoanh số xét thưởng là doanh số tổng của tháng đầu tiên Đại sứ phát sinh doanh số.',
    columns: ['Doanh số xét thưởng', 'Số lượng giải thưởng', 'Giá trị giải thưởng'],
    tiers: [
      { label: '>= 3,000,000', condition: '>= 3,000,000', quantity: '10', prizeValue: '39,000', cellValues: ['>= 3,000,000', '10', '39,000'] },
      { label: '>= 10,000,000', condition: '>= 10,000,000', quantity: '5', prizeValue: '99,000', cellValues: ['>= 10,000,000', '5', '99,000'] },
      { label: '>= 30,000,000', condition: '>= 30,000,000', quantity: '5', prizeValue: '199,000', cellValues: ['>= 30,000,000', '5', '199,000'] },
      { label: '>= 50,000,000', condition: '>= 50,000,000', quantity: '3', prizeValue: '299,000', cellValues: ['>= 50,000,000', '3', '299,000'] },
    ],
    order: 1,
  },
  {
    id: 'ds-gd-xuat-sac-t03',
    title: 'Thưởng Đại sứ Giáo dục Xuất sắc',
    period: 'Tháng 03 Năm 2026',
    category: 'month',
    mechanism: 'Thưởng Đại sứ đạt Top doanh số cá nhân, nhằm tôn vinh thành tích nổi bật và đóng góp tích cực trong hoạt động triển khai bán hàng.',
    columns: ['Giải', 'Doanh số', 'Số lượng giải', 'Giá trị giải thưởng'],
    tiers: [
      { label: 'Top 1', condition: '>= 200,000,000', quantity: '01', prizeValue: '1,000,000', cellValues: ['Top 1', '>= 200,000,000', '01', '1,000,000'] },
      { label: 'Top 2', condition: '>= 150,000,000', quantity: '01', prizeValue: '800,000', cellValues: ['Top 2', '>= 150,000,000', '01', '800,000'] },
      { label: 'Top 3', condition: '>= 100,000,000', quantity: '01', prizeValue: '500,000', cellValues: ['Top 3', '>= 100,000,000', '01', '500,000'] },
    ],
    order: 2,
  },
  {
    id: 'ql-tuyen-dung-t03',
    title: 'Thưởng Quản lý Tuyển dụng Xuất sắc',
    period: 'Tháng 03 Năm 2026',
    category: 'month',
    mechanism: 'Thưởng ghi nhận Đại sứ tuyển dụng hiệu quả, đóng góp vào tăng trưởng đội ngũ.\n\nĐiều kiện active của Đại sứ mới: tuyển sinh thành công (phát sinh đơn hàng thành công) tối thiểu 1 khoá học chính (không bao gồm các sản phẩm, khoá học VAS/ dẫn nhập, ví dụ như: English Adventure with Milo, IELTS self-learn course, Sách,...)',
    columns: ['Giải', 'SL Đại sứ mới Active', 'Tổng DS Đại sứ mới Active', 'Số lượng giải', 'Giá trị giải thưởng'],
    tiers: [
      { label: 'Top 1', condition: '>= 5', condition2: '>= 30,000,000', quantity: '01', prizeValue: '500,000', cellValues: ['Top 1', '>= 5', '>= 30,000,000', '01', '500,000'] },
    ],
    order: 3,
  },
  {
    id: 'ds-gd-xuat-sac-q1',
    title: 'Thưởng Đại sứ Giáo dục Xuất sắc',
    period: 'Quý I Năm 2026',
    category: 'quarter',
    mechanism: 'Thưởng ghi nhận nỗ lực tuyển sinh của Đại sứ, dựa trên số lượng học viên tuyển sinh mới.\n\n* Học viên mới: Học viên đăng ký các chương trình học chính (không bao gồm các sản phẩm, khoá học VAS/ dẫn nhập, ví dụ như: English Adventure with Milo, IELTS self-learn course, Sách,...)\n* Các giải thưởng Top 1 - Top 2 - Top 3: Xét trao thưởng cho cá nhân đạt điều kiện chính cao nhất và thoả mãn mọi điều kiện khác.',
    columns: ['Giải', 'Chỉ tiêu SL Học viên mới', 'Giá trị giải thưởng', 'Điều kiện ràng buộc Doanh số', 'Số lượng giải'],
    tiers: [
      { label: 'Top 1', condition: '>= 45', condition2: '>= 200 triệu đồng', quantity: '01', prizeValue: '1,500,000', cellValues: ['Top 1', '>= 45', '1,500,000', '>= 200 triệu đồng', '01'] },
      { label: 'Top 2', condition: '>= 30', condition2: '>= 200 triệu đồng', quantity: '01', prizeValue: '1,000,000', cellValues: ['Top 2', '>= 30', '1,000,000', '>= 200 triệu đồng', '01'] },
      { label: 'Top 3', condition: '>= 15', condition2: '>= 200 triệu đồng', quantity: '01', prizeValue: '800,000', cellValues: ['Top 3', '>= 15', '800,000', '>= 200 triệu đồng', '01'] },
      { label: '⭐ EGC', condition: '>= 15', condition2: '>= 150 triệu đồng', quantity: '30', prizeValue: '500,000', cellValues: ['⭐ EGC', '>= 15', '500,000', '>= 150 triệu đồng', '30'] },
    ],
    footnote: '* Elite Galaxy Circle (sau đây viết tắt là: EGC) là vòng tròn danh giá quy tụ những Đại sứ Giáo dục đạt thành tích tuyển sinh xuất sắc, với tinh thần bền bỉ và nỗ lực vượt trội trong hành trình lan tỏa tri thức – Kiến tạo tương lai.',
    order: 4,
  },
  {
    id: 'ds-gd-xuat-sac-k1',
    title: 'Thưởng Đại sứ Giáo dục Xuất sắc',
    period: 'Kỳ I Năm 2026 (Từ 1/1 đến 30/6)',
    category: 'semester',
    mechanism: 'Thưởng Đại sứ đạt Top doanh số cá nhân, nhằm tôn vinh thành tích nổi bật và đóng góp tích cực trong hoạt động triển khai bán hàng.\n\n- Doanh số và thành tích tuyển sinh phát sinh trong kỳ xét giải.',
    columns: ['Giải', 'Số lượng giải', 'Doanh số cá nhân', 'Giá trị giải thưởng'],
    tiers: [
      { label: 'Top 1 – 3', condition: '3', condition2: '>= 800,000,000', quantity: '3', prizeValue: '100% chuyến du lịch quốc tế', cellValues: ['Top 1 – 3', '3', '>= 800,000,000', '100% chuyến du lịch quốc tế'] },
      { label: 'Top 4 – 8', condition: '5', condition2: '>= 500,000,000', quantity: '5', prizeValue: '50% chuyến du lịch quốc tế', cellValues: ['Top 4 – 8', '5', '>= 500,000,000', '50% chuyến du lịch quốc tế'] },
    ],
    order: 5,
  },
  {
    id: 'ql-xuat-sac-k1',
    title: 'Thưởng Quản lý Xuất sắc',
    period: 'Kỳ I Năm 2026 (Từ 1/1 đến 30/6)',
    category: 'semester',
    mechanism: 'Thưởng ghi nhận đội ngũ tiên phong, dám cam kết và xuất sắc đạt các mốc thử thách doanh số 10 tỷ – 20 tỷ.\n\n- Doanh số và thành tích tuyển sinh phát sinh trong kỳ xét giải.',
    columns: ['Doanh số đội ngũ', 'Số lượng giải', 'Giá trị giải thưởng', 'ĐS mới Active trong đội ngũ', 'Điều kiện cần'],
    tiers: [
      { label: '>= 10 tỷ', condition: '5', condition2: '>= 40', quantity: '5', prizeValue: '50% chuyến du lịch quốc tế', extraCondition: 'Chấp nhận và xuất sắc vượt qua thử thách', cellValues: ['>= 10 tỷ', '5', '50% chuyến du lịch quốc tế', '>= 40', 'Chấp nhận và xuất sắc vượt qua thử thách'] },
      { label: '>= 20 tỷ', condition: '2', condition2: '>= 80', quantity: '2', prizeValue: '100% chuyến du lịch quốc tế', extraCondition: 'Chấp nhận và xuất sắc vượt qua thử thách', cellValues: ['>= 20 tỷ', '2', '100% chuyến du lịch quốc tế', '>= 80', 'Chấp nhận và xuất sắc vượt qua thử thách'] },
    ],
    order: 6,
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
