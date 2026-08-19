import React, { useState, useRef, useEffect } from 'react';
import logoKemenham from '../assets/logo-kemenham.png';

const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
function pad2(n) { return n < 10 ? '0' + n : n; }
function formatTimestamp(date) {
  return `${pad2(date.getDate())}-${MONTHS[date.getMonth()]}-${date.getFullYear()} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())} WIB`;
}

function EventPage({ onBack, onNext, onSave, onOpenProfile, eventData, submitted, onReset }) {
  const draftKey = 'integra_event_draft';
  const load = () => { try { return JSON.parse(localStorage.getItem(draftKey)) || {}; } catch { return {}; } };
  const d = load();

  const [user, setUser] = useState(null);
  useEffect(() => {
    try { setUser(JSON.parse(localStorage.getItem('integra_user'))); } catch {}
  }, []);

  const [fotoKedatanganList, setFotoKedatanganList] = useState(d.fotoKedatanganList || []);
  const [fotoAcaraList, setFotoAcaraList] = useState(d.fotoAcaraList || []);
  
  // Biaya Tambahan
  const [uangHarian, setUangHarian] = useState(d.uangHarian || false);
  const [ketUangHarian, setKetUangHarian] = useState(d.ketUangHarian || '');
  const [transportTambahan, setTransportTambahan] = useState(d.transportTambahan || false);
  const [ketTransportTambahan, setKetTransportTambahan] = useState(d.ketTransportTambahan || '');
  
  const [notaList, setNotaList] = useState(d.notaList || []);
  const [nominalTambahan, setNominalTambahan] = useState(d.nominalTambahan || '');

  const [formError, setFormError] = useState('');
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // CAMERA STATE
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraTarget, setCameraTarget] = useState(null);
  const [cameraStatus, setCameraStatus] = useState('');
  const [cameraDenied, setCameraDenied] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Auto-save draft
  useEffect(() => {
    if (submitted) return;
    try {
      localStorage.setItem('integra_event_draft', JSON.stringify({
        fotoKedatangan: fotoKedatanganList,
        fotoAcara: fotoAcaraList,
        uangHarianTambahan: uangHarian,
        ketUangHarian,
        transportTambahan,
        ketTransportTambahan,
        notaBiayaTambahan: notaList,
        nominalBiayaTambahan: nominalTambahan
      }));
    } catch (e) {
      console.warn('Failed to save Event draft to localStorage:', e);
    }
  }, [fotoKedatanganList, fotoAcaraList, uangHarian, ketUangHarian, transportTambahan, ketTransportTambahan, notaList, nominalTambahan, submitted]);

  const openCameraFor = (target) => {
    if (submitted) return;
    setCameraTarget(target);
    setCameraActive(true);
    setCameraStatus('Meminta izin...');
    setCameraDenied(false);
    startCamera();
  };

  const startCamera = async () => {
    try {
      if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; }
      setCameraStatus('');
      setCameraDenied(false);
    } catch (err) {
      setCameraDenied(true);
      setCameraStatus('Akses kamera ditolak.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setCameraTarget(null);
  };

  const getGps = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject();
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      () => reject(),
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 }
    );
  });

  const fetchServerTime = async () => {
    try {
      const res = await fetch('http://worldtimeapi.org/api/timezone/Asia/Jakarta', { signal: AbortSignal.timeout(3000) });
      const data = await res.json();
      return formatTimestamp(new Date(data.datetime));
    } catch {
      return formatTimestamp(new Date());
    }
  };

  const ambilFoto = async () => {
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

    const [serverTimestamp, gps] = await Promise.all([
      fetchServerTime(),
      getGps().catch(() => null)
    ]);

    const wm = gps 
      ? `${serverTimestamp}\nGPS: ${gps.lat.toFixed(6)}, ${gps.lng.toFixed(6)} (akurasi: ${gps.accuracy ? Math.round(gps.accuracy) + 'm' : '?'})`
      : `${serverTimestamp}\n(GPS tidak tersedia)`;

    ctx.font = `bold ${Math.max(16, Math.floor(vw / 40))}px Inter, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 2;
    const lines = wm.split('\n');
    let y = vh - (lines.length * 30) - 10;
    lines.forEach(line => {
      ctx.strokeText(line, 20, y);
      ctx.fillText(line, 20, y);
      y += 30;
    });

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const result = { dataUrl, timestamp: serverTimestamp, lat: gps?.lat, lng: gps?.lng, accuracy: gps?.accuracy };

    if (cameraTarget === 'kedatangan') setFotoKedatanganList(prev => [...prev, result]);
    else if (cameraTarget === 'acara') setFotoAcaraList(prev => [...prev, result]);
    else if (cameraTarget === 'nota') setNotaList(prev => [...prev, result]);
    
    stopCamera();
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave?.({ 
      fotoKedatanganList, 
      fotoAcaraList, 
      uangHarian, ketUangHarian, 
      transportTambahan, ketTransportTambahan, 
      notaList, nominalTambahan 
    });
    localStorage.removeItem(draftKey);
    setIsSaving(false);
    setShowSavePopup(false);
  };

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[390px] flex-col bg-white font-inter shadow-xl">
      
      {/* HEADER */}
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
        <h1 className="text-[18px] font-black text-[#04305F] -mb-[10px]">EVENT</h1>
        
        {/* Foto Kedatangan */}
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-bold text-black">Foto Kedatangan Awal di Venue Event</span>
          <button onClick={() => openCameraFor('kedatangan')} className="flex h-[49px] w-full flex-col items-center justify-center gap-1 rounded-[7px] bg-[#D9D9D9] text-black hover:bg-[#C0C0C0] transition-colors">
            <svg width="13" height="11" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 3H13.5L12 1H6L4.5 3H2C1.2 3 0.5 3.7 0.5 4.5V12.5C0.5 13.3 1.2 14 2 14H16C16.8 14 17.5 13.3 17.5 12.5V4.5C17.5 3.7 16.8 3 16 3Z"/><circle cx="9" cy="8" r="3"/></svg>
            <span className="text-[8px] font-semibold leading-none">Ambil Gambar</span>
          </button>
          {fotoKedatanganList.map((f,i) => (
            <div key={`kedatangan-${i}`} className="relative rounded-[7px] border border-[#D9D9D9] overflow-hidden mt-1">
              <img src={f.dataUrl} alt={`Kedatangan ${i+1}`} className="h-auto w-full object-contain" />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-[10px] text-white">{f.timestamp}{f.lat && ` — GPS: ${f.lat.toFixed(4)},${f.lng.toFixed(4)}`}</div>
              <button onClick={() => setFotoKedatanganList(prev => prev.filter((_, idx) => idx !== i))} className="absolute right-1 top-1 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-red-500 text-[12px] font-bold text-white">✕</button>
            </div>
          ))}
        </div>

        {/* Foto Acara Berlangsung */}
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-bold text-black">Foto saat acara berlangsung</span>
          <button onClick={() => openCameraFor('acara')} className="flex h-[49px] w-full flex-col items-center justify-center gap-1 rounded-[7px] bg-[#D9D9D9] text-black hover:bg-[#C0C0C0] transition-colors">
            <svg width="13" height="11" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 3H13.5L12 1H6L4.5 3H2C1.2 3 0.5 3.7 0.5 4.5V12.5C0.5 13.3 1.2 14 2 14H16C16.8 14 17.5 13.3 17.5 12.5V4.5C17.5 3.7 16.8 3 16 3Z"/><circle cx="9" cy="8" r="3"/></svg>
            <span className="text-[8px] font-semibold leading-none">Ambil Gambar</span>
          </button>
          <span className="text-[9px] font-medium text-[#FF0000]">*Wajib sertakan 3 - 4 foto saat kegiatan berlangsung!</span>
          {fotoAcaraList.map((f,i) => (
            <div key={`acara-${i}`} className="relative rounded-[7px] border border-[#D9D9D9] overflow-hidden mt-1">
              <img src={f.dataUrl} alt={`Acara ${i+1}`} className="h-auto w-full object-contain" />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-[10px] text-white">{f.timestamp}{f.lat && ` — GPS: ${f.lat.toFixed(4)},${f.lng.toFixed(4)}`}</div>
              <button onClick={() => setFotoAcaraList(prev => prev.filter((_, idx) => idx !== i))} className="absolute right-1 top-1 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-red-500 text-[12px] font-bold text-white">✕</button>
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
            <div key={`nota-${i}`} className="relative rounded-[7px] border border-[#D9D9D9] overflow-hidden mt-1">
              <img src={f.dataUrl} alt={`Nota ${i+1}`} className="h-auto w-full object-contain" />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-[10px] text-white">{f.timestamp}{f.lat && ` — GPS: ${f.lat.toFixed(4)},${f.lng.toFixed(4)}`}</div>
              <button onClick={() => setNotaList(prev => prev.filter((_, idx) => idx !== i))} className="absolute right-1 top-1 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-red-500 text-[12px] font-bold text-white">✕</button>
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
            if (fotoKedatanganList.length === 0) missing.push('Foto Kedatangan');
            if (fotoAcaraList.length < 3) missing.push('Foto Acara (Min. 3)');
            if (uangHarian || transportTambahan) {
              if (notaList.length === 0) missing.push('Nota Biaya Tambahan');
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
      {formError && <p className="mx-[25px] mb-[12px] text-center text-[12px] font-bold text-red-600">{formError}</p>}

      {/* POPUP CAMERA */}
      {cameraActive && (
        <div className="fixed inset-0 z-[99] flex flex-col bg-black">
          <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden">
            {cameraStatus && <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10"><p className="text-white">{cameraStatus}</p></div>}
            <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
            
            <div className="absolute bottom-10 flex w-full flex-col items-center gap-4 px-6">
              {cameraDenied ? (
                <div className="flex flex-col items-center gap-2 rounded-lg bg-black/60 p-4 text-center">
                  <p className="text-[14px] font-bold text-white">Akses Kamera Ditolak / Tidak Tersedia</p>
                  <p className="text-[12px] text-gray-300">Izinkan akses kamera di pengaturan browser.</p>
                  <button onClick={startCamera} className="rounded-lg bg-[#04305F] px-6 py-2 text-[14px] font-bold text-white">Coba Lagi</button>
                </div>
              ) : (
                <button onClick={ambilFoto} className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/20 hover:bg-white/40 active:scale-95"><div className="h-12 w-12 rounded-full bg-white" /></button>
              )}
              <button onClick={stopCamera} className="mt-2 rounded-full bg-red-600 px-5 py-2 text-[14px] font-bold text-white">Batal</button>
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* POPUP SUBMIT */}
      {showSavePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6 backdrop-blur-sm">
          <div className="flex w-full max-w-[320px] flex-col items-center rounded-[20px] bg-white p-6 shadow-2xl">
            <h2 className="mb-2 text-center text-[18px] font-black text-[#04305F]">Simpan Data Event?</h2>
            <p className="mb-6 text-center text-[12px] text-gray-600">Pastikan foto kedatangan dan acara (3-4 foto) sudah diupload dengan benar.</p>
            <div className="flex w-full gap-3">
              <button disabled={isSaving} onClick={() => setShowSavePopup(false)} className="flex-1 rounded-[10px] border border-[#04305F] py-2 text-[14px] font-bold text-[#04305F]">Batal</button>
              <button disabled={isSaving} onClick={handleSave} className="flex-1 rounded-[10px] bg-[#04305F] py-2 text-[14px] font-bold text-white disabled:opacity-50">{isSaving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventPage;
