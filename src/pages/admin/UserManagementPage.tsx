import { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth as _auth, db as _db } from '../../firebase';
const auth = _auth!;
const db = _db!;
import { Users, Plus, Trash2, Shield, ShieldCheck, AlertCircle, X, Check } from 'lucide-react';

interface UserRecord {
  uid: string;
  email: string;
  displayName: string;
  role: 'superadmin' | 'admin';
  createdAt?: any;
}

export function UserManagementPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'superadmin'>('admin');
  const [adding, setAdding] = useState(false);

  const fetchUsers = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list: UserRecord[] = [];
      snap.forEach(d => {
        list.push({ uid: d.id, ...d.data() } as UserRecord);
      });
      list.sort((a, b) => {
        if (a.role === 'superadmin' && b.role !== 'superadmin') return -1;
        if (b.role === 'superadmin' && a.role !== 'superadmin') return 1;
        return a.email.localeCompare(b.email);
      });
      setUsers(list);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setError('');
    setSuccess('');

    try {
      // Create Firebase Auth user
      const cred = await createUserWithEmailAndPassword(auth, newEmail, newPassword);
      
      // Add to Firestore
      await setDoc(doc(db, 'users', cred.user.uid), {
        email: newEmail,
        displayName: newDisplayName || newEmail.split('@')[0],
        role: newRole,
        createdAt: serverTimestamp(),
      });

      setSuccess(`Đã thêm user ${newEmail} thành công!`);
      setShowAddModal(false);
      setNewEmail('');
      setNewPassword('');
      setNewDisplayName('');
      setNewRole('admin');
      await fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Email này đã được sử dụng.');
      } else if (err.code === 'auth/weak-password') {
        setError('Mật khẩu phải có ít nhất 6 ký tự.');
      } else {
        setError(err.message || 'Thêm user thất bại.');
      }
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteUser = async (user: UserRecord) => {
    if (user.role === 'superadmin') {
      setError('Không thể xóa tài khoản Super Admin.');
      return;
    }
    if (!confirm(`Bạn có chắc muốn xóa user ${user.email}?`)) return;
    
    try {
      await deleteDoc(doc(db, 'users', user.uid));
      setSuccess(`Đã xóa user ${user.email}`);
      await fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Xóa user thất bại.');
    }
  };

  const handleToggleRole = async (user: UserRecord) => {
    if (user.role === 'superadmin') return;
    const newRole = user.role === 'admin' ? 'superadmin' : 'admin';
    if (!confirm(`Đổi role của ${user.email} thành ${newRole}?`)) return;

    try {
      await setDoc(doc(db, 'users', user.uid), { role: newRole }, { merge: true });
      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const inputClass = 'w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all text-sm';

  if (loading) {
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
            <Users size={24} className="text-emerald-400" />
            Quản lý Users
          </h1>
          <p className="text-white/50 text-sm mt-1">Thêm, xóa, phân quyền người dùng CMS</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-semibold text-sm shadow-lg shadow-emerald-700/30 transition-all duration-300"
        >
          <Plus size={16} />
          Thêm User
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm mb-6">
          <AlertCircle size={16} className="shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm mb-6">
          <Check size={16} className="shrink-0" />
          {success}
        </div>
      )}

      {/* Users table */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-6 py-4 text-white/40 font-medium">Email</th>
                <th className="text-left px-6 py-4 text-white/40 font-medium">Tên hiển thị</th>
                <th className="text-left px-6 py-4 text-white/40 font-medium">Vai trò</th>
                <th className="text-right px-6 py-4 text-white/40 font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.uid} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 text-white font-medium">{u.email}</td>
                  <td className="px-6 py-4 text-white/70">{u.displayName || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                      u.role === 'superadmin'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                        : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                    }`}>
                      {u.role === 'superadmin' ? <ShieldCheck size={12} /> : <Shield size={12} />}
                      {u.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {u.role !== 'superadmin' && (
                        <>
                          <button
                            onClick={() => handleToggleRole(u)}
                            className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-amber-400 transition-colors"
                            title="Đổi vai trò"
                          >
                            <Shield size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
                            title="Xóa user"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Thêm User Mới</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg hover:bg-white/5 text-white/40 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Email *</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  required
                  className={inputClass}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Mật khẩu *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className={inputClass}
                  placeholder="Tối thiểu 6 ký tự"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Tên hiển thị</label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={e => setNewDisplayName(e.target.value)}
                  className={inputClass}
                  placeholder="Tên người dùng"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Vai trò</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as 'admin' | 'superadmin')}
                  className={inputClass}
                >
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-semibold text-sm disabled:opacity-50 transition-all"
                >
                  {adding ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                  ) : (
                    <Plus size={16} />
                  )}
                  {adding ? 'Đang tạo...' : 'Tạo User'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/5 border border-white/10 text-sm font-medium transition-all"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
