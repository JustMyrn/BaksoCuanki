import { useState, useEffect, useRef } from 'react';
import logoKemenham from '../assets/logo-kemenham.png';

const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const pad2 = (n) => String(n).padStart(2,'0');

function formatTimestamp(date) {
  return `${pad2(date.getDate())}-${MONTHS[date.getMonth()]}-${date.getFullYear()} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())} WIB`;
}

function PreEventFinalPage({ onBack, onNext, onSave, onOpenProfile, preEventData, submitted, onReset }) {
  const draftKey = 'integra_pre_event_final_draft';
  const load = () => { try { return JSON.parse(localStorage.getItem(draftKey)) || {}; } catch { return {}; } };
  const d = load();
  const [user, setUser] = useState(null);
  const [uangHarian, setUangHarian] = useState(d.uangHarian || false);
  const [ketUangHarian, setKetUangHarian] = useState(d.ketUangHarian || '');
  const [transportTambahan, setTransportTambahan] = useState(d.transportTambahan || false);
  const [ketTransportTambahan, setKetTransportTambahan] = useState(d.ketTransportTambahan || '');
  const [nominalTambahan, setNominalTambahan] = useState(d.nominalTambahan || '');
  const [notaList, setNotaList] = useState(d.notaKebutuhan || []);
  const [fotoTitikList, setFotoTitikList] = useState(d.fotoTitikAwal || []);
  const [formError, setFormError] = useState('');
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [cameraTarget, setCameraTarget] = useState(null);
  const [showIzinModal, setShowIzinModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStatus, setCameraStatus] = useState('');
  const [cameraDenied, setCameraDenied] = useState(false);
  const cameraStreamRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [streamReady, setStreamReady] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('integra_user');
    if (storedUser) { try { setUser(JSON.parse(storedUser)); } catch { setUser(null); } }
  }, []);

  // Auto-save draft
  useEffect(() => {
    localStorage.setItem(draftKey, JSON.stringify({ uangHarian, ketUangHarian, transportTambahan, ketTransportTambahan, nominalTambahan, notaKebutuhan: notaList, fotoTitikAwal: fotoTitikList }));
  }, [uangHarian, ketUangHarian, transportTambahan, ketTransportTambahan, nominalTambahan, notaList, fotoTitikList]);

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
    const constraints = isMobile
      ? [
          { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
          { video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        ]
      : [{ video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false }];
    for (const constraint of constraints) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraint);
        cameraStreamRef.current = stream;
        setStreamReady(true);
        setCameraStatus('Kamera siap');
        setCameraDenied(false);
        return;
      } catch (e) {
        releaseStream();
        if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
          setCameraDenied(true); setCameraStatus('Akses kamera ditolak'); return;
        }
        if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError' || e.name === 'OverconstrainedError') continue;
        setCameraStatus(`Gagal: ${e.message || ''}`); return;
      }
    }
    setCameraStatus('Tidak ada kamera yang tersedia');
  };

  useEffect(() => {
    if (!streamReady) return;
    const vid = videoRef.current;
    if (!vid || !cameraStreamRef.current) {
      const retry = setTimeout(() => {
        const v = videoRef.current;
        if (v && cameraStreamRef.current) { v.srcObject = cameraStreamRef.current; v.play().catch(() => v.play()); }
      }, 100);
      return () => clearTimeout(retry);
    }
    vid.srcObject = cameraStreamRef.current;
    vid.play().catch(() => vid.play());
  }, [streamReady]);

  const getGps = () => new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), 10000);
    navigator.geolocation.getCurrentPosition(
      (pos) => { clearTimeout(timer); resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy || null }); },
      () => { clearTimeout(timer); resolve(null); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });

  const fetchServerTime = async () => {
    try { const r = await fetch('http://localhost:5000/api/time'); if (r.ok) return (await r.json()).wib; } catch {}
    return formatTimestamp(new Date());
  };

  const captureFoto = async () => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c) return null;
    setCameraStatus('Mengambil foto...');
    const vw = v.videoWidth || 1280, vh = v.videoHeight || 720;
    c.width = vw; c.height = vh;
    const ctx = c.getContext('2d'); ctx.drawImage(v, 0, 0, vw, vh);
    const [st, gps] = await Promise.all([fetchServerTime(), getGps().catch(() => null)]);
    const wm = gps ? `${st}\nGPS: ${gps.lat.toFixed(6)}, ${gps.lng.toFixed(6)} (akurasi: ${gps.accuracy ? Math.round(gps.accuracy)+'m' : '?'})` : `${st}\n(GPS tidak tersedia)`;
    ctx.font = `bold ${Math.max(16,Math.floor(vw/40))}px Inter,sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 2;
    wm.split('\n').forEach((l,i) => { const m = ctx.measureText(l); ctx.strokeText(l,vw-m.width-16,vh-(2-i)*Math.floor(vh/22)-16); ctx.fillText(l,vw-m.width-16,vh-(2-i)*Math.floor(vh/22)-16); });
    return { dataUrl: c.toDataURL('image/jpeg',0.85), lat: gps?.lat||null, lng: gps?.lng||null, accuracy: gps?.accuracy||null, timestamp: st };
  };

  const handleAmbilGambar = async () => {
    const foto = await captureFoto();
    if (foto) {
      if (cameraTarget === 'nota') setNotaList(p => [...p, foto]);
      else if (cameraTarget === 'titik') setFotoTitikList(p => [...p, foto]);
    }
    releaseStream(); setShowCamera(false); setCameraStatus(''); setCameraTarget(null);
  };

  const handleBatal = () => { releaseStream(); setShowCamera(false); setCameraStatus(''); setCameraDenied(false); setCameraTarget(null); };
  const openCameraFor = (t) => { setCameraTarget(t); setShowIzinModal(true); };

  const hapusNota = (i) => setNotaList(p => p.filter((_, idx) => idx !== i));
  const hapusTitik = (i) => setFotoTitikList(p => p.filter((_, idx) => idx !== i));

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[390px] flex-col bg-white font-['Inter'] sm:max-w-md">
      {/* MODAL IZIN */}
      {showIzinModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-6">
          <div className="w-full max-w-[320px] rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-2 text-center text-[32px]">⚠️</div>
            <h2 className="mb-1 text-center text-[16px] font-extrabold text-[#04305F]">Izinkan Akses Kamera & Lokasi</h2>
            <p className="mb-4 text-center text-[12px] font-bold text-gray-600">agar foto tidak error. Pilih <span className="text-green-700">"Izinkan"</span> untuk Kamera & Lokasi.</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => { setShowIzinModal(false); startCamera(); }} className="rounded-lg bg-[#04305F] px-6 py-2 text-[14px] font-bold text-white">Mulai</button>
              <button onClick={() => setShowIzinModal(false)} className="rounded-lg border px-6 py-2 text-[14px] font-bold text-gray-600">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY KAMERA */}
      {showCamera && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          {streamReady ? (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-8 bg-black/60 p-4">
                <button onClick={handleAmbilGambar} className="flex h-[48px] w-[48px] items-center justify-center rounded-full border-[3px] border-white bg-white/20"><div className="h-[32px] w-[32px] rounded-full bg-white" /></button>
                <button onClick={handleBatal} className="rounded-full bg-red-600 px-5 py-2 text-[14px] font-bold text-white">Batal</button>
              </div>
              {cameraStatus && <div className="absolute left-4 top-4 rounded bg-black/50 px-3 py-1 text-[12px] text-white">{cameraStatus}</div>}
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center px-6 text-center">
              <div>
                <p className="mb-3 text-[16px] font-bold text-white">{cameraStatus || 'Memulai kamera...'}</p>
                {cameraDenied && <div className="flex flex-col items-center gap-3"><p className="text-[12px] text-gray-300">Cek pengaturan browser → Izinkan Kamera & Lokasi</p><button onClick={startCamera} className="rounded-lg bg-[#04305F] px-6 py-2 text-[14px] font-bold text-white">Coba Lagi</button></div>}
                {!cameraDenied && <button onClick={handleBatal} className="mt-3 rounded-full bg-red-600 px-5 py-2 text-[14px] font-bold text-white">Batal</button>}
              </div>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* NAVBAR CORE UI */}
      <header className="bg-[#D5E8FA] px-6 pb-[18px] pt-[18px]">
        <div className="flex items-center justify-between">
          <div className="flex h-[clamp(42px,10vw,59px)] w-[clamp(42px,10vw,59px)] items-center">
            <img src={logoKemenham} alt="KEMENHAM" className="h-full w-full object-contain" />
          </div>
          <button onClick={() => onOpenProfile?.()} className="flex items-center gap-[5px]">
            <div className="flex flex-col items-end"><span className="text-[10px] font-bold text-[#124CA3]">Profile</span><span className="text-[11px] font-bold text-black">{user?.fullName || user?.full_name || 'Demo User'}</span></div>
            <svg width="37" height="37" viewBox="0 0 44 44" fill="currentColor" className="text-black shrink-0"><path d="M22 2c-8.8 0-16 7.2-16 16s7.2 16 16 16 16-7.2 16-16S30.8 2 22 2zm0 6c3.3 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6 2.7-6 6-6zm0 26.4c-4.8 0-9-2.4-11.4-6 2.4-3.6 6.6-6 11.4-6s9 2.4 11.4 6c-2.4 3.6-6.6 6-11.4 6z"/></svg>
          </button>
        </div>
      </header>

      {/* KONTEN */}
      <div className={`flex flex-1 flex-col gap-[30px] px-[23px] pt-5 pb-[30px] ${submitted ? 'pointer-events-none opacity-60 select-none' : ''}`}>
        <h1 className="text-[18px] font-black text-[#04305F] -mb-[10px]">PRE-EVENT</h1>
        
        {/* Upload Foto di Titik Awal */}
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-bold text-black">Upload Foto di Titik Awal</span>
          <button onClick={() => openCameraFor('titik')} className="flex h-[49px] w-full flex-col items-center justify-center gap-1 rounded-[7px] bg-[#D9D9D9] text-black hover:bg-[#C0C0C0] transition-colors">
            <svg width="13" height="11" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 3H13.5L12 1H6L4.5 3H2C1.2 3 0.5 3.7 0.5 4.5V12.5C0.5 13.3 1.2 14 2 14H16C16.8 14 17.5 13.3 17.5 12.5V4.5C17.5 3.7 16.8 3 16 3Z"/><circle cx="9" cy="8" r="3"/></svg>
            <span className="text-[8px] font-semibold leading-none">Ambil Gambar</span>
          </button>
          <p className="text-[9px] text-[#FF0000]">*Upload Foto Diri di Titik Awal sesuai dengan Transportasi yang digunakan<br/>(Pesawat = Foto saat Boarding, Kereta = Foto di stasiun, dan sebagainya).</p>
          {fotoTitikList.map((f,i) => (
            <div key={i} className="relative rounded-[7px] border border-[#D9D9D9] overflow-hidden mt-1">
              <img src={f.dataUrl} alt={`Titik ${i+1}`} className="h-auto w-full object-contain" />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-[10px] text-white">{f.timestamp}{f.lat && ` — GPS: ${f.lat.toFixed(4)},${f.lng.toFixed(4)}`}{f.accuracy && ` (±${Math.round(f.accuracy)}m)`}</div>
              <button onClick={() => hapusTitik(i)} className="absolute right-1 top-1 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-red-500 text-[12px] font-bold text-white">✕</button>
            </div>
          ))}
        </div>

        {/* Biaya Tambahan */}
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-bold text-black">Biaya Tambahan</span>
          <div className="flex w-full max-w-[342px] flex-col gap-[7px]">
            {/* Uang Harian */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setUangHarian(!uangHarian)}>
              <div className="flex h-[14px] w-[14px] items-center justify-center rounded-[2px] border-[2px] border-[#E5E6EB] bg-white">
                {uangHarian && <div className="h-[8px] w-[8px] bg-[#1D2129] rounded-[1px]" />}
              </div>
              <span className="text-[12px] text-[#1D2129] leading-[22px]">Uang Harian Tambahan</span>
            </div>
            <input type="text" value={ketUangHarian} onChange={e => setKetUangHarian(e.target.value)} placeholder="Parkir, TopUp E-Money, Uang Makan, dan lainnya." className="ml-[22px] h-[22px] w-[calc(100%-22px)] max-w-[320px] bg-[#D9D9D9] px-2 text-[10px] placeholder:italic placeholder:font-[400] placeholder:text-gray-600 outline-none" />

            {/* Transport Tambahan */}
            <div className="mt-1 flex items-center gap-2 cursor-pointer" onClick={() => setTransportTambahan(!transportTambahan)}>
              <div className="flex h-[14px] w-[14px] items-center justify-center rounded-[2px] border-[2px] border-[#E5E6EB] bg-white">
                {transportTambahan && <div className="h-[8px] w-[8px] bg-[#1D2129] rounded-[1px]" />}
              </div>
              <span className="text-[12px] text-[#1D2129] leading-[22px]">Transport Tambahan</span>
            </div>
            <input type="text" value={ketTransportTambahan} onChange={e => setKetTransportTambahan(e.target.value)} placeholder="Ongkos Transum, Ojek, Bus, Kereta, dan lainnya." className="ml-[22px] h-[22px] w-[calc(100%-22px)] max-w-[320px] bg-[#D9D9D9] px-2 text-[10px] placeholder:italic placeholder:font-[400] placeholder:text-gray-600 outline-none" />
          </div>
        </div>

        {/* Upload Nota & Nominal */}
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-bold text-black">Upload Nota/Bukti Biaya Tambahan</span>
          <button onClick={() => openCameraFor('nota')} className="flex h-[49px] w-full flex-col items-center justify-center gap-1 rounded-[7px] bg-[#D9D9D9] text-black hover:bg-[#C0C0C0] transition-colors">
            <svg width="13" height="11" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 3H13.5L12 1H6L4.5 3H2C1.2 3 0.5 3.7 0.5 4.5V12.5C0.5 13.3 1.2 14 2 14H16C16.8 14 17.5 13.3 17.5 12.5V4.5C17.5 3.7 16.8 3 16 3Z"/><circle cx="9" cy="8" r="3"/></svg>
            <span className="text-[8px] font-semibold leading-none">Ambil Gambar</span>
          </button>
          {notaList.map((f,i) => (
            <div key={i} className="relative rounded-[7px] border border-[#D9D9D9] overflow-hidden mt-1">
              <img src={f.dataUrl} alt={`Nota ${i+1}`} className="h-auto w-full object-contain" />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-[10px] text-white">{f.timestamp}{f.lat && ` — GPS: ${f.lat.toFixed(4)},${f.lng.toFixed(4)}`}{f.accuracy && ` (±${Math.round(f.accuracy)}m)`}</div>
              <button onClick={() => hapusNota(i)} className="absolute right-1 top-1 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-red-500 text-[12px] font-bold text-white">✕</button>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-bold text-black">Masukan Nominal Biaya Tambahan</label>
          <input type="text" inputMode="numeric" value={nominalTambahan} onChange={(e) => setNominalTambahan(e.target.value)} className="h-[27px] w-full rounded-[7px] bg-[#D9D9D9] px-2 text-[13px] font-bold text-black outline-none" />
        </div>
      </div>

      {/* BOTTOM BUTTONS */}
      <div className="flex-1 min-h-[50px]" />
      <div className="mt-auto flex items-center justify-between px-[25px] pb-[40px] pt-[40px]">
        <button onClick={onBack} className="flex h-[24px] min-w-[67px] items-center justify-center rounded-[35px] bg-[#04305F] px-2 text-white hover:brightness-110 active:scale-95">
          <span className="text-[14px] font-[800]">{submitted ? 'Kembali' : 'Back'}</span>
        </button>
        {submitted ? (
          <div className="flex items-center gap-2">
            <button onClick={() => onNext?.()} className="flex h-[24px] min-w-[67px] items-center justify-center rounded-[35px] bg-[#04305F] px-2 text-white hover:brightness-110 active:scale-95">
              <span className="text-[14px] font-[800]">Next</span>
            </button>
          </div>
        ) : (
          <button onClick={() => {
            const missing = [];
            if (fotoTitikList.length === 0) missing.push('Upload Foto di Titik Awal');
            if (uangHarian || transportTambahan) {
              if (notaList.length === 0) missing.push('Upload Nota/Bukti Biaya Tambahan');
              if (!nominalTambahan.trim()) missing.push('Nominal Biaya Tambahan');
            }
            if (missing.length > 0) { setFormError(`Lengkapi: ${missing.join(', ')}`); return; }
            setFormError('');
            setShowSavePopup(true);
          }} className="flex h-[24px] min-w-[67px] items-center justify-center rounded-[35px] bg-[#04305F] px-2 text-white hover:brightness-110 active:scale-95">
            <span className="text-[14px] font-[800]">Save</span>
          </button>
        )}
      </div>

      {/* SAVE POPUP */}
      {showSavePopup && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-6">
          <div className="w-full max-w-[300px] rounded-xl bg-white p-6 shadow-2xl text-center">
            <div className="mb-2 text-[40px]">⚠️</div>
            <h2 className="mb-2 text-[15px] font-extrabold text-[#04305F]">Konfirmasi Penyimpanan</h2>
            <p className="mb-4 text-[12px] font-bold text-gray-600">Data yang sudah disimpan <span className="text-red-600">tidak dapat diubah lagi</span>. Pastikan semua data sudah benar.</p>
            <div className="flex justify-center gap-4">
              <button onClick={async () => { setShowSavePopup(false); await onSave?.({ uangHarian, ketUangHarian, transportTambahan, ketTransportTambahan, nominalTambahan, notaKebutuhan: notaList, fotoTitikAwal: fotoTitikList }); }} className="rounded-lg bg-green-600 px-6 py-2 text-[14px] font-bold text-white hover:brightness-110">Ya, Simpan</button>
              <button onClick={() => setShowSavePopup(false)} className="rounded-lg border border-gray-300 px-6 py-2 text-[14px] font-bold text-gray-600">Batal</button>
            </div>
          </div>
        </div>
      )}
      {formError && <p className="mx-[25px] mb-[12px] text-center text-[12px] font-bold text-red-600">{formError}</p>}
    </div>
  );
}

export default PreEventFinalPage;


