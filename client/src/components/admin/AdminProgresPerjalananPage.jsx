import { useState, useEffect } from 'react';
import logoKemenham from '../../assets/logo-kemenham.png';
const IC = '/images/admin/icons';
const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const DEMO = [
  { id:1, fullName:'Ahmad Fadillah', tujuanPerjalanan:'Jakarta', lama:'3', tglBerangkat:'2026-08-20', tglKembali:'2026-08-22', preEvent:'selesai', event:'selesai', postEvent:'belum' },
  { id:2, fullName:'Siti Nurhaliza', tujuanPerjalanan:'Bandung', lama:'2', tglBerangkat:'2026-08-18', tglKembali:'2026-08-19', preEvent:'selesai', event:'proses', postEvent:'belum' },
  { id:3, fullName:'Budi Santoso', tujuanPerjalanan:'Surabaya', lama:'5', tglBerangkat:'2026-08-15', tglKembali:'2026-08-19', preEvent:'selesai', event:'selesai', postEvent:'selesai' },
  { id:4, fullName:'Dewi Lestari', tujuanPerjalanan:'Yogyakarta', lama:'4', tglBerangkat:'2026-08-10', tglKembali:'2026-08-13', preEvent:'selesai', event:'selesai', postEvent:'proses' },
  { id:5, fullName:'Rizky Pratama', tujuanPerjalanan:'Semarang', lama:'2', tglBerangkat:'2026-08-22', tglKembali:'2026-08-23', preEvent:'proses', event:'belum', postEvent:'belum' },
  { id:6, fullName:'Anisa Rahma', tujuanPerjalanan:'Medan', lama:'3', tglBerangkat:'2026-08-25', tglKembali:'2026-08-27', preEvent:'selesai', event:'selesai', postEvent:'selesai' },
  { id:7, fullName:'Fajar Hidayat', tujuanPerjalanan:'Palembang', lama:'2', tglBerangkat:'2026-08-12', tglKembali:'2026-08-13', preEvent:'selesai', event:'proses', postEvent:'belum' },
  { id:8, fullName:'Rina Wulandari', tujuanPerjalanan:'Makassar', lama:'4', tglBerangkat:'2026-08-28', tglKembali:'2026-08-31', preEvent:'belum', event:'belum', postEvent:'belum' },
];

export default function AdminProgresPerjalananPage({ onBack, onLogout, onNavigate }) {
  const [n, setN] = useState('Admin');
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');

  useEffect(() => {
    try { const u = JSON.parse(localStorage.getItem('integra_admin_user') || 'null'); setN(u?.fullName || u?.full_name || 'Admin'); } catch {}
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const t = localStorage.getItem('integra_admin_token');
      const [rPre, rEv, rPost] = await Promise.all([
        fetch(`${API}/api/admin/perjalanan-dinas`, { headers: { Authorization: `Bearer ${t}` } }),
        fetch(`${API}/api/admin/event`, { headers: { Authorization: `Bearer ${t}` } }),
        fetch(`${API}/api/admin/post-event`, { headers: { Authorization: `Bearer ${t}` } })
      ]);
      
      if (rPre.ok && rEv.ok && rPost.ok) {
        const jPre = await rPre.json();
        const jEv = await rEv.json();
        const jPost = await rPost.json();
        
        const userMap = {};
        
        if (jPre.perjalanan) {
          jPre.perjalanan.forEach(p => {
            if (!userMap[p.userId]) {
              userMap[p.userId] = {
                id: p.id,
                userId: p.userId,
                fullName: p.fullName || 'Pegawai',
                tujuanPerjalanan: p.tujuanPerjalanan || p.tujuan_perjalanan || '-',
                lama: '-', tglBerangkat: '-', tglKembali: '-',
                preEvent: 'selesai',
                event: 'belum',
                postEvent: 'belum',
                preData: p,
                eventData: null,
                postData: null
              };
            }
          });
        }
        
        if (jEv.events) {
          jEv.events.forEach(e => {
            if (userMap[e.userId]) {
              userMap[e.userId].event = 'selesai';
              userMap[e.userId].eventData = e;
            }
          });
        }
        
        if (jPost.postEvents) {
          jPost.postEvents.forEach(pe => {
            const uid = pe.userId || pe.user_id;
            if (userMap[uid]) {
              userMap[uid].postEvent = 'selesai';
              userMap[uid].postData = pe;
            }
          });
        }
        
        const merged = Object.values(userMap);
        if (merged.length > 0) {
          setData(merged);
          return;
        }
      }
    } catch {}
    setData([]); // Removed DEMO fallback
  }

  const filtered = data.filter(d => {
    const matchSearch = !search || d.fullName.toLowerCase().includes(search.toLowerCase());
    if (tab === 'all') return matchSearch;
    if (tab === 'pre') return matchSearch && d.preEvent !== 'selesai';
    if (tab === 'event') return matchSearch && d.event !== 'selesai';
    if (tab === 'post') return matchSearch && d.postEvent !== 'selesai';
    return matchSearch;
  });

  function dot(status) {
    if (status === 'selesai') return '#86D8A8';
    if (status === 'proses') return '#E2DF8C';
    return '#A3F8FC';
  }

  function statusLabel(status) {
    if (status === 'selesai') return 'Selesai';
    if (status === 'proses') return 'Proses';
    return 'Belum';
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
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => onNavigate?.('progres')}>
            <img src={`${IC}/icon-commute.svg`} alt="" className="h-8 w-8 brightness-0 invert"/>
            <span className="text-base font-bold text-[#BFE3FF] leading-tight">Progres<br/>Perjalanan</span>
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
        <div className="mt-auto mb-12 px-6">
          <button onClick={onLogout} className="text-base font-bold hover:opacity-80">Logout</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-y-auto bg-[#072D6C]">
        {/* Header Bar */}
        <div className="mx-4 mt-0 flex h-[141px] shrink-0 items-center justify-between rounded-xl bg-[#D9D9D9] px-16">
          <div className="flex items-center gap-4">
            <svg width="43" height="48" viewBox="0 0 43 48" fill="none" className="shrink-0">
              <rect x="1" y="1" width="41" height="46" rx="5" stroke="#072D6C" strokeWidth="3"/>
              <path d="M10 12h23M10 24h23M10 36h14" stroke="#072D6C" strokeWidth="3" strokeLinecap="round"/>
            </svg>
            <span className="text-5xl font-black text-[#072D6C]">Progres Perjalanan</span>
          </div>
          <div className="flex items-center gap-7">
            <img src={`${IC}/icon-bell.svg`} alt="" className="h-8 w-7"/>
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-black/60">Profile</span>
                <span className="text-sm font-bold text-black">{n}</span>
              </div>
              <img src={`${IC}/icon-profile.svg`} alt="" className="h-9 w-9"/>
            </div>
          </div>
        </div>

        {/* Search + Filter Tabs */}
        <div className="mx-16 mt-6 flex items-center gap-6">
          {/* Search Bar */}
          <div className="flex flex-1 items-center gap-2 rounded-[10px] bg-white px-3 py-[7px]">
            <img src={`${IC}/icon-search-magnify.svg`} alt="" className="h-4 w-4 opacity-60"/>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Nama Pegawai"
              className="flex-1 bg-transparent text-[17px] font-semibold text-black/60 outline-none placeholder:text-black/60"
            />
          </div>
          {/* Tabs */}
          {[['all','Semua'],['pre','Pre-Event'],['event','Event'],['post','Post-Event']].map(([k,v])=>(
            <button key={k} onClick={()=>setTab(k)}
              className={`rounded-[10px] px-8 py-[7px] text-xl font-semibold transition ${tab===k ? 'bg-[#ACD9FF] text-black' : 'bg-white text-black hover:bg-gray-100'}`}
            >{v}</button>
          ))}
        </div>

        {/* Table */}
        <div className="mx-16 mt-6 pb-12">
          {/* Table Header */}
          <div className="grid grid-cols-[50px_1fr_1fr_100px_130px_130px_120px_120px_120px_140px] items-center border-b-[3px] border-black pb-3">
            <span className="text-xl font-extrabold text-white">No</span>
            <span className="text-xl font-extrabold text-white">Nama</span>
            <span className="text-xl font-extrabold text-white">Tujuan</span>
            <span className="text-xl font-extrabold text-white text-center">Lama<br/>(Hari)</span>
            <span className="text-xl font-extrabold text-white text-center">Tgl<br/>Berangkat</span>
            <span className="text-xl font-extrabold text-white text-center">Tgl<br/>Kembali</span>
            <span className="text-xl font-extrabold text-white text-center">Pre-Event</span>
            <span className="text-xl font-extrabold text-white text-center">Event</span>
            <span className="text-xl font-extrabold text-white text-center">Post-Event</span>
            <span></span>
          </div>

          {/* Table Rows */}
          {filtered.map((d, i) => (
            <div key={d.id} className="grid grid-cols-[50px_1fr_1fr_100px_130px_130px_120px_120px_120px_140px] items-center border-b border-[#AFA2A2] py-4">
              <span className="text-lg font-semibold text-white">{i + 1}</span>
              <span className="text-lg font-semibold text-white">{d.fullName}</span>
              <span className="text-lg font-semibold text-white">{d.tujuanPerjalanan}</span>
              <span className="text-lg font-semibold text-white text-center">{d.lama}</span>
              <span className="text-lg font-semibold text-white text-center">{d.tglBerangkat}</span>
              <span className="text-lg font-semibold text-white text-center">{d.tglKembali}</span>
              <div className="flex justify-center">
                <span className="inline-block h-5 w-5 rounded-full" style={{ backgroundColor: dot(d.preEvent) }} title={statusLabel(d.preEvent)}/>
              </div>
              <div className="flex justify-center">
                <span className="inline-block h-5 w-5 rounded-full" style={{ backgroundColor: dot(d.event) }} title={statusLabel(d.event)}/>
              </div>
              <div className="flex justify-center">
                <span className="inline-block h-5 w-5 rounded-full" style={{ backgroundColor: dot(d.postEvent) }} title={statusLabel(d.postEvent)}/>
              </div>
              <div className="flex items-center gap-[6px] justify-end cursor-pointer hover:opacity-80" onClick={() => onNavigate?.('review-pre', d)}>
                <span className="text-xl font-semibold text-white tracking-[-0.01em]">Review</span>
                <img src={`${IC}/icon-review-pen.svg`} alt="" className="h-5 w-5 brightness-0 invert cursor-pointer hover:opacity-80"/>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="py-12 text-center text-xl font-semibold text-white/60">Tidak ada data perjalanan dinas.</div>
          )}
        </div>

        {/* Legend */}
        <div className="mx-16 mb-8 flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="inline-block h-4 w-4 rounded-full bg-[#86D8A8]"/>
            <span className="text-sm font-semibold text-white">Selesai</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-4 w-4 rounded-full bg-[#E2DF8C]"/>
            <span className="text-sm font-semibold text-white">Proses</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-4 w-4 rounded-full bg-[#A3F8FC]"/>
            <span className="text-sm font-semibold text-white">Belum</span>
          </div>
        </div>
      </main>
    </div>
  );
}
