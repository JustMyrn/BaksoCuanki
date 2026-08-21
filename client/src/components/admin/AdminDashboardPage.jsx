import { useState, useEffect } from 'react';
import logoKemenham from '../../assets/logo-kemenham.png';
const IC='/images/admin/icons';
export default function AdminDashboardPage({ onLogout, onNavigate }) {
  const [n,s]=useState('Admin');
  useEffect(()=>{try{const u=JSON.parse(localStorage.getItem('integra_admin_user')||'null');s(u?.fullName||u?.full_name||'Admin')}catch{}},[]);
  return(
    <div className="flex h-screen w-full overflow-hidden bg-[#2D4A79] font-['Inter']">
      {/* Sidebar */}
      <aside className="flex h-full w-64 shrink-0 flex-col bg-[#696C74] text-white">
        {/* Logo Section */}
        <div className="mt-8 flex items-center gap-2 px-3">
          <img src={logoKemenham} alt="" className="h-12 w-12 shrink-0 object-contain"/>
          <span className="text-2xl font-black tracking-wider text-white">INTEGRA</span>
        </div>
        {/* Navigation */}
        <nav className="mt-16 flex flex-col gap-12 px-6">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => onNavigate?.('dashboard')}>
            <img src={`${IC}/icon-device.svg`} alt="" className="h-7 w-6 brightness-0 invert"/>
            <span className="text-base font-bold text-[#BFE3FF]">Dashboard</span>
          </div>
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => onNavigate?.('assign')}>
            <img src={`${IC}/icon-assign.svg`} alt="" className="h-8 w-8 brightness-0 invert"/>
            <span className="text-base font-bold leading-tight">Assign<br/>Perjalanan</span>
          </div>
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => onNavigate?.('progres')}>
            <img src={`${IC}/icon-commute.svg`} alt="" className="h-8 w-8 brightness-0 invert"/>
            <span className="text-base font-bold leading-tight">Progres<br/>Perjalanan</span>
          </div>
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => onNavigate?.('manage-user-signup')}>
            <img src={`${IC}/icon-manage.svg`} alt="" className="h-7 w-7 brightness-0 invert"/>
            <span className="text-base font-bold leading-tight">Manage<br/>User</span>
          </div>
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => alert('Halaman Setting belum dibuat')}>
            <img src={`${IC}/icon-settings.svg`} alt="" className="h-6 w-6 brightness-0 invert"/>
            <span className="text-base font-bold">Settings</span>
          </div>
        </nav>
        {/* Logout */}
        <div className="mt-auto mb-12 px-6">
          <button onClick={onLogout} className="text-base font-bold hover:opacity-80">Logout</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-y-auto bg-[#2D4A79] pb-12">
        {/* Header */}
        <div className="flex items-center justify-between px-14 pt-8">
          <div className="flex items-center gap-2">
            <img src={`${IC}/icon-device.svg`} alt="" className="h-7 w-6 brightness-0 invert"/>
            <span className="text-lg font-bold text-white">Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <img src={`${IC}/icon-bell.svg`} alt="" className="h-8 w-8 brightness-0 invert"/>
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end text-right">
                <span className="text-xs font-bold text-blue-300">Profile</span>
                <span className="text-sm font-bold text-white">{n}</span>
              </div>
              <img src={`${IC}/icon-profile.svg`} alt="" className="h-9 w-9"/>
            </div>
          </div>
        </div>

        {/* Info Section - Right Aligned */}
        <div className="px-14 pt-6 text-right">
          <h2 className="text-3xl font-bold text-white tracking-wide">INTEGRA</h2>
          <p className="mt-1 text-xs font-bold text-white leading-tight">Integritas Administrasi &<br/>Tata Kelola Perjalanan Dinas</p>
          <p className="mt-2 text-xs font-bold text-yellow-400 leading-tight">Kementerian Hak Asasi Manusia<br/>Kantor Wilayah Lampung</p>
        </div>

        {/* Welcome Card */}
        <div className="mx-14 mt-8 flex h-32 items-center rounded-3xl bg-white">
          <div className="flex items-center gap-6 px-8 flex-1">
            <img src={`${IC}/icon-account-box.svg`} alt="" className="h-24 w-24 shrink-0"/>
            <div>
              <h2 className="text-3xl font-black text-black">Selamat Datang,</h2>
              <h2 className="text-3xl font-black text-black">{n}!</h2>
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="mx-14 mt-10 grid grid-cols-2 gap-8">
          {/* Assign Perjalanan */}
          <div className="flex h-40 items-center rounded-3xl bg-[#CEE6FF] px-10 cursor-pointer hover:brightness-95 transition" onClick={()=>onNavigate?.('assign')}>
            <img src={`${IC}/icon-assign.svg`} alt="" className="h-10 w-10 shrink-0" style={{filter:'brightness(0) saturate(100%) invert(9%) sepia(56%) saturate(1934%) hue-rotate(217deg) brightness(36%) contrast(93%)'}}/>
            <span className="ml-4 text-2xl font-bold text-blue-950 leading-tight">Assign<br/>Perjalanan</span>
          </div>

          {/* Progres Perjalanan */}
          <div className="flex h-40 items-center rounded-3xl bg-[#CEE6FF] px-10 cursor-pointer hover:brightness-95 transition" onClick={()=>onNavigate?.('progres')}>
            <img src={`${IC}/icon-commute.svg`} alt="" className="h-10 w-10 shrink-0" style={{filter:'brightness(0) saturate(100%) invert(9%) sepia(56%) saturate(1934%) hue-rotate(217deg) brightness(36%) contrast(93%)'}}/>
            <span className="ml-4 text-2xl font-bold text-blue-950 leading-tight">Progres<br/>Perjalanan</span>
          </div>

          {/* Manage User */}
          <div className="flex h-40 items-center rounded-3xl bg-[#CEE6FF] px-10 cursor-pointer hover:brightness-95 transition" onClick={()=>onNavigate?.('manage-user-signup')}>
            <img src={`${IC}/icon-manage.svg`} alt="" className="h-10 w-10 shrink-0" style={{filter:'brightness(0) saturate(100%) invert(9%) sepia(56%) saturate(1934%) hue-rotate(217deg) brightness(36%) contrast(93%)'}}/>
            <span className="ml-4 text-2xl font-bold text-blue-950 leading-tight">Manage<br/>User</span>
          </div>

          {/* Settings */}
          <div className="flex h-40 items-center rounded-3xl bg-[#CEE6FF] px-10 cursor-pointer hover:brightness-95 transition" onClick={() => alert('Halaman Setting belum dibuat')}>
            <img src={`${IC}/icon-settings.svg`} alt="" className="h-8 w-8 shrink-0"/>
            <span className="ml-4 text-2xl font-bold text-blue-950">Settings</span>
          </div>
        </div>
      </main>
    </div>
  );
}