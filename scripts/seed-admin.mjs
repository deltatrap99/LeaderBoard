/**
 * Firebase Seed Script
 * Chạy 1 lần để tạo tài khoản Super Admin và initial site settings.
 * 
 * Cách dùng: node scripts/seed-admin.mjs
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBWpM1V8fMkueJ69o8aqYjQxzccxz3J0_A",
  authDomain: "leader-board-b12a7.firebaseapp.com",
  projectId: "leader-board-b12a7",
  storageBucket: "leader-board-b12a7.firebasestorage.app",
  messagingSenderId: "10426315676",
  appId: "1:10426315676:web:c1d0a5c81c5b1cd7f3ce59",
};

const SUPER_ADMIN_EMAIL = 'tuanbq@hocmai.vn';
const SUPER_ADMIN_PASSWORD = 'Galaxy@2026';

async function seed() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  console.log('🔑 Đang tạo tài khoản Super Admin...');
  
  try {
    const cred = await createUserWithEmailAndPassword(auth, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD);
    
    await setDoc(doc(db, 'users', cred.user.uid), {
      email: SUPER_ADMIN_EMAIL,
      displayName: 'Tuấn BQ',
      role: 'superadmin',
      createdAt: serverTimestamp(),
    });
    console.log('✅ Super Admin tạo thành công:', SUPER_ADMIN_EMAIL);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      console.log('ℹ️  Super Admin đã tồn tại:', SUPER_ADMIN_EMAIL);
    } else {
      console.error('❌ Lỗi tạo Super Admin:', err.message);
    }
  }

  console.log('\n📝 Đang tạo site settings mặc định...');
  
  try {
    await setDoc(doc(db, 'siteSettings', 'main'), {
      heroTitle: 'Vinh danh Đại sứ Giáo dục',
      heroTitleHighlight: 'Galaxy Education',
      heroSubtitle: '"Đây không chỉ là những cái tên dẫn đầu thành tích, đây là những tấm gương truyền cảm hứng sự nỗ lực không ngừng trên hành trình lan tỏa những giải pháp giáo dục chất lượng cao đến Phụ huynh và Học sinh trên mọi miền đất nước."',
      badgeText: 'Galaxy Elite Awards 2026',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1LktWs8p4xbTToJJaEu2y6RBwj5W26daoVFKiKMNHhJs/export?format=xlsx',
      footerText: '© 2026 Galaxy Education. Galaxy Elite Awards — Chương trình Vinh danh Đại sứ Giáo dục.',
      tabLabels: { month: 'Tháng', quarter: 'Quý', semester: 'Kỳ', challenge: 'Challenge' },
      updatedAt: serverTimestamp(),
    });
    console.log('✅ Site settings tạo thành công!');
  } catch (err) {
    console.error('❌ Lỗi tạo site settings:', err.message);
  }

  console.log('\n🎉 Seed hoàn tất!');
  console.log(`\n📋 Thông tin đăng nhập:`);
  console.log(`   Email: ${SUPER_ADMIN_EMAIL}`);
  console.log(`   Password: ${SUPER_ADMIN_PASSWORD}`);
  
  process.exit(0);
}

seed();
