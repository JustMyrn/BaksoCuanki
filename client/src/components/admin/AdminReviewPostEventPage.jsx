import { useState, useEffect } from 'react';
import logoKemenham from '../../assets/logo-kemenham.png';
const IC = '/images/admin/icons';
const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function AdminReviewPostEventPage({ onBack, onLogout, onNavigate, reviewData }) {
  const [n, setN] = useState('Admin');
  const [activeTab, setActiveTab] = useState('post');
  const [detail, setDetail] = useState(null);
  const emp = reviewData || JSON.parse(localStorage.getItem('integra_review_data') || 'null') || {};
  const d = emp.postData || {};

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('integra_admin_user') || 'null');
      setN(u?.fullName || u?.full_name || 'Admin');
    } catch { }
  }, []);

  const transportasi = d.jenisTransportasi || d.jenis_transportasi ? `${d.jenisTransportasi || d.jenis_transportasi} - ${d.detailTransportasi || d.detail_transportasi}` : '-';
  const kapalLaut = (d.gunakanKapalLaut ?? d.gunakan_kapal_laut) ? 'Ya' : 'Tidak';
  const kebutuhanArr = [d.uangHarianTambahan && 'Uang Harian', d.transportTambahan && 'Transport'].filter(Boolean);
  const kebutuhan = kebutuhanArr.length ? kebutuhanArr.join(', ') : '-';

  const tiketArr = d.tiketTransportasi || d.tiket_transportasi || [];
  const tiketUrl = Array.isArray(tiketArr) ? tiketArr[0] : (typeof tiketArr === 'string' ? tiketArr : null);
  const nominalTiket = (d.nominalBiayaTiket ?? d.nominal_biaya_tiket) != null ? `Rp ${Number(d.nominalBiayaTiket ?? d.nominal_biaya_tiket).toLocaleString('id-ID')}` : '-';

  const notaArr = d.notaBiayaTambahan || d.nota_biaya_tambahan || [];
  const notaBiaya = Array.isArray(notaArr) ? notaArr[0] : (typeof notaArr === 'string' ? notaArr : null);

  const fotoCheckout = d.fotoCheckoutHotel || d.foto_checkout_hotel || [];
  const urlCheckout = Array.isArray(fotoCheckout) ? fotoCheckout[0] : null;

  const fotoKembali = d.fotoSaatKembali || d.foto_saat_kembali || [];
  const urlKembali = Array.isArray(fotoKembali) ? fotoKembali[0] : null;

  function handleTabSwitch(tab) {
    setActiveTab(tab);
    if (tab === 'pre') onNavigate?.('review-pre', emp);
    if (tab === 'event') onNavigate?.('review-event', emp);
    if (tab === 'post') return;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden font-['Inter']">
      <aside className="flex h-full w-64 shrink-0 flex-col bg-[#696C74] text-white">
        <div className="mt-8 flex items-center gap-2 px-3">
          <img src={logoKemenham} alt="" className="h-12 w-12 shrink-0 object-contain" />
          <span className="text-2xl font-black tracking-wider text-white">INTEGRA</span>
        </div>
        <nav className="mt-16 flex flex-col gap-12 px-6">
          <div className="flex cursor-pointer items-center gap-2 hover:opacity-80" onClick={() => onNavigate?.('dashboard')}>
            <img src={`${IC}/icon-device.svg`} alt="" className="h-7 w-6 brightness-0 invert" />
            <span className="text-base font-bold">Dashboard</span>
          </div>
          <div className="flex cursor-pointer items-center gap-2 hover:opacity-80" onClick={() => onNavigate?.('assign')}>
            <img src={`${IC}/icon-assign.svg`} alt="" className="h-8 w-8 brightness-0 invert" />
            <span className="text-base font-bold leading-tight">Assign<br />Perjalanan</span>
          </div>
          <div className="flex cursor-pointer items-center gap-2" onClick={() => onNavigate?.('progres')}>
            <img src={`${IC}/icon-commute.svg`} alt="" className="h-8 w-8 brightness-0 invert" />
            <span className="text-base font-bold leading-tight text-[#BFE3FF]">Progres<br />Perjalanan</span>
          </div>
          <div className="flex cursor-pointer items-center gap-2 hover:opacity-80" onClick={() => onNavigate?.('manage-user-signup')}>
            <img src={`${IC}/icon-manage.svg`} alt="" className="h-7 w-7 brightness-0 invert" />
            <span className="text-base font-bold leading-tight">Manage<br />User</span>
          </div>
          <div className="flex cursor-pointer items-center gap-2 hover:opacity-80" onClick={() => alert('Halaman Setting belum dibuat')}>
            <img src={`${IC}/icon-settings.svg`} alt="" className="h-6 w-6 brightness-0 invert" />
            <span className="text-base font-bold">Settings</span>
          </div>
        </nav>
        <div className="mt-auto mb-12 px-6">
          <button onClick={onLogout} className="text-base font-bold hover:opacity-80">Logout</button>
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-y-auto bg-[#072D6C]">
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

        {/* Tabs container */}
        <div className="mx-8 mt-[25px] flex items-center gap-[9px]">
          <button
            onClick={() => handleTabSwitch('pre')}
            className="w-[138px] h-9 rounded-[10px] bg-white text-xl font-semibold text-black hover:brightness-95 transition"
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
            className="w-[138px] h-9 rounded-[10px] bg-[#ACD9FF] text-xl font-semibold text-black transition"
          >
            Post-Event
          </button>
        </div>

        {/* Title Section */}
        <div className="mx-8 mt-6">
          <h2 className="text-4xl font-extrabold text-white">POST-EVENT</h2>
          <div className="mt-[12px] text-white">
            <span className="text-[24px] font-semibold">DETAIL REVIEW: </span>
            <span className="text-[18px] font-normal">{emp.fullName || 'Nama Lengkap'}</span>
          </div>
        </div>

        <div className="mx-8 mt-6 grid grid-cols-4 gap-6">
          <div className="flex flex-col">
            <div className="flex h-[155px] items-center justify-center rounded-[10px] bg-white overflow-hidden">
              {tiketUrl ? <img src={tiketUrl} alt="Tiket transportasi" className="h-full w-full object-cover" /> : <span className="text-sm text-gray-400">Belum diupload</span>}
            </div>
            <span className="mt-1 text-base font-semibold text-white">Tiket Tranportasi</span>
            <span className="text-base font-normal text-white">Nominal Biaya: {nominalTiket}</span>
          </div>

          <div className="flex flex-col">
            <div className="flex h-[155px] items-center justify-center rounded-[10px] bg-white overflow-hidden">
              <span className="text-sm text-gray-400">Belum diupload</span>
            </div>
            <p>
              <span className="text-base font-semibold text-white">Tiket Kapal</span>
              <span className="text-[11px] font-semibold text-white"> (Jika Menggunakan Kapal) </span>
            </p>
            <span className="text-base font-normal text-white">Nominal Biaya: -</span>
          </div>

          <div className="flex flex-col">
            <div className="flex h-[155px] items-center justify-center rounded-[10px] bg-white overflow-hidden">
              {notaBiaya ? <img src={notaBiaya} alt="Nota" className="h-full w-full object-cover" /> : <span className="text-sm text-gray-400">Belum diupload</span>}
            </div>
            <p>
              <span className="text-base font-semibold text-white">Nota Biaya Tambahan</span>
              <span className="text-[11px] font-semibold text-white"> (Jika Ada) </span>
            </p>
            <span className="text-base font-normal text-white">Nominal Biaya: {(d.nominalBiayaTambahan ?? d.nominal_biaya_tambahan) ? `Rp ${Number(d.nominalBiayaTambahan ?? d.nominal_biaya_tambahan).toLocaleString('id-ID')}` : '-'}</span>
          </div>

          <div className="flex flex-col">
            <div className="flex h-[155px] items-center justify-center rounded-[10px] bg-white overflow-hidden">
              {urlCheckout ? <img src={urlCheckout} alt="Checkout" className="h-full w-full object-cover" /> : <span className="text-sm text-gray-400">Belum diupload</span>}
            </div>
            <span className="mt-1 text-base font-semibold text-white">Foto Check-Out Penginapan</span>
          </div>

          <div className="flex flex-col">
            <div className="flex h-[155px] items-center justify-center rounded-[10px] bg-white overflow-hidden">
              {urlKembali ? <img src={urlKembali} alt="Kembali" className="h-full w-full object-cover" /> : <span className="text-sm text-gray-400">Belum diupload</span>}
            </div>
            <span className="mt-1 text-base font-semibold text-white">Foto Saat Tiba di Kantor Wilayah Kemenkumham</span>
          </div>
        </div>

        {/* Right Area: Action Buttons aligned perfectly to the right */}
        <div className="flex flex-col gap-4 shrink-0 pr-8">
          <button
            onClick={() => alert('Fitur kirim feedback sedang dikembangkan.')}
            className="w-[202px] h-[31px] rounded-[10px] bg-[#F4F6D5] text-[13px] font-semibold text-black hover:brightness-90 transition"
          >
            Send Feedback To User
          </button>
          <button
            onClick={() => onNavigate?.('review-final', emp)}
            className="w-[202px] h-[31px] rounded-[10px] bg-[#F4F6D5] text-sm font-semibold text-black hover:brightness-90 transition"
          >
            Next
          </button>
        </div>
    </div>
      </main >
    </div >
  );
}
