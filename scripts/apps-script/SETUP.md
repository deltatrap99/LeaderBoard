# Hướng dẫn Deploy Apps Script & Cấu hình

## Bước 1: Tạo Apps Script Project

1. Mở Google Sheet: https://docs.google.com/spreadsheets/d/1LktWs8p4xbTToJJaEu2y6RBwj5W26daoVFKiKMNHhJs
2. Vào **Extensions → Apps Script**
3. Xóa nội dung mặc định trong `Code.gs`
4. Copy toàn bộ nội dung từ 3 file trong thư mục `scripts/apps-script/`:
   - `Code.gs` → paste vào file `Code.gs` trong Apps Script
   - `Leaderboard.gs` → tạo file mới tên `Leaderboard.gs`, paste vào
   - `Results.gs` → tạo file mới tên `Results.gs`, paste vào

## Bước 2: Deploy Web App

1. Trong Apps Script, click **Deploy → New deployment**
2. Chọn **Type: Web app**
3. Settings:
   - **Description**: `Leaderboard JSON API`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
4. Click **Deploy**
5. **Copy URL** của Web App (dạng: `https://script.google.com/macros/s/AKfycb.../exec`)

## Bước 3: Test API

Mở trình duyệt và truy cập:
- Leaderboard: `<URL>?action=leaderboard`
- Results: `<URL>?action=results`

Kiểm tra xem JSON trả về có đúng format không.

## Bước 4: Cấu hình Vercel

1. Vào Vercel Dashboard → Project `leader-board` → Settings → Environment Variables
2. Thêm biến:
   - **Key**: `APPS_SCRIPT_URL`
   - **Value**: URL Web App từ Bước 2
3. Redeploy project

## Bước 5: Cấu hình Local (.env.local)

Thêm dòng sau vào file `.env.local`:

```
APPS_SCRIPT_URL=<URL từ Bước 2>
VITE_APPS_SCRIPT_URL=<URL từ Bước 2>
```

## Bước 6: Cài lại dependencies

```bash
npm install
```

## Bước 7: Test local

```bash
npm run dev
```

Kiểm tra:
- Trang chủ hiển thị bảng xếp hạng
- Tab Tháng/Quý/Kỳ đều có dữ liệu
- Trang Results hiển thị kết quả

## Lưu ý

- Apps Script có giới hạn 6 phút/lần chạy — parse Sheet thường chỉ mất 5-10 giây
- Vercel cache 5 phút tại CDN → giảm tải cho Apps Script
- Nếu cập nhật dữ liệu Sheet, chờ tối đa 5 phút để cache hết hạn
- Khi cần deploy lại Apps Script, vào **Deploy → Manage deployments → Edit → Version: New version**
