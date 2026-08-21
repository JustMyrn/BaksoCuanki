import { useState, useEffect } from 'react';
import logoKemenham from '../../assets/logo-kemenham.png';
const IC = '/images/admin/icons';

export default function AdminReviewEventPage({ onBack, onLogout, onNavigate }) {
  const [n, setN] = useState('Admin');
  const emp = JSON.parse(localStorage.getItem('integra_review_data') || 'null') || {};
  const e = emp.eventData || {};
  const fotoKedatangan = e.fotoKedatangan || [];
  const fotoAcara = e.fotoAcara || [];
  const notaBiaya = e.notaBiayaTambahan || [];

  useEffect(() => {
    try { const u = JSON.parse(localStorage.getItem('integra_admin_user') || 'null'); setN(u?.fullName || u?.full_name || 'Admin'); } catch {}
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden font-['Inter']">
      {/* Sidebar */}
      <aside className="flex h-full w-64 shrink-0 flex-col bg-[#696C74] text-white">
        <div className="mt-8 flex items-center gap-2 px-3">
          <img src={logoKemenham} alt="" className="h-12 w-12 shrink-0 object-contain"/>
          <span className="text-2xl font-black tracking-wider text-white">INTEGRA</span>
        </div>
        <nav className="mt-16 flex flex-col gap-12 px-6">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => onNavigate?.('dashboard')}>
            <img src={`${IC}/icon-device.svg`} alt="" className="h-7 w-6 brightness-0 invert"/>
            <span className="text-base font-bold">Dashboard</span>
          </div>
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => onNavigate?.('assign')}>
            <img src={`${IC}/icon-assign.svg`} alt="" className="h-8 w-8 brightness-0 invert"/>
            <span className="text-base font-bold leading-tight">Assign<br/>Perjalanan</span>
          </div>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate?.('progres')}>
            <img src={`${IC}/icon-commute.svg`} alt="" className="h-8 w-8 brightness-0 invert"/>
            <span className="text-base font-bold text-[#BFE3FF] leading-tight">Progres<br/>Perjalanan</span>
          </div>
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => onNavigate?.('manage-user-signup')}>
            <img src={`${IC}/icon-manage.svg`} alt="" className="h-7 w-7 brightness-0 invert"/>
            <span className="text-base font-bold leading-tight">Manage<br/>User</span>
          </div>
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80">
            <img src={`${IC}/icon-settings.svg`} alt="" className="h-6 w-6 brightness-0 invert"/>
            <span className="text-base font-bold">Settings</span>
          </div>
        </nav>
        <div className="mt-auto mb-12 px-6">
          <button onClick={onLogout} className="text-base font-bold hover:opacity-80">Logout</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-y-auto bg-[#072D6C]">
        {/* Header Bar */}
        <div className="flex h-[141px] shrink-0 items-center justify-between bg-[#D9D9D9] px-16">
          <div className="flex items-center gap-[9px]">
            <img src={`${IC}/icon-commute.svg`} alt="" className="h-[58px] w-[54px]" style={{filter:'brightness(0) saturate(100%) invert(12%) sepia(63%) saturate(2915%) hue-rotate(214deg) brightness(92%) contrast(101%)'}}/>
            <span className="text-[50px] font-black text-[#072D6C]">Progres Perjalanan</span>
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

        {/* Tabs */}
        <div className="mx-8 mt-[10px] flex items-center gap-[9px]">
          <button onClick={() => onNavigate?.('review-pre', emp)} className="min-w-[138px] rounded-[10px] bg-white px-[18px] py-[7px] text-xl font-semibold text-black hover:bg-gray-100 transition">Pre-Event</button>
          <button className="min-w-[138px] rounded-[10px] bg-[#ACD9FF] px-10 py-[7px] text-xl font-semibold text-black">Event</button>
          <button onClick={() => onNavigate?.('review-post', emp)} className="min-w-[138px] rounded-[10px] bg-white px-[13px] py-[7px] text-xl font-semibold text-black hover:bg-gray-100 transition">Post-Event</button>
        </div>

        {/* Section Title */}
        <h2 className="mx-8 mt-4 text-4xl font-extrabold text-white">EVENT</h2>

        {/* Detail Name */}
        <p className="mx-8 mt-2">
          <span className="text-2xl font-semibold text-white">DETAIL REVIEW: </span>
          <span className="text-lg font-normal text-white">{emp.fullName || 'Nama Lengkap'}</span>
        </p>

        {/* Photo Cards Row 1 */}
        <div className="mx-8 mt-6 grid grid-cols-4 gap-6">
          <div className="flex flex-col">
            <div className="flex h-[178px] items-center justify-center rounded-[10px] bg-white overflow-hidden">
              {fotoKedatangan[0] ? <img src={fotoKedatangan[0]} alt="Kedatangan" className="h-full w-full object-cover" /> : <span className="text-sm text-gray-400">Belum diupload</span>}
            </div>
            <span className="mt-1 text-base font-semibold text-white">Foto Kedatangan di Venue</span>
          </div>
          <div className="flex flex-col">
            <div className="flex h-[178px] items-center justify-center rounded-[10px] bg-white overflow-hidden">
              {fotoAcara[0] ? <img src={fotoAcara[0]} alt="Acara 1" className="h-full w-full object-cover" /> : <span className="text-sm text-gray-400">Belum diupload</span>}
            </div>
            <span className="mt-1 text-base font-semibold text-white">Foto saat acara berlangsung</span>
          </div>
          <div className="flex flex-col">
            <div className="flex h-[178px] items-center justify-center rounded-[10px] bg-white overflow-hidden">
              {fotoAcara[1] ? <img src={fotoAcara[1]} alt="Acara 2" className="h-full w-full object-cover" /> : <span className="text-sm text-gray-400">Belum diupload</span>}
            </div>
            <span className="mt-1 text-base font-semibold text-white">Foto saat acara berlangsung</span>
          </div>
          <div className="flex flex-col">
            <div className="flex h-[178px] items-center justify-center rounded-[10px] bg-white overflow-hidden">
              {fotoAcara[2] ? <img src={fotoAcara[2]} alt="Acara 3" className="h-full w-full object-cover" /> : <span className="text-sm text-gray-400">Belum diupload</span>}
            </div>
            <span className="mt-1 text-base font-semibold text-white">Foto saat acara berlangsung</span>
          </div>
        </div>

        {/* Photo Cards Row 2 */}
        <div className="mx-8 mt-6 grid grid-cols-4 gap-6">
          <div className="flex flex-col">
            <div className="flex h-[178px] items-center justify-center rounded-[10px] bg-white overflow-hidden">
              {fotoAcara[3] ? <img src={fotoAcara[3]} alt="Acara 4" className="h-full w-full object-cover" /> : <span className="text-sm text-gray-400">Belum diupload</span>}
            </div>
            <span className="mt-1 text-base font-semibold text-white">Foto saat acara berlangsung</span>
          </div>
          <div className="flex flex-col">
            <div className="flex h-[178px] items-center justify-center rounded-[10px] bg-white overflow-hidden">
              {notaBiaya[0] ? <img src={notaBiaya[0]} alt="Nota" className="h-full w-full object-cover" /> : <span className="text-sm text-gray-400">Belum diupload</span>}
            </div>
            <p><span className="text-base font-semibold text-white">Nota Biaya Tambahan</span><span className="text-[11px] font-semibold text-white"> (Jika Ada) </span></p>
            <span className="text-base font-normal text-white">Nominal Biaya: {e.nominalBiayaTambahan ? `Rp ${Number(e.nominalBiayaTambahan).toLocaleString('id-ID')}` : '-'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mx-8 mt-auto mb-4 flex flex-col items-end gap-3 pb-8">
          <button className="h-[31px] w-[202px] rounded-[10px] bg-[#F4F6D5] text-[13px] font-semibold text-black hover:brightness-95 transition">
            Send Feedback To User
          </button>
          <button onClick={() => onNavigate?.('review-post', emp)} className="h-[31px] w-[202px] rounded-[10px] bg-[#F4F6D5] text-sm font-semibold text-black hover:brightness-95 transition">
            Next
          </button>
        </div>
      </main>
    </div>
  );
}
