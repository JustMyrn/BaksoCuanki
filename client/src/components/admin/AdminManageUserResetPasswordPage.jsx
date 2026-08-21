import { useEffect, useState } from 'react';
import logoKemenham from '../../assets/logo-kemenham.png';

const IC = '/images/admin/icons';
const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const DEMO_USERS = [
  { id: 1, fullName: 'Nama Lengkap', email: 'user12345@gmail.com', createdAt: '2026-08-21T00:00:00.000Z' },
  { id: 2, fullName: 'Nama Lengkap', email: 'user12345@gmail.com', createdAt: '2026-08-21T00:00:00.000Z' },
  { id: 3, fullName: 'Nama Lengkap', email: 'user12345@gmail.com', createdAt: '2026-08-21T00:00:00.000Z' },
];

function formatDate(value) {
  return value
    ? new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : '21 Agustus, 2026';
}

export default function AdminManageUserResetPasswordPage({ onBack, onLogout, onNavigate }) {
  const [n, setN] = useState('Admin');
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('integra_admin_user') || 'null');
      setN(u?.fullName || u?.full_name || 'Admin');
    } catch {}
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const token = localStorage.getItem('integra_admin_token');
      const response = await fetch(`${API}/api/admin/users?status=approved`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Unable to load users');
      const data = await response.json();
      setUsers((data.users || []).filter(user => !user.isAdmin));
    } catch {
      setUsers(DEMO_USERS);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(user) {
    if (!window.confirm(`Reset password untuk ${user.fullName || 'pegawai ini'}?`)) return;

    try {
      const token = localStorage.getItem('integra_admin_token');
      const response = await fetch(`${API}/api/admin/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Gagal mereset password.');
      window.alert(`Password sementara untuk ${user.email}: ${data.temporaryPassword}`);
      setUsers(current => current.filter(item => item.id !== user.id));
    } catch (error) {
      window.alert(error.message || 'Gagal mereset password.');
    }
  }

  function handleDeny(userId) {
    setUsers(current => current.filter(user => user.id !== userId));
  }

  const filtered = users.filter(user => {
    const term = search.toLowerCase();
    return (user.fullName || '').toLowerCase().includes(term) || (user.email || '').toLowerCase().includes(term);
  });

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white font-['Inter']">
      <aside className="flex h-full w-64 shrink-0 flex-col rounded-r-[15px] bg-[#696C74] text-white">
        <div className="mt-8 flex items-center gap-2 px-3">
          <img src={logoKemenham} alt="Logo KEMENHAM" className="h-12 w-12 shrink-0 object-contain" />
          <span className="text-2xl font-black tracking-wider">INTEGRA</span>
        </div>
        <nav className="mt-16 flex flex-col gap-12 px-6">
          <div className="flex cursor-pointer items-center gap-2 hover:opacity-80" onClick={() => onNavigate?.('dashboard')}><img src={`${IC}/icon-device.svg`} alt="" className="h-7 w-6 brightness-0 invert" /><span className="text-base font-bold">Dashboard</span></div>
          <div className="flex cursor-pointer items-center gap-2 hover:opacity-80" onClick={() => onNavigate?.('assign')}><img src={`${IC}/icon-assign.svg`} alt="" className="h-8 w-8 brightness-0 invert" /><span className="text-base font-bold leading-tight">Assign<br />Perjalanan</span></div>
          <div className="flex cursor-pointer items-center gap-2 hover:opacity-80" onClick={() => onNavigate?.('progres')}><img src={`${IC}/icon-commute.svg`} alt="" className="h-8 w-8 brightness-0 invert" /><span className="text-base font-bold leading-tight">Progres<br />Perjalanan</span></div>
          <div className="flex cursor-pointer items-center gap-2" onClick={() => onNavigate?.('manage-user-signup')}><img src={`${IC}/icon-manage.svg`} alt="" className="h-7 w-7 brightness-0 invert" /><span className="text-base font-bold leading-tight text-[#BFE3FF]">Manage<br />User</span></div>
          <div className="flex cursor-pointer items-center gap-2 hover:opacity-80" onClick={() => alert('Halaman Setting belum dibuat')}><img src={`${IC}/icon-settings.svg`} alt="" className="h-6 w-6 brightness-0 invert" /><span className="text-base font-bold">Settings</span></div>
        </nav>
        <div className="mt-auto mb-12 px-6"><button onClick={onLogout} className="text-base font-bold hover:opacity-80">Logout</button></div>
      </aside>

      <main className="flex flex-1 flex-col overflow-y-auto bg-white pb-12">
        <header className="flex h-[141px] shrink-0 items-center justify-between bg-[#D9D9D9] px-16">
          <div className="flex items-center gap-4"><img src={`${IC}/icon-manage.svg`} alt="" className="h-12 w-12" style={{ filter: 'brightness(0) saturate(100%) invert(13%) sepia(50%) saturate(3474%) hue-rotate(209deg) brightness(91%) contrast(100%)' }} /><span className="text-5xl font-black text-[#072D6C]">Manage User</span></div>
          <div className="flex items-center gap-2"><div className="flex flex-col items-end"><span className="text-[15px] font-black text-[#0B53C0]">Profile</span><span className="text-lg font-bold text-black">{n}</span></div><img src={`${IC}/icon-profile.svg`} alt="Profile" className="h-9 w-9" /></div>
        </header>

        <div className="mx-14 mt-8 flex items-end justify-between gap-4">
          <div className="flex w-[343px] flex-col gap-[3px]"><label htmlFor="user-search" className="text-[17px] font-black leading-[22px] text-[#072D6C]">Search</label><div className="flex items-center gap-[6px] rounded-[10px] bg-[#072D6C] px-2 py-[7px]"><img src={`${IC}/icon-search-magnify.svg`} alt="" className="h-[15px] w-[15px] brightness-0 invert opacity-70" /><input id="user-search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Nama Pegawai" className="flex-1 bg-transparent text-[17px] font-semibold text-white outline-none placeholder:text-white/70" /></div></div>
          <div className="flex items-center gap-4"><button onClick={() => onNavigate?.('manage-user-signup')} className="rounded-[10px] bg-[#072D6C] px-10 py-[7px] text-[17px] font-bold text-white hover:brightness-110">Approval Requests</button><button className="rounded-[10px] bg-[#ACD9FF] px-8 py-[7px] text-[17px] font-bold text-black">Reset Password User</button></div>
        </div>

        <section className="mx-14 mt-8 overflow-hidden rounded-[10px] bg-[#ACD9FF]/40">
          <div className="bg-[#6C6D81]/55 px-[34px] py-5"><h2 className="text-2xl font-black tracking-wide text-[#072D6C]">Reset Password Request ({filtered.length})</h2></div>
          <div className="grid grid-cols-[1.2fr_1.4fr_1.5fr_1.3fr] border-b border-black px-6 py-[18px] text-[16px] font-bold text-black"><div>Nama Pegawai</div><div>Email Akun</div><div>Tanggal Permohonan</div><div className="text-center">Aksi</div></div>
          {loading ? <div className="p-8 text-center font-semibold text-gray-500">Memuat data pengguna...</div> : filtered.length === 0 ? <div className="p-8 text-center font-semibold text-gray-500">Tidak ada permohonan reset password.</div> : filtered.map((user, index) => <div key={user.id} className={`grid grid-cols-[1.2fr_1.4fr_1.5fr_1.3fr] items-center px-6 py-4 text-sm text-black ${index < filtered.length - 1 ? 'border-b border-black' : ''}`}><div className="truncate pr-2">{user.fullName || 'Nama Lengkap'}</div><div className="truncate pr-2">{user.email || 'user@gmail.com'}</div><div>{formatDate(user.createdAt || user.created_at)}</div><div className="flex justify-center gap-2"><button onClick={() => handleReset(user)} className="rounded-[5px] bg-[#2C7C4E] px-[18px] py-1 text-sm font-bold text-white hover:bg-[#22603c]">Approve</button><button onClick={() => handleDeny(user.id)} className="rounded-[5px] bg-[#982E21] px-[22px] py-1 text-sm font-bold text-white hover:bg-[#782319]">Deny</button></div></div>)}
        </section>
      </main>
    </div>
  );
}
