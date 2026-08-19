import { useState, useRef, useEffect } from 'react';
import logoKemenham from '../assets/logo-kemenham.png';

function PostEventFinalPage({ onBack, onSave, submitted, readOnly }) {
  const [user, setUser] = useState(null);

  // Load dari local storage draft post event
  const draftKey = 'integra_post_event_draft';
  const loadDraft = () => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) return JSON.parse(saved);
    } catch { }
    return {};
  };
  const d = loadDraft();

  const uangHarianTambahan = d.uangHarianTambahan || false;
  const transportTambahan = d.transportTambahan || false;
  const requireBiayaTambahan = uangHarianTambahan || transportTambahan;

  const [notaList, setNotaList] = useState(d.notaBiayaTambahan || []);
  const [nominalTambahan, setNominalTambahan] = useState(d.nominalBiayaTambahan || '');
  const [fotoKembaliList, setFotoKembaliList] = useState(d.fotoSaatKembali || []);

  const [formError, setFormError] = useState('');
  const [showSavePopup, setShowSavePopup] = useState(false);

  // Camera states
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStatus, setCameraStatus] = useState('');
  const [cameraDenied, setCameraDenied] = useState(false);
  const [showIzinModal, setShowIzinModal] = useState(false);
  const [cameraTarget, setCameraTarget] = useState(null); 
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('integra_user');
    if (storedUser) { try { setUser(JSON.parse(storedUser)); } catch { setUser(null); } }
  }, []);

  // Auto-save draft
  useEffect(() => {
    const newDraft = {
      ...d,
      notaBiayaTambahan: notaList,
      nominalBiayaTambahan: nominalTambahan,
      fotoSaatKembali: fotoKembaliList
    };
    localStorage.setItem(draftKey, JSON.stringify(newDraft));
  }, [notaList, nominalTambahan, fotoKembaliList]);

  useEffect(() => {
    return () => releaseStream();
  }, []);

  if (readOnly) {
    return (
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[390px] flex-col bg-white font-inter shadow-xl">
        {/* HEADER */}
        <header className="bg-[#D5E8FA] px-6 pb-[18px] pt-[18px]">
          <div className="flex items-center justify-between">
            <div className="flex h-[clamp(42px,10vw,59px)] w-[clamp(42px,10vw,59px)] items-center">
              <img src={logoKemenham} alt="KEMENHAM" className="h-full w-full object-contain" />
            </div>
            <button className="flex items-center gap-[5px]">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-[#124CA3]">Profile</span>
                <span className="text-[11px] font-bold text-black">{user?.fullName || user?.full_name || 'Demo User'}</span>
              </div>
              <svg width="37" height="37" viewBox="0 0 44 44" fill="currentColor" className="text-black shrink-0"><path d="M22 2c-8.8 0-16 7.2-16 16s7.2 16 16 16 16-7.2 16-16S30.8 2 22 2zm0 6c3.3 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6 2.7-6 6-6zm0 26.4c-4.8 0-9-2.4-11.4-6 2.4-3.6 6.6-6 11.4-6s9 2.4 11.4 6c-2.4 3.6-6.6 6-11.4 6z"/></svg>
            </button>
          </div>
        </header>

        <div className="px-[25px] pt-[15px]">
          <h1 className="text-left text-[18px] font-black text-[#04305F] -mb-1">POST-EVENT</h1>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="flex flex-col items-center gap-[12px] -mt-[100px]">
            <div className="flex h-[24px] w-[24px] items-center justify-center bg-[#04305F]">
               <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="text-center text-[#04305F] text-[16px] font-[700] whitespace-pre-line">
              {`Berhasil!\nPerjalanan Dinas Telah Disubmit.`}
            </div>
          </div>
        </div>

        {/* BOTTOM BUTTONS */}
        <div className="mt-auto flex items-center justify-between px-[25px] pb-[40px] pt-[20px]">
          <button onClick={onBack} className="flex h-[24px] min-w-[67px] items-center justify-center rounded-[35px] bg-[#04305F] px-2 text-white hover:brightness-110 active:scale-95">
            <span className="text-[14px] font-[800]">Kembali</span>
          </button>
        </div>
      </div>
    );
  }

  const releaseStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    setShowIzinModal(false);
    setCameraDenied(false);
    setShowCamera(true);
    setCameraStatus('Meminta akses kamera dan GPS...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraStatus('Menunggu lokasi GPS...');
      navigator.geolocation.getCurrentPosition(
        () => setCameraStatus(''),
        () => setCameraStatus('Gagal mendapatkan GPS, menggunakan waktu saja.'),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } catch (err) {
      console.error('Kamera error:', err);
      setCameraDenied(true);
      setCameraStatus('Akses kamera ditolak. Izinkan di pengaturan browser.');
    }
  };

  const captureFoto = () => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return resolve(null);
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const tzOffset = 7 * 60 * 60 * 1000;
      const localTime = new Date(Date.now() + tzOffset).toISOString().replace('T', ' ').slice(0, 19) + ' WIB';
      
      const drawText = (lat, lng, acc) => {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.fillText(localTime, 10, canvas.height - 25);
        if (lat && lng) {
          ctx.fillText(`GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)} (±${Math.round(acc)}m)`, 10, canvas.height - 8);
        }
        resolve({
          dataUrl: canvas.toDataURL('image/jpeg', 0.8),
          timestamp: localTime,
          lat, lng, accuracy: acc
        });
      };

      navigator.geolocation.getCurrentPosition(
        (pos) => drawText(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
        () => drawText(null, null, null),
        { enableHighAccuracy: true, timeout: 3000 }
      );
    });
  };

  const handleAmbilGambar = async () => {
    const foto = await captureFoto();
    if (foto) {
      if (cameraTarget === 'nota') setNotaList(p => [...p, foto]);
      else if (cameraTarget === 'kembali') setFotoKembaliList(p => [...p, foto]);
    }
    releaseStream(); setShowCamera(false); setCameraStatus(''); setCameraTarget(null);
  };

  const handleBatal = () => { releaseStream(); setShowCamera(false); setCameraStatus(''); setCameraDenied(false); setCameraTarget(null); };
  const openCameraFor = (t) => { setCameraTarget(t); setShowIzinModal(true); };

  const hapusNota = (i) => setNotaList(p => p.filter((_, idx) => idx !== i));
  const hapusKembali = (i) => setFotoKembaliList(p => p.filter((_, idx) => idx !== i));

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[390px] flex-col bg-white font-['Inter'] sm:max-w-md">
      {/* CAMERA MODAL */}
      {showIzinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div className="w-full max-w-[300px] rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="mb-2 text-center text-[15px] font-extrabold text-[#04305F]">Izin Akses</h2>
            <p className="mb-6 text-center text-[12px] font-bold text-gray-600">Aplikasi membutuhkan akses ke Kamera dan Lokasi GPS Anda untuk mengambil gambar presensi.</p>
            <div className="flex justify-center gap-4">
              <button onClick={startCamera} className="rounded-lg bg-[#04305F] px-6 py-2 text-[12px] font-bold text-white hover:brightness-110 active:scale-95">Izinkan</button>
              <button onClick={() => setShowIzinModal(false)} className="rounded-lg border border-gray-300 px-6 py-2 text-[12px] font-bold text-gray-600 active:scale-95">Batal</button>
            </div>
          </div>
        </div>
      )}
      <div className={`fixed inset-0 z-40 bg-black transition-transform duration-300 ${showCamera ? 'translate-y-0' : 'translate-y-full'}`}>
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />
        <div className="absolute left-0 top-0 w-full p-4 flex justify-between items-start">
          <p className="rounded bg-black/50 px-2 py-1 text-xs text-white max-w-[70%]">{cameraStatus}</p>
          <button onClick={handleBatal} className="rounded-full bg-red-600 p-2 text-white shadow-lg">✕</button>
        </div>
        {!cameraDenied && (
          <div className="absolute bottom-10 left-0 flex w-full justify-center">
            <button onClick={handleAmbilGambar} className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/20 hover:bg-white/40 active:scale-95"><div className="h-12 w-12 rounded-full bg-white"></div></button>
          </div>
        )}
      </div>

      {/* HEADER */}
      <header className="bg-[#D5E8FA] px-6 pb-[18px] pt-[18px]">
        <div className="flex items-center justify-between">
          <div className="h-[42px] w-[42px] opacity-0" />
          <div className="flex items-center gap-[5px]">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-[#124CA3]">Profile</span>
              <span className="text-[11px] font-bold text-[#000000]">{user?.fullName || user?.full_name || 'Demo User'}</span>
            </div>
            <svg width="37" height="37" viewBox="0 0 44 44" fill="currentColor" className="text-black shrink-0"><path d="M22 2c-8.8 0-16 7.2-16 16s7.2 16 16 16 16-7.2 16-16S30.8 2 22 2zm0 6c3.3 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6 2.7-6 6-6zm0 26.4c-4.8 0-9-2.4-11.4-6 2.4-3.6 6.6-6 11.4-6s9 2.4 11.4 6c-2.4 3.6-6.6 6-11.4 6z"/></svg>
          </div>
        </div>
      </header>
      
      <div className="px-[25px] pt-[15px]">
        <h1 className="text-left text-[18px] font-black text-[#04305F] -mb-1">POST-EVENT</h1>
      </div>

      <div className={`mt-[20px] flex flex-col gap-[20px] px-[25px] ${readOnly ? 'pointer-events-none opacity-70 select-none' : ''}`}>

        {requireBiayaTambahan && (
          <>
            <div className="flex flex-col gap-1">
              <span className="text-[13px] font-bold text-black">Upload Nota/Bukti Biaya Tambahan</span>
              <button onClick={() => openCameraFor('nota')} className="flex h-[49px] w-full flex-col items-center justify-center gap-1 rounded-[7px] bg-[#D9D9D9] text-black hover:bg-[#C0C0C0] transition-colors">
                <svg width="13" height="11" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 3H13.5L12 1H6L4.5 3H2C1.2 3 0.5 3.7 0.5 4.5V12.5C0.5 13.3 1.2 14 2 14H16C16.8 14 17.5 13.3 17.5 12.5V4.5C17.5 3.7 16.8 3 16 3Z"/><circle cx="9" cy="8" r="3"/></svg>
                <span className="text-[7px] font-semibold leading-none">Ambil Gambar</span>
              </button>
              {notaList.map((f,i) => (
                <div key={i} className="relative rounded-[7px] border border-[#D9D9D9] overflow-hidden mt-1">
                  <img src={f.dataUrl} alt={`Nota ${i+1}`} className="h-auto w-full object-contain" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-[10px] text-white">{f.timestamp}{f.lat && ` — GPS: ${f.lat.toFixed(4)},${f.lng.toFixed(4)}`}</div>
                  <button onClick={() => hapusNota(i)} className="absolute right-1 top-1 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-red-500 text-[12px] font-bold text-white">✕</button>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-bold text-black">Masukan Nominal Biaya Tambahan</label>
              <input type="text" inputMode="numeric" value={nominalTambahan} onChange={(e) => setNominalTambahan(e.target.value)} className="h-[27px] w-full rounded-[7px] bg-[#D9D9D9] px-2 text-[13px] font-bold text-black outline-none" />
            </div>
          </>
        )}

        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-bold text-black">Upload Foto saat kembali</span>
          <button onClick={() => openCameraFor('kembali')} className="flex h-[49px] w-full flex-col items-center justify-center gap-1 rounded-[7px] bg-[#D9D9D9] text-black hover:bg-[#C0C0C0] transition-colors">
            <svg width="13" height="11" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 3H13.5L12 1H6L4.5 3H2C1.2 3 0.5 3.7 0.5 4.5V12.5C0.5 13.3 1.2 14 2 14H16C16.8 14 17.5 13.3 17.5 12.5V4.5C17.5 3.7 16.8 3 16 3Z"/><circle cx="9" cy="8" r="3"/></svg>
            <span className="text-[7px] font-semibold leading-none">Ambil Gambar</span>
          </button>
          <span className="text-[9px] text-[#FF0000]">*Upload Foto setelah sampai, contoh: Rumah, Kantor.</span>
          {fotoKembaliList.map((f,i) => (
            <div key={i} className="relative rounded-[7px] border border-[#D9D9D9] overflow-hidden mt-1">
              <img src={f.dataUrl} alt={`Foto Kembali ${i+1}`} className="h-auto w-full object-contain" />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-[10px] text-white">{f.timestamp}{f.lat && ` — GPS: ${f.lat.toFixed(4)},${f.lng.toFixed(4)}`}</div>
              <button onClick={() => hapusKembali(i)} className="absolute right-1 top-1 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-red-500 text-[12px] font-bold text-white">✕</button>
            </div>
          ))}
        </div>

      </div>

      {/* BOTTOM BUTTONS */}
      <div className="flex-1 min-h-[50px]" />
      <div className="mt-auto flex items-center justify-between px-[25px] pb-[40px] pt-[20px]">
        <button onClick={onBack} className="flex h-[24px] min-w-[67px] items-center justify-center rounded-[35px] bg-[#04305F] px-2 text-white hover:brightness-110 active:scale-95">
          <span className="text-[14px] font-[800]">{readOnly ? 'Kembali' : 'Back'}</span>
        </button>
        <button onClick={() => {
          if (readOnly) return;
          const missing = [];
          if (requireBiayaTambahan) {
            if (notaList.length === 0) missing.push('Upload Nota Biaya Tambahan');
            if (!nominalTambahan.trim()) missing.push('Nominal Biaya Tambahan');
          }
          if (fotoKembaliList.length === 0) missing.push('Upload Foto saat kembali');
          
          if (missing.length > 0) { setFormError(`Lengkapi: ${missing.join(', ')}`); return; }
          setFormError('');
          setShowSavePopup(true);
        }} className="flex h-[24px] min-w-[67px] items-center justify-center rounded-[35px] bg-[#04305F] px-2 text-white hover:brightness-110 active:scale-95">
          <span className="text-[14px] font-[800]">{readOnly ? 'Lanjut' : 'Submit'}</span>
        </button>
      </div>

      {formError && <p className="mx-[25px] mb-[12px] text-center text-[12px] font-bold text-red-600">{formError}</p>}

      {/* SAVE POPUP */}
      {showSavePopup && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-6">
          <div className="w-full max-w-[300px] rounded-xl bg-white p-6 shadow-2xl text-center">
            <div className="mb-2 text-[40px]">⚠️</div>
            <h2 className="mb-2 text-[15px] font-extrabold text-[#04305F]">Konfirmasi Penyimpanan</h2>
            <p className="mb-4 text-[12px] font-bold text-gray-600">Data yang sudah disimpan <span className="text-red-600">tidak dapat diubah lagi</span>. Pastikan semua data sudah benar.</p>
            <div className="flex justify-center gap-4">
              <button onClick={async () => { 
                setShowSavePopup(false); 
                const finalData = { ...d, notaBiayaTambahan: notaList, nominalBiayaTambahan: nominalTambahan, fotoSaatKembali: fotoKembaliList };
                await onSave?.(finalData); 
              }} className="rounded-lg bg-green-600 px-6 py-2 text-[14px] font-bold text-white hover:brightness-110">Ya, Simpan</button>
              <button onClick={() => setShowSavePopup(false)} className="rounded-lg border border-gray-300 px-6 py-2 text-[14px] font-bold text-gray-600">Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PostEventFinalPage;
