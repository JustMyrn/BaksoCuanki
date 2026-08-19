import { useState, useEffect } from 'react';
import logoKemenham from '../../assets/logo-kemenham.png';
const IC = '/images/admin/icons';
const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function AdminReviewPreEventPage({ onBack, onLogout, onNavigate, reviewData }) {
  const [n, setN] = useState('Admin');
  const [activeTab, setActiveTab] = useState('pre');
  const [detail, setDetail] = useState(null);

  const emp = reviewData || JSON.parse(localStorage.getItem('integra_review_data') || 'null') || {};

  useEffect(() => {
    try { const u = JSON.parse(localStorage.getItem('integra_admin_user') || 'null'); setN(u?.fullName || u?.full_name || 'Admin'); } catch {}
    fetchDetail();
  }, []);

  async function fetchDetail() {
    if (!emp.perjalananId) return;
    try {
      const t = localStorage.getItem('integra_admin_token');
      const r = await fetch(`${API}/api/admin/perjalanan-dinas`, { headers: { Authorization: `Bearer ${t}` } });
      if (r.ok) {
        const j = await r.json();
        const found = j.perjalanan?.find(p => p.id === emp.perjalananId);
        if (found) { setDetail(found); return; }
      }
    } catch {}
  }

  const d = detail || {};
  const transportasi = d.jenisTransportasi
    ? `${d.jenisTransportasi} - ${d.detailTransportasi}`
    : emp.transportasi || '-';
  const kapalLaut = d.gunakanKapalLaut ? 'Ya' : (d.gunakanKapalLaut === false ? 'Tidak' : '-');
  const kebutuhanArr = [
    d.kebutuhanBbm && 'BBM', d.kebutuhanBiayaTol && 'Tol',
    d.kebutuhanParkir && 'Parkir', d.kebutuhanLainnya && 'Lainnya',
  ].filter(Boolean);
  const kebutuhan = kebutuhanArr.length ? kebutuhanArr.join(', ') : '-';
  const tiketUrl = d.tiketTransportasiUrl || null;
  const nominalTiket = d.nominalBiayaTiket != null ? `Rp ${Number(d.nominalBiayaTiket).toLocaleString('id-ID')}` : '-';

  function handleTabSwitch(tab) {
    if (tab === 'pre') return;
    if (tab === 'event') onNavigate?.('review-event', emp);
    if (tab === 'post') onNavigate?.('review-post', emp);
  }

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
          <div className="flex items-center gap-2 cursor-pointer" onClick={onBack}>
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

        {/* Tabs container - Absolute styling mapped to flex layout */}
        <div className="mx-8 mt-[25px] flex items-center gap-[9px]">
          <button
            onClick={() => handleTabSwitch('pre')}
            className="w-[138px] h-9 rounded-[10px] bg-[#ACD9FF] text-xl font-semibold text-black transition"
          >
            Pre-Event
          </button>
          <button
            onClick={() => handleTabSwitch('event')}
            className="w-[138px] h-9 rounded-[10px] bg-white text-xl font-semibold text-black hover:brightness-95 transition"
          >
            Event
          </button>
          <button
            onClick={() => handleTabSwitch('post')}
            className="w-[138px] h-9 rounded-[10px] bg-white text-xl font-semibold text-black hover:brightness-95 transition"
          >
            Post-Event
          </button>
        </div>

        {/* Title Section */}
        <div className="mx-8 mt-6">
          <h2 className="text-4xl font-extrabold text-white">PRE-EVENT</h2>
          <div className="mt-[12px] text-white">
            <span className="text-[24px] font-semibold">DETAIL REVIEW: </span>
            <span className="text-[18px] font-normal">{emp.fullName || 'Nama Lengkap'}</span>
          </div>
        </div>

        {/* Info Rows */}
        <div className="mx-8 mt-5 flex flex-col gap-[15px] max-w-[1083px]">
          <div className="flex h-[39px] items-center rounded-[10px] bg-white px-[18px]">
            <span className="text-base font-normal text-black w-[280px]">Transportasi yang dipergunakan :</span>
            <span className="text-base font-bold text-black">{d.jenisTransportasi ? d.jenisTransportasi.toUpperCase() : '-'}</span>
          </div>
          <div className="flex h-[39px] items-center rounded-[10px] bg-white px-[18px]">
            <span className="text-base font-normal text-black w-[280px]">Detail Transportasi :</span>
            <span className="text-base font-bold text-black">{d.detailTransportasi ? d.detailTransportasi.toUpperCase() : '-'}</span>
          </div>
          <div className="flex h-[39px] items-center rounded-[10px] bg-white px-[18px]">
            <span className="text-base font-normal text-black w-[280px]">Gunakan Kapal Laut :</span>
            <span className="text-base font-bold text-black">{kapalLaut}</span>
          </div>
          <div className="flex h-[39px] items-center rounded-[10px] bg-white px-[18px]">
            <span className="text-base font-normal text-black w-[280px]">Biaya Tambahan :</span>
            <span className="text-base font-bold text-black">{kebutuhan}</span>
          </div>
        </div>

        {/* Two-row document grids */}
        <div className="mx-8 mt-[33px] flex gap-[37px] items-start">
          {/* Left Area: Grid of cards */}
          <div className="flex flex-col gap-6 flex-1">
            {/* Row 1 */}
            <div className="grid grid-cols-4 gap-[37px]">
              {/* Tiket Transportasi */}
              <div className="flex flex-col gap-1 w-[238px]">
                <div className="h-[155px] rounded-[10px] bg-white flex items-center justify-center overflow-hidden">
                  {tiketUrl ? (
                    <img src={tiketUrl} alt="Tiket" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm text-gray-400">Belum diupload</span>
                  )}
                </div>
                <span className="text-base font-semibold text-white">Tiket Tranportasi</span>
                <span className="text-base font-normal text-white">Nominal Biaya: {nominalTiket}</span>
              </div>

              {/* Foto di Titik Awal */}
              <div className="flex flex-col gap-1 w-[238px]">
                <div className="h-[155px] rounded-[10px] bg-white flex items-center justify-center overflow-hidden">
                  <span className="text-sm text-gray-400">Belum diupload</span>
                </div>
                <span className="text-base font-semibold text-white">Foto di Titik Awal</span>
              </div>

              {/* Nota Biaya Tambahan */}
              <div className="flex flex-col gap-1 w-[238px]">
                <div className="h-[155px] rounded-[10px] bg-white flex items-center justify-center overflow-hidden">
                  <span className="text-sm text-gray-400">Belum diupload</span>
                </div>
                <span className="text-base font-semibold text-white">Nota Biaya Tambahan</span>
                <span className="text-base font-normal text-white">Nominal Biaya: -</span>
              </div>

              {/* Foto Check-In Penginapan */}
              <div className="flex flex-col gap-1 w-[238px]">
                <div className="h-[155px] rounded-[10px] bg-white flex items-center justify-center overflow-hidden">
                  <span className="text-sm text-gray-400">Belum diupload</span>
                </div>
                <span className="text-base font-semibold text-white">Foto Check-In Penginapan</span>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-4 gap-[37px]">
              {/* Nota Penginapan */}
              <div className="flex flex-col gap-1 w-[238px]">
                <div className="h-[155px] rounded-[10px] bg-white flex items-center justify-center overflow-hidden">
                  <span className="text-sm text-gray-400">Belum diupload</span>
                </div>
                <span className="text-base font-semibold text-white">Nota Penginapan</span>
                <span className="text-base font-normal text-white">Nominal Biaya: -</span>
              </div>
            </div>
          </div>

          {/* Right Area: Action Buttons aligned perfectly to the right */}
          <div className="flex flex-col gap-4 shrink-0 pt-6 pr-8">
            <button
              onClick={() => alert('Fitur kirim feedback sedang dikembangkan.')}
              className="w-[202px] h-[31px] rounded-[10px] bg-[#F4F6D5] text-[13px] font-semibold text-black hover:brightness-90 transition"
            >
              Send Feedback To User
            </button>
            <button
              onClick={() => onNavigate?.('review-event', emp)}
              className="w-[202px] h-[31px] rounded-[10px] bg-[#F4F6D5] text-sm font-semibold text-black hover:brightness-90 transition"
            >
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
