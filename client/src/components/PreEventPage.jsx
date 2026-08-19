import { useState, useEffect, useMemo, useRef } from 'react';
import logoKemenham from '../assets/logo-kemenham.png';

const JENIS_TRANSPORTASI = ['Umum', 'Pribadi'];
const DETAIL_TRANSPORTASI = {
  Umum: ['Mobil', 'Bus', 'Kereta', 'Pesawat'],
  Pribadi: ['Mobil', 'Motor'],
};
const KAPAL_BY_JENIS = {
  Umum: ['Mobil', 'Bus', 'Kereta'],
  Pribadi: ['Mobil', 'Motor'],
};
const KEBUTUHAN_UMUM = ['Sewa Kendaraan', 'Taxi/Ojek/Angkot/Transum Lainnya', 'E-Money', 'Lainnya'];

function formatTimestamp(date) {
  const parts = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type) => parts.find((p) => p.type === type)?.value || '';
  return `${get('day')}-${get('month')}-${get('year')} ${get('hour')}:${get('minute')}:${get('second')} WIB`;
}

function PreEventPage({ onBack, onNext, onOpenProfile, readOnly }) {
  const loadDraft = () => { try { return JSON.parse(localStorage.getItem('integra_pre_event_draft')) || {}; } catch { return {}; } };
  const draft = loadDraft();
  const [user, setUser] = useState(null);
  const [tujuan, setTujuan] = useState(draft.tujuan || '');
  const [tempat, setTempat] = useState(draft.tempat || '');
  const [jenisTransportasi, setJenisTransportasi] = useState(draft.jenisTransportasi || '');
  const [detailTransportasi, setDetailTransportasi] = useState(draft.detailTransportasi || '');
  const [gunakanKapalLaut, setGunakanKapalLaut] = useState(draft.gunakanKapalLaut ?? null);
  const [kebutuhanTambahan, setKebutuhanTambahan] = useState(draft.kebutuhanTambahan || []);
  const [nominalBiaya, setNominalBiaya] = useState(draft.nominalBiaya || '');
  const [fotoList, setFotoList] = useState(draft.fotoTiket || []);
  const [lainnyaItems, setLainnyaItems] = useState(draft.lainnyaItems || []);
  const [showIzinModal, setShowIzinModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStatus, setCameraStatus] = useState('');
  const [cameraDenied, setCameraDenied] = useState(false);

  // Ponytail: gunakan ref agar perubahan stream tidak trigger re-render + cleanup
  const cameraStreamRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [streamReady, setStreamReady] = useState(false);

  const [jenisOpen, setJenisOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [lainnyaOpen, setLainnyaOpen] = useState(false);
  const [lainnyaInput, setLainnyaInput] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('integra_user');
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch { setUser(null); }
    }
  }, []);

  // Cleanup hanya saat komponen unmount
  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
        cameraStreamRef.current = null;
      }
    };
  }, []);

  const releaseStream = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    setStreamReady(false);
  };

  const startCamera = async () => {
    releaseStream();
    setCameraStatus('Meminta izin kamera...');
    setCameraDenied(false);
    setShowCamera(true);

    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

    // Tentukan constraint: mobile → back camera dulu; desktop → default
    const constraints = isMobile
      ? [
          { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
          { video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        ]
      : [
          { video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        ];

    for (const constraint of constraints) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraint);
        cameraStreamRef.current = stream;
        setStreamReady(true);
        setCameraStatus('Kamera siap — klik tombol untuk mengambil foto');
        setCameraDenied(false);
        return;
      } catch (e) {
        releaseStream();
        if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
          setCameraDenied(true);
          setCameraStatus('Akses kamera ditolak oleh browser');
          return;
        }
        if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError' || e.name === 'OverconstrainedError') {
          // lanjut ke constraint berikutnya
          continue;
        }
        setCameraDenied(false);
        setCameraStatus(`Gagal: ${e.message || 'Kesalahan tidak dikenal'}`);
        return;
      }
    }

    // Semua constraint gagal
    if (!streamReady) {
      setCameraDenied(false);
      setCameraStatus('Tidak ada kamera yang tersedia di perangkat ini');
    }
  };

  // Hubungkan stream ke video setelah stream siap
  useEffect(() => {
    if (!streamReady) return;

    const vid = videoRef.current;
    if (!vid || !cameraStreamRef.current) {
      // ponytail: retry setelah render jika ref belum siap
      const retry = setTimeout(() => {
        const v = videoRef.current;
        if (v && cameraStreamRef.current) {
          v.srcObject = cameraStreamRef.current;
          v.play().catch(() => v.play());
        }
      }, 100);
      return () => clearTimeout(retry);
    }

    vid.srcObject = cameraStreamRef.current;
    vid.play().catch(() => vid.play());
  }, [streamReady]);

  const getGps = () => {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), 10000);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timer);
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy || null,
          });
        },
        () => { clearTimeout(timer); resolve(null); },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const fetchServerTime = async () => {
    try {
      const token = localStorage.getItem('integra_token');
      const res = await fetch('http://localhost:5000/api/time');
      if (res.ok) {
        const data = await res.json();
        return data.wib; // format: "05-Agu-2026 14:30:00 WIB"
      }
    } catch { /* fallback ke client time */ }
    return formatTimestamp(new Date());
  };

  const captureFoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    setCameraStatus('Mengambil foto...');

    const vw = video.videoWidth || 1280;
    const vh = video.videoHeight || 720;
    canvas.width = vw;
    canvas.height = vh;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, vw, vh);

    // Ambil server time (anti-fraud) + GPS
    const [serverTimestamp, gps] = await Promise.all([
      fetchServerTime(),
      getGps().catch(() => null),
    ]);

    const wm = gps
      ? `${serverTimestamp}\nGPS: ${gps.lat.toFixed(6)}, ${gps.lng.toFixed(6)} (akurasi: ${gps.accuracy ? Math.round(gps.accuracy) + 'm' : '?'})`
      : `${serverTimestamp}\n(GPS tidak tersedia)`;

    ctx.font = `bold ${Math.max(16, Math.floor(vw / 40))}px Inter, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 2;
    const lines = wm.split('\n');
    const lineH = Math.floor(vh / 22);
    lines.forEach((line, i) => {
      const m = ctx.measureText(line);
      const tx = vw - m.width - 16;
      const ty = vh - (lines.length - i) * lineH - 16;
      ctx.strokeText(line, tx, ty);
      ctx.fillText(line, tx, ty);
    });

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    return {
      dataUrl,
      lat: gps?.lat || null,
      lng: gps?.lng || null,
      accuracy: gps?.accuracy || null,
      timestamp: serverTimestamp,
    };
  };

  const handleAmbilGambar = async () => {
    const foto = await captureFoto();
    if (foto) {
      setFotoList((prev) => [...prev, foto]);
    }
    // Tutup kamera setelah foto
    releaseStream();
    setShowCamera(false);
    setCameraStatus('');
  };

  const handleBatal = () => {
    releaseStream();
    setShowCamera(false);
    setCameraStatus('');
    setCameraDenied(false);
  };

  const hapusFoto = (i) => setFotoList((prev) => prev.filter((_, idx) => idx !== i));
  const handleJenisChange = (v) => { setJenisTransportasi(v); setDetailTransportasi(''); setGunakanKapalLaut(null); setKebutuhanTambahan([]); setJenisOpen(false); };
  const handleDetailChange = (v) => { setDetailTransportasi(v); setDetailOpen(false); if (!(KAPAL_BY_JENIS[jenisTransportasi] || []).includes(v)) setGunakanKapalLaut(null); };
  const toggleKebutuhan = (item) => {
    if (item === 'Lainnya') {
      if (lainnyaOpen) { setLainnyaOpen(false); setLainnyaInput(''); setLainnyaItems([]); setKebutuhanTambahan(p => p.filter(k => k !== 'Lainnya')); }
      else { setLainnyaOpen(true); setKebutuhanTambahan(p => [...p, 'Lainnya']); }
    } else {
      setKebutuhanTambahan((prev) => prev.includes(item) ? prev.filter((k) => k !== item) : [...prev, item]);
    }
  };
  const tambahLainnya = () => {
    const val = lainnyaInput.trim();
    if (!val) return;
    setLainnyaItems(p => [...p, val]);
    setLainnyaInput('');
  };
  const hapusLainnya = (i) => setLainnyaItems(p => p.filter((_, idx) => idx !== i));

  const detailOptions = useMemo(() => DETAIL_TRANSPORTASI[jenisTransportasi] || [], [jenisTransportasi]);
  const showDetail = jenisTransportasi !== '';
  const showKapal = detailTransportasi && (KAPAL_BY_JENIS[jenisTransportasi] || []).includes(detailTransportasi);
  const detailDipilih = detailTransportasi !== '';
  const showUploadTiket = detailDipilih && (jenisTransportasi === 'Umum' || (jenisTransportasi === 'Pribadi' && gunakanKapalLaut === true));
  const canSubmit = tujuan.trim() && tempat.trim() && jenisTransportasi && detailDipilih;

  // Auto-clear error saat user mengisi form
  useEffect(() => { if (formError) setFormError(''); }, [tujuan, tempat, jenisTransportasi, detailTransportasi, gunakanKapalLaut]);

  // Auto-save draft ke localStorage
  useEffect(() => {
    const draft = { tujuan, tempat, jenisTransportasi, detailTransportasi, gunakanKapalLaut, kebutuhanTambahan, lainnyaItems, nominalBiaya, fotoTiket: fotoList };
    localStorage.setItem('integra_pre_event_draft', JSON.stringify(draft));
  }, [tujuan, tempat, jenisTransportasi, detailTransportasi, gunakanKapalLaut, kebutuhanTambahan, lainnyaItems, nominalBiaya, fotoList]);

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[390px] flex-col bg-white font-['Inter'] sm:max-w-md">
      {/* =============== MODAL IZIN =============== */}
      {showIzinModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-6">
          <div className="w-full max-w-[320px] rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-2 text-center text-[32px]">⚠️</div>
            <h2 className="mb-1 text-center text-[16px] font-extrabold text-[#04305F]">
              Izinkan Akses Kamera & Lokasi
            </h2>
            <p className="mb-4 text-center text-[12px] font-bold text-gray-600">
              agar foto tidak error. Saat browser meminta izin, pilih <span className="text-green-700">"Izinkan"</span> untuk Kamera & Lokasi.
            </p>
            <div className="flex justify-center gap-4">
              <button type="button" onClick={() => { setShowIzinModal(false); startCamera(); }}
                className="rounded-lg bg-[#04305F] px-6 py-2 text-[14px] font-bold text-white hover:brightness-110">
                Mulai
              </button>
              <button type="button" onClick={() => setShowIzinModal(false)}
                className="rounded-lg border border-gray-300 px-6 py-2 text-[14px] font-bold text-gray-600">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =============== OVERLAY KAMERA =============== */}
      {showCamera && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          {streamReady ? (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-8 bg-black/60 p-4">
                <button type="button" onClick={handleAmbilGambar}
                  className="flex h-[48px] w-[48px] items-center justify-center rounded-full border-[3px] border-white bg-white/20">
                  <div className="h-[32px] w-[32px] rounded-full bg-white" />
                </button>
                <button type="button" onClick={handleBatal}
                  className="rounded-full bg-red-600 px-5 py-2 text-[14px] font-bold text-white">Batal</button>
              </div>
              {cameraStatus && (
                <div className="absolute left-4 top-4 rounded bg-black/50 px-3 py-1 text-[12px] text-white">{cameraStatus}</div>
              )}
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center px-6 text-center">
              <div>
                <p className="mb-3 text-[16px] font-bold text-white">{cameraStatus || 'Memulai kamera...'}</p>
                {cameraDenied && (
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-[12px] text-gray-300">Cek pengaturan browser → {navigator.userAgent.includes('Chrome') ? 'chrome://settings/content/camera' : 'Pengaturan Situs'} → Izinkan Kamera & Lokasi</p>
                    <button type="button" onClick={startCamera}
                      className="rounded-lg bg-[#04305F] px-6 py-2 text-[14px] font-bold text-white">Coba Lagi</button>
                  </div>
                )}
                {!cameraDenied && (
                  <button type="button" onClick={handleBatal} className="mt-3 rounded-full bg-red-600 px-5 py-2 text-[14px] font-bold text-white">Batal</button>
                )}
              </div>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* =============== NAVBAR CORE UI =============== */}
      <header className="bg-[#D5E8FA] px-6 pb-[18px] pt-[18px]">
        <div className="flex items-center justify-between">
          {/* Logo Kemenham */}
          <div className="flex h-[clamp(42px,10vw,59px)] w-[clamp(42px,10vw,59px)] items-center">
            <img src={logoKemenham} alt="KEMENHAM" className="h-full w-full object-contain" />
          </div>
          {/* Profile */}
          <button type="button" onClick={() => onOpenProfile?.()} className="flex items-center gap-[5px]">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-[#124CA3]">Profile</span>
              <span className="text-[11px] font-bold text-black">{user?.fullName || user?.full_name || 'Demo User'}</span>
            </div>
            <svg width="37" height="37" viewBox="0 0 44 44" fill="currentColor" className="text-black shrink-0"><path d="M22 2c-8.8 0-16 7.2-16 16s7.2 16 16 16 16-7.2 16-16S30.8 2 22 2zm0 6c3.3 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6 2.7-6 6-6zm0 26.4c-4.8 0-9-2.4-11.4-6 2.4-3.6 6.6-6 11.4-6s9 2.4 11.4 6c-2.4 3.6-6.6 6-11.4 6z" /></svg>
          </button>
        </div>
        <h1 className="mt-[10px] text-[14px] font-extrabold text-[#04305F]">Pre - Event</h1>
      </header>

      {/* =============== FORM =============== */}
      <form onSubmit={(e) => e.preventDefault()} className={`flex flex-col gap-5 px-[clamp(18px,5vw,23px)] pt-[clamp(30px,6vh,45px)] ${readOnly ? 'pointer-events-none opacity-70 select-none' : ''}`}>
        <div className="flex flex-col gap-1">
          <label htmlFor="tujuan" className="text-[13px] font-bold text-black">Tujuan Perjalanan</label>
          <input id="tujuan" type="text" value={tujuan} onChange={(e) => setTujuan(e.target.value)} placeholder=" " className="h-[27px] w-full rounded-[7px] bg-[#D9D9D9] px-2 text-[13px] font-bold text-black outline-none" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="tempat" className="text-[13px] font-bold text-black">Tempat Pelaksanaan Tujuan Perjalanan</label>
          <input id="tempat" type="text" value={tempat} onChange={(e) => setTempat(e.target.value)} placeholder=" " className="h-[27px] w-full rounded-[7px] bg-[#D9D9D9] px-2 text-[13px] font-bold text-black outline-none" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-bold text-black">Transportasi yang dipergunakan</label>
          <div className="relative">
            <button type="button" onClick={() => setJenisOpen((v) => !v)} className="flex h-[27px] w-full items-center gap-2 rounded-[7px] bg-[#D9D9D9] px-2 text-left">
              <svg width="14" height="11" viewBox="0 0 14 11" fill="none" className="shrink-0 text-black"><path d="M1 2L7 8L13 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span className="text-[15px] font-bold text-black">{jenisTransportasi || 'Pilih Jenis'}</span>
            </button>
            {jenisOpen && <div className="absolute left-0 top-full z-30 mt-1 w-full rounded-[7px] border border-[#D9D9D9] bg-white shadow-lg overflow-hidden">
              {JENIS_TRANSPORTASI.map((j) => <button key={j} type="button" onClick={() => handleJenisChange(j)} className={`w-full px-10 py-2 text-left text-[15px] font-bold hover:bg-[#D5E8FA] ${j === jenisTransportasi ? 'bg-[#D5E8FA]/50 text-[#04305F]' : 'text-black'}`}>{j}</button>)}
            </div>}
          </div>
        </div>
        {showDetail && <div className="flex flex-col gap-2">
          <label className="text-[13px] font-bold text-black">
            {jenisTransportasi === 'Pribadi' ? 'Detail Kendaraan Pribadi' : 'Detail Transportasi'}
          </label>
          <div className="relative">
            <button type="button" onClick={() => setDetailOpen((v) => !v)} className="flex h-[27px] w-full items-center gap-2 rounded-[7px] bg-[#D9D9D9] px-2 text-left">
              <svg width="14" height="11" viewBox="0 0 14 11" fill="none" className="shrink-0 text-black"><path d="M1 2L7 8L13 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span className="text-[15px] font-bold text-black">{detailTransportasi || 'Pilih Transportasi'}</span>
            </button>
            {detailOpen && <div className="absolute left-0 top-full z-30 mt-1 w-full rounded-[7px] border border-[#D9D9D9] bg-white shadow-lg overflow-hidden">
              {detailOptions.map((d) => <button key={d} type="button" onClick={() => handleDetailChange(d)} className={`w-full px-10 py-2 text-left text-[15px] font-bold hover:bg-[#D5E8FA] ${d === detailTransportasi ? 'bg-[#D5E8FA]/50 text-[#04305F]' : 'text-black'}`}>{d}</button>)}
            </div>}
          </div>
        </div>}
        {showKapal && <div className="flex flex-col gap-2">
          <span className="text-[13px] font-bold text-black">Gunakan Kapal Laut?</span>
          <div className="flex items-center gap-8">
            <button type="button" onClick={() => setGunakanKapalLaut(true)} className="flex items-center gap-[6px]">
              <div className={`flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full border-[3px] ${gunakanKapalLaut === true ? 'border-[#04305F] bg-[#04305F]' : 'border-[#D9D9D9] bg-white'} shadow-[0_3px_5px_0_rgba(46,46,66,0.08)]`}>
                {gunakanKapalLaut === true && <div className="h-[8px] w-[8px] rounded-full bg-white" />}
              </div>
              <span className="text-[15px] leading-[20px] text-black">Ya</span>
            </button>
            <button type="button" onClick={() => setGunakanKapalLaut(false)} className="flex items-center gap-[6px]">
              <div className={`flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full border-[3px] ${gunakanKapalLaut === false ? 'border-[#04305F] bg-[#04305F]' : 'border-[#D9D9D9] bg-white'} shadow-[0_3px_5px_0_rgba(46,46,66,0.08)]`}>
                {gunakanKapalLaut === false && <div className="h-[8px] w-[8px] rounded-full bg-white" />}
              </div>
              <span className="text-[15px] leading-[20px] text-black">Tidak</span>
            </button>
          </div>
        </div>}
        {detailDipilih && <div className="flex flex-col gap-2 rounded-lg p-2">
          <span className="text-[13px] font-bold text-black">Kebutuhan Tambahan ({jenisTransportasi})</span>
          {KEBUTUHAN_UMUM.map((item) => (
            <button key={item} type="button" onClick={() => toggleKebutuhan(item)} className="flex items-center gap-2 self-start">
              <div className={`flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded border-2 ${kebutuhanTambahan.includes(item) ? 'border-[#04305F] bg-[#04305F]' : 'border-[#E5E6EB] bg-white'}`}>
                {kebutuhanTambahan.includes(item) && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </div>
              <span className="text-[13px] leading-[22px] text-[#1D2129]">{item}</span>
            </button>
          ))}
          {/* "Lainnya" — input custom (Figma 2345:315) */}
          {lainnyaOpen && (
            <div className="flex flex-col gap-2 pl-6">
              <div className="flex items-center gap-2">
                <input type="text" value={lainnyaInput} onChange={e => setLainnyaInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && tambahLainnya()} placeholder="Ketik kebutuhan di sini.." className="h-[22px] flex-1 rounded-[7px] bg-[#D9D9D9] px-2 text-[12px] text-black outline-none" />
                <button type="button" onClick={tambahLainnya} className="rounded-[7px] bg-[#04305F] px-3 py-[3px] text-[10px] font-bold text-white">Tambah</button>
              </div>
              <p className="text-[8px] text-gray-500">Misal: BBM/E-Toll</p>
              {lainnyaItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-[7px] bg-[#D5E8FA] px-2 py-1">
                  <span className="text-[11px] text-black">{item}</span>
                  <button type="button" onClick={() => hapusLainnya(i)} className="text-[10px] font-bold text-red-500">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>}
        {showUploadTiket && <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-black">Upload Tiket Transportasi</span>
            <span className="text-[8px] font-bold text-red-500">Foto dapat diambil lebih dari 1x</span>
          </div>
          <button type="button" onClick={() => setShowIzinModal(true)} className="flex h-[49px] w-full items-center justify-center gap-2 rounded-[7px] bg-[#D9D9D9] text-black hover:bg-[#C0C0C0] transition-colors">
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 3H13.5L12 1H6L4.5 3H2C1.2 3 0.5 3.7 0.5 4.5V12.5C0.5 13.3 1.2 14 2 14H16C16.8 14 17.5 13.3 17.5 12.5V4.5C17.5 3.7 16.8 3 16 3Z" /><circle cx="9" cy="8" r="3" /></svg>
            <span className="text-[12px] font-bold">Ambil Gambar</span>
          </button>
          {fotoList.length > 0 && <div className="flex flex-col gap-2">
            {fotoList.map((foto, idx) => (
              <div key={idx} className="relative rounded-[7px] border border-[#D9D9D9] overflow-hidden">
                <img src={foto.dataUrl} alt={`Tiket ${idx + 1}`} className="h-auto w-full object-contain" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-[10px] text-white">{foto.timestamp}{foto.lat && ` — GPS: ${foto.lat.toFixed(4)}, ${foto.lng.toFixed(4)}`}{foto.accuracy && ` (±${Math.round(foto.accuracy)}m)`}</div>
                <button type="button" onClick={() => hapusFoto(idx)} className="absolute right-1 top-1 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-red-500 text-[12px] font-bold text-white">✕</button>
              </div>
            ))}
          </div>}
        </div>}
        {showUploadTiket && <div className="flex flex-col gap-1">
          <label htmlFor="nominalBiaya" className="text-[13px] font-bold text-black">Masukkan Nominal Biaya Tiket</label>
          <input id="nominalBiaya" type="text" inputMode="numeric" value={nominalBiaya} onChange={(e) => setNominalBiaya(e.target.value)} placeholder=" " className="h-[27px] w-full rounded-[7px] bg-[#D9D9D9] px-2 text-[13px] font-bold text-black outline-none" />
        </div>}
      </form>
      <div className="flex-1" />
      <div className="flex items-center justify-between px-[clamp(18px,5vw,25px)] pb-[clamp(24px,4vh,40px)]">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1 rounded-[35px] bg-[#04305F] px-[clamp(12px,4vw,16px)] py-[3px] text-white hover:brightness-110 active:scale-95">
          <svg width="21" height="24" viewBox="0 0 21 24" fill="none"><path d="M17 3L4 12L17 21" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span className="text-[14px] font-extrabold">{readOnly ? 'Kembali' : 'Back'}</span>
        </button>
        <button type="button" onClick={() => {
          if (readOnly) { onNext?.({ tujuan: tujuan.trim(), tempat: tempat.trim(), jenisTransportasi, detailTransportasi, gunakanKapalLaut: gunakanKapalLaut ?? false, kebutuhanTambahan, lainnyaItems, fotoTiket: fotoList, nominalBiaya }); return; }
          const missing = [];
          if (!tujuan.trim()) missing.push('Tujuan Perjalanan');
          if (!tempat.trim()) missing.push('Tempat Pelaksanaan');
          if (!jenisTransportasi) missing.push('Transportasi');
          if (!detailTransportasi) missing.push('Detail Transportasi');
          else if (showKapal && gunakanKapalLaut === null) missing.push('Gunakan Kapal Laut? (Ya/Tidak)');
          if (showUploadTiket) {
            if (fotoList.length === 0) missing.push('Upload Tiket Transportasi');
            if (!nominalBiaya.trim()) missing.push('Nominal Biaya Tiket');
          }
          if (missing.length > 0) { setFormError(`Lengkapi: ${missing.join(', ')}`); return; }
          setFormError('');
          onNext?.({ tujuan: tujuan.trim(), tempat: tempat.trim(), jenisTransportasi, detailTransportasi, gunakanKapalLaut: gunakanKapalLaut ?? false, kebutuhanTambahan, lainnyaItems, fotoTiket: fotoList, nominalBiaya });
        }} className="inline-flex items-center gap-1 rounded-[35px] bg-[#04305F] px-[clamp(12px,4vw,16px)] py-[3px] text-white hover:brightness-110 active:scale-95">
          <span className="text-[14px] font-extrabold">{readOnly ? 'Lanjut' : 'Next'}</span>
        </button>
      </div>
      {formError && <p className="mx-[clamp(18px,5vw,25px)] mb-[12px] text-center text-[12px] font-bold text-red-600">{formError}</p>}
    </div>
  );
}

export default PreEventPage;