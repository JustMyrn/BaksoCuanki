import { useState, useEffect } from 'react';
import logoKemenham from '../../assets/logo-kemenham.png';
const IC = '/images/admin/icons';

export default function AdminAssignBerhasilPage({ onBack, onLogout, onNavigate }) {
  const [n, setN] = useState('Admin');

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('integra_admin_user') || 'null');
      setN(u?.fullName || u?.full_name || 'Admin');
    } catch {}
  }, []);

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
          {/* Assign Perjalanan - active/highlighted */}
          <div className="flex cursor-pointer items-center gap-2" onClick={() => onNavigate?.('assign')}>
            <img src={`${IC}/icon-assign.svg`} alt="" className="h-8 w-8 brightness-0 invert" style={{ filter: 'brightness(0) saturate(100%) invert(80%) sepia(30%) saturate(500%) hue-rotate(180deg) brightness(110%)' }}/>
            <span className="text-base font-bold leading-tight text-[#BFE3FF]">Assign<br/>Perjalanan</span>
          </div>
          <div className="flex cursor-pointer items-center gap-2 hover:opacity-80" onClick={() => onNavigate?.('progres')}>
            <img src={`${IC}/icon-commute.svg`} alt="" className="h-8 w-8 brightness-0 invert"/>
            <span className="text-base font-bold leading-tight">Progres<br/>Perjalanan</span>
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

      <main className="relative flex flex-1 flex-col overflow-y-auto bg-[#DEF0FF]">
        {/* Top Bar */}
        <div className="flex h-[141px] shrink-0 items-center justify-between bg-[#D9D9D9] px-16">
          <div className="flex items-center gap-[15px]">
            <svg width="43" height="48" viewBox="0 0 43 48" fill="none" className="shrink-0">
              <rect x="1" y="1" width="41" height="46" rx="5" stroke="#072D6C" strokeWidth="3"/>
              <path d="M10 12h23M10 24h23M10 36h14" stroke="#072D6C" strokeWidth="3" strokeLinecap="round"/>
            </svg>
            <span className="text-[50px] font-black text-[#072D6C]">Assign Perjalanan</span>
          </div>
          <div className="flex items-center gap-7">
            <img src={`${IC}/icon-bell.svg`} alt="" className="h-8 w-7"/>
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end">
                <span className="text-[15px] font-black text-[#0B53C0]">Profile</span>
                <span className="text-lg font-bold text-black">{n}</span>
              </div>
              <img src={`${IC}/icon-profile.svg`} alt="" className="h-9 w-9"/>
            </div>
          </div>
        </div>

        {/* Success Content */}
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          {/* Check icon circle */}
          <div className="w-[34px] h-[34px] mb-2 bg-black flex items-center justify-center rounded-full">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-[32px] font-bold text-[#072D6C] text-center w-[503px] leading-tight">
            Berhasil!<br/>Pegawai telah diberikan akses.
          </h2>
        </div>

        {/* Submit button bottom-right */}
        <div className="absolute bottom-[67px] right-[60px]">
          <button
            onClick={() => onNavigate?.('assign')}
            className="rounded-[40px] bg-[#2D4A79] px-[40px] py-[9px] text-2xl font-black text-white hover:brightness-110 transition"
          >
            Submit
          </button>
        </div>
      </main>
    </div>
  );
}
