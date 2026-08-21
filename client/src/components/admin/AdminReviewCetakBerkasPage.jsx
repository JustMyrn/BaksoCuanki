import { useState, useEffect } from 'react';
import logoKemenham from '../../assets/logo-kemenham.png';
const IC = '/images/admin/icons';

export default function AdminReviewCetakBerkasPage({ onBack, onLogout, onNavigate }) {
  const [n, setN] = useState('Admin');

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('integra_admin_user') || 'null');
      setN(u?.fullName || u?.full_name || 'Admin');
    } catch {}
  }, []);

  const handleCetakBerkas = () => {
    // TODO: Implement cetak berkas functionality
  };

  return (
    <div className="flex h-screen w-full overflow-hidden font-['Inter']">
      <aside className="flex h-full w-64 shrink-0 flex-col bg-[#696C74] text-white">
        <div className="mt-8 flex items-center gap-2 px-3">
          <img src={logoKemenham} alt="" className="h-12 w-12 shrink-0 object-contain"/>
          <span className="text-2xl font-black tracking-wider text-white">INTEGRA</span>
        </div>
        <nav className="mt-16 flex flex-col gap-12 px-6">
          <div className="flex cursor-pointer items-center gap-2 hover:opacity-80" onClick={() => onNavigate?.('dashboard')}>
            <img src={`${IC}/icon-device.svg`} alt="" className="h-7 w-6 brightness-0 invert"/>
            <span className="text-base font-bold">Dashboard</span>
          </div>
          <div className="flex cursor-pointer items-center gap-2 hover:opacity-80" onClick={() => onNavigate?.('assign')}>
            <img src={`${IC}/icon-assign.svg`} alt="" className="h-8 w-8 brightness-0 invert"/>
            <span className="text-base font-bold leading-tight">Assign<br/>Perjalanan</span>
          </div>
          <div className="flex cursor-pointer items-center gap-2" onClick={() => onNavigate?.('progres')}>
            <img src={`${IC}/icon-commute.svg`} alt="" className="h-8 w-8 brightness-0 invert"/>
            <span className="text-base font-bold leading-tight text-[#BFE3FF]">Progres<br/>Perjalanan</span>
          </div>
          <div className="flex cursor-pointer items-center gap-2 hover:opacity-80" onClick={() => onNavigate?.('manage-user-signup')}>
            <img src={`${IC}/icon-manage.svg`} alt="" className="h-7 w-7 brightness-0 invert"/>
            <span className="text-base font-bold leading-tight">Manage<br/>User</span>
          </div>
          <div className="flex cursor-pointer items-center gap-2 hover:opacity-80" onClick={() => alert('Halaman Setting belum dibuat')}>
            <img src={`${IC}/icon-settings.svg`} alt="" className="h-6 w-6 brightness-0 invert"/>
            <span className="text-base font-bold">Settings</span>
          </div>
        </nav>
        <div className="mt-auto mb-12 px-6">
          <button onClick={onLogout} className="text-base font-bold hover:opacity-80">Logout</button>
        </div>
      </aside>

      <main className="flex flex-1 flex-col bg-[#072D6C]">
        {/* Top Bar */}
        <div className="flex h-[141px] shrink-0 items-center justify-between bg-[#D9D9D9] px-16">
          <div className="flex items-center gap-[9px]">
            <img src={`${IC}/icon-commute.svg`} alt="" className="h-[58px] w-[54px]" style={{ filter: 'brightness(0) saturate(100%) invert(12%) sepia(63%) saturate(2915%) hue-rotate(214deg) brightness(92%) contrast(101%)' }} />
            <span className="text-[50px] font-black text-[#072D6C]">Progres Perjalanan</span>
          </div>
          <div className="flex items-center gap-7">
            <img src={`${IC}/icon-bell.svg`} alt="" className="h-8 w-7" />
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end">
                <span className="text-[15px] font-black text-[#0B53C0]">Profile</span>
                <span className="text-lg font-bold text-black">{n}</span>
              </div>
              <img src={`${IC}/icon-profile.svg`} alt="" className="h-9 w-9" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <button
            onClick={handleCetakBerkas}
            className="w-[289px] h-12 bg-white rounded-[10px] text-black text-2xl font-extrabold hover:bg-gray-100 transition"
          >
            Cetak Berkas
          </button>
        </div>
      </main>
    </div>
  );
}
