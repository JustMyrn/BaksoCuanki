import { useState, useEffect } from 'react';
import logoKemenham from '../../assets/logo-kemenham.png';
const IC = '/images/admin/icons';
const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const DEMO_USERS = [
  { id: 1, full_name: 'Ahmad Fadillah', nip: '198704202012121001', jabatan: 'Kepala Bidang', email: 'ahmad@integra.id', created_at: '2026-08-20T08:00:00.000Z' },
  { id: 2, full_name: 'Siti Nurhaliza', nip: '199208152015032002', jabatan: 'Kepala Seksi', email: 'siti@integra.id', created_at: '2026-08-21T09:30:00.000Z' },
  { id: 3, full_name: 'Budi Santoso', nip: '198501012010121003', jabatan: 'Penyusun Program', email: 'budi@integra.id', created_at: '2026-08-22T10:15:00.000Z' }
];

export default function AdminManageUserSignupPage({ onBack, onLogout, onNavigate }) {
  const [n, setN] = useState('Admin');
  const [pendingUsers, setPendingUsers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('integra_admin_user') || 'null');
      setN(u?.fullName || u?.full_name || 'Admin');
    } catch {}
    fetchPendingUsers();
  }, []);

  async function fetchPendingUsers() {
    try {
      const t = localStorage.getItem('integra_admin_token');
      const r = await fetch(`${API}/api/admin/users?status=pending`, {
        headers: { Authorization: `Bearer ${t}` }
      });
      if (r.ok) {
        const j = await r.json();
        if (j.users) {
          const filtered = j.users.filter(u => !u.isAdmin && u.approvalStatus === 'pending');
          setPendingUsers(filtered);
          return;
        }
      }
    } catch {}
    setPendingUsers(DEMO_USERS);
  }

  async function handleApprove(userId) {
    if (!window.confirm('Apakah Anda yakin ingin menyetujui pendaftaran pegawai ini?')) return;
    try {
      const t = localStorage.getItem('integra_admin_token');
      const r = await fetch(`${API}/api/admin/users/${userId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}` }
      });
      if (r.ok) {
        alert('Pegawai berhasil disetujui.');
        fetchPendingUsers();
      } else {
        const err = await r.json();
        alert(err.message || 'Gagal menyetujui pegawai.');
      }
    } catch {
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
      alert('Demo Mode: Pegawai disetujui.');
    }
  }

  async function handleDeny(userId) {
    if (!window.confirm('Apakah Anda yakin ingin menolak pendaftaran pegawai ini?')) return;
    try {
      const t = localStorage.getItem('integra_admin_token');
      const r = await fetch(`${API}/api/admin/users/${userId}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}` }
      });
      if (r.ok) {
        alert('Pendaftaran pegawai berhasil ditolak.');
        fetchPendingUsers();
      } else {
        const err = await r.json();
        alert(err.message || 'Gagal menolak pegawai.');
      }
    } catch {
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
      alert('Demo Mode: Pegawai ditolak.');
    }
  }

  const filtered = pendingUsers.filter(u => {
    const term = search.toLowerCase();
    return (
      (u.fullName || u.full_name || '').toLowerCase().includes(term) ||
      (u.nip || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white font-['Inter']">
      {/* Sidebar */}
      <aside className="flex h-full w-64 shrink-0 flex-col bg-[#696C74] text-white">
        <div className="mt-8 flex items-center gap-2 px-3">
          <img src={logoKemenham} alt="Logo" className="h-12 w-12 shrink-0 object-contain" />
          <span className="text-2xl font-black tracking-wider text-white">INTEGRA</span>
        </div>
        <nav className="mt-16 flex flex-col gap-12 px-6">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => onNavigate?.('dashboard')}>
            <img src={`${IC}/icon-device.svg`} alt="Dashboard" className="h-7 w-6 brightness-0 invert" />
            <span className="text-base font-bold">Dashboard</span>
          </div>
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => onNavigate?.('assign')}>
            <img src={`${IC}/icon-assign.svg`} alt="Assign" className="h-8 w-8 brightness-0 invert" />
            <span className="text-base font-bold leading-tight">Assign<br />Perjalanan</span>
          </div>
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => onNavigate?.('progres')}>
            <img src={`${IC}/icon-commute.svg`} alt="Progres" className="h-8 w-8 brightness-0 invert" />
            <span className="text-base font-bold leading-tight">Progres<br />Perjalanan</span>
          </div>
          <div className="flex items-center gap-2 cursor-pointer">
            <img src={`${IC}/icon-manage.svg`} alt="Manage" className="h-7 w-7 brightness-0 invert" />
            <span className="text-base font-bold text-[#BFE3FF] leading-tight">Manage<br />User</span>
          </div>
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80">
            <img src={`${IC}/icon-settings.svg`} alt="Settings" className="h-6 w-6 brightness-0 invert" />
            <span className="text-base font-bold">Settings</span>
          </div>
        </nav>
        <div className="mt-auto mb-12 px-6">
          <button onClick={onLogout} className="text-base font-bold hover:opacity-80">Logout</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-y-auto bg-white pb-12">
        {/* Header Bar */}
        <div className="flex h-[141px] shrink-0 items-center justify-between bg-[#D9D9D9] px-16">
          <div className="flex items-center gap-4">
            <img src={`${IC}/icon-manage.svg`} alt="Manage User" className="h-12 w-12" style={{ filter: 'brightness(0) saturate(100%) invert(13%) sepia(50%) saturate(3474%) hue-rotate(209deg) brightness(91%) contrast(100%)' }} />
            <span className="text-5xl font-black text-[#072D6C]">Manage User</span>
          </div>
          <div className="flex items-center gap-7">
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-[#0B53C0]">Profile</span>
                <span className="text-sm font-bold text-black">{n}</span>
              </div>
              <img src={`${IC}/icon-profile.svg`} alt="Profile" className="h-[37px] w-[37px]" />
            </div>
          </div>
        </div>

        {/* Sub Header & Search Bar */}
        <div className="mx-14 mt-8 flex items-end justify-between gap-4">
          <div className="flex flex-col w-[343px] gap-[3px]">
            <label className="text-[17px] font-black text-[#072D6C] leading-none">Search</label>
            <div className="flex items-center gap-[6px] rounded-[10px] bg-[#072D6C] py-[7px] px-2 text-white">
              <img src={`${IC}/icon-search-magnify.svg`} alt="Search" className="h-[15px] w-[15px] brightness-0 invert opacity-70" />
              <input
                type="text"
                placeholder="Nama Pegawai"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-[17px] font-semibold text-white placeholder-white/70 outline-none"
              />
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-4">
            <button className="rounded-[10px] bg-[#ACD9FF] px-10 py-[7px] text-[17px] font-bold text-black">
              Approval Requests
            </button>
            <button
              onClick={() => onNavigate?.('manage-user-reset')}
              className="rounded-[10px] bg-[#072D6C] px-8 py-[7px] text-[17px] font-bold text-white hover:brightness-110 transition"
            >
              Reset Password User
            </button>
          </div>
        </div>

        {/* Requests Container Table */}
        <div className="mx-14 mt-8 flex flex-col rounded-[10px] bg-[#ACD9FF]/40 overflow-hidden">
          <div className="bg-[#6C6D81]/55 py-5 px-[34px]">
            <h2 className="text-2xl font-black text-[#072D6C] tracking-wide">
              Pending Sign-Up Requests ({filtered.length})
            </h2>
          </div>

          {/* Table Headers */}
          <div className="grid grid-cols-[200px_160px_180px_230px_180px_1fr] px-6 py-[18px] text-[16px] font-bold text-black border-b border-black">
            <div>Nama Pegawai</div>
            <div>NIP</div>
            <div>Jabatan</div>
            <div>Email</div>
            <div>Tanggal Permohonan</div>
            <div className="text-center">Aksi</div>
          </div>

          {/* Table Rows */}
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500 font-semibold">
              Tidak ada data pending permohonan pendaftaran.
            </div>
          ) : (
            filtered.map((user, idx) => {
              const formattedDate = user.created_at
                ? new Date(user.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })
                : '21 Agustus, 2026';

              return (
                <div
                  key={user.id}
                  className={`grid grid-cols-[200px_160px_180px_230px_180px_1fr] items-center px-6 py-4 text-sm text-black ${
                    idx < filtered.length - 1 ? 'border-b border-black' : ''
                  }`}
                >
                  <div className="font-semibold truncate pr-2">{user.fullName || user.full_name || 'Nama Lengkap'}</div>
                  <div className="truncate pr-2">{user.nip || '123123123123123'}</div>
                  <div className="truncate pr-2">{user.jabatan || 'Kepala Bidang'}</div>
                  <div className="truncate pr-2">{user.email || 'user@gmail.com'}</div>
                  <div className="truncate pr-2">{formattedDate}</div>
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => handleApprove(user.id)}
                      className="rounded-[5px] bg-[#2C7C4E] px-[18px] py-1 text-sm font-bold text-white hover:bg-[#22603c] transition"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleDeny(user.id)}
                      className="rounded-[5px] bg-[#982E21] px-[22px] py-1 text-sm font-bold text-white hover:bg-[#782319] transition"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}

