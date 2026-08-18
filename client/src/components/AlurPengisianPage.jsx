import { useState, useEffect } from 'react';
import logoKemenham from '../assets/logo-kemenham.png';

function AlurPengisianPage({ onNavigate, onBack, onOpenProfile }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('integra_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }

    const storedProfile = localStorage.getItem('integrasi_data_diri');
    if (storedProfile && !storedUser) {
      try {
        const profile = JSON.parse(storedProfile);
        setUser({ fullName: profile.namaLengkap || 'Demo User' });
      } catch {
        // abaikan
      }
    }
  }, []);

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[390px] flex-col bg-white font-['Inter'] sm:max-w-md">
      {/* === NAVBAR CORE UI === */}
      <header className="bg-[#D5E8FA] px-6 pb-[18px] pt-[18px]">
        <div className="flex items-center justify-between">
          {/* Logo Kemenham (klik = back) */}
          <button type="button" onClick={onBack} className="flex h-[clamp(42px,10vw,59px)] w-[clamp(42px,10vw,59px)] items-center">
            <img src={logoKemenham} alt="KEMENHAM" className="h-full w-full object-contain" />
          </button>
          {/* Profile */}
          <button type="button" onClick={() => onOpenProfile?.()} className="flex items-center gap-[5px]">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-[#124CA3]">Profile</span>
              <span className="text-[11px] font-bold text-[#000000]">{user?.fullName || user?.full_name || 'Demo User'}</span>
            </div>
            <svg width="37" height="37" viewBox="0 0 44 44" fill="currentColor" className="text-black shrink-0"><path d="M22 2c-8.8 0-16 7.2-16 16s7.2 16 16 16 16-7.2 16-16S30.8 2 22 2zm0 6c3.3 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6 2.7-6 6-6zm0 26.4c-4.8 0-9-2.4-11.4-6 2.4-3.6 6.6-6 11.4-6s9 2.4 11.4 6c-2.4 3.6-6.6 6-11.4 6z" /></svg>
          </button>
        </div>
        {/* Judul Halaman */}
        <h1 className="mt-[10px] text-[14px] font-extrabold tracking-[0.05em] text-[#04305F]">Alur Pengisian</h1>
      </header>

      {/* === Step Indicator (1 → 2 → 3) === */}
      <div className="mt-[clamp(18px,3vh,25px)] flex items-center justify-center gap-1">
        <span className="text-[10px] font-extrabold tracking-[0.05em] text-black">
          (1)
        </span>
        <svg
          width="29"
          height="32"
          viewBox="0 0 29 32"
          fill="none"
          className="text-black"
        >
          <path
            d="M5 16h19M19 8l8 8-8 8"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-[10px] font-extrabold tracking-[0.05em] text-black">
          (2)
        </span>
        <svg
          width="29"
          height="32"
          viewBox="0 0 29 32"
          fill="none"
          className="text-black"
        >
          <path
            d="M5 16h19M19 8l8 8-8 8"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-[10px] font-extrabold tracking-[0.05em] text-black">
          (3)
        </span>
      </div>

      {/* === Card Tahap === */}
      <div className="mt-[clamp(40px,8vh,60px)] flex flex-col gap-[clamp(28px,6vh,40px)] px-[clamp(60px,18vw,72px)]">
        {/* Card 1: Pre-Event (AKTIF) */}
        <div className="flex items-center gap-1">
          <span className="text-[12px] font-extrabold tracking-[0.05em] text-black">
            (1)
          </span>
          <button
            type="button"
            onClick={() => onNavigate?.('pre-event')}
            className="flex flex-1 items-center justify-between rounded-[10px] bg-[#73B1D8] px-[clamp(30px,11vw,41px)] py-[15px] shadow-sm transition-all hover:brightness-105 active:scale-[0.98]"
          >
            <span className="text-[clamp(18px,4.5vw,24px)] font-extrabold tracking-[0.05em] text-black">
              Pre - Event
            </span>
            <svg
              width="32"
              height="29"
              viewBox="0 0 32 29"
              fill="none"
              className="text-black"
            >
              <path
                d="M3 14.5h26M21 6.5l8 8-8 8"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Card 2: Event (Non-Aktif) */}
        <div className="flex items-center gap-1">
          <span className="text-[12px] font-extrabold tracking-[0.05em] text-black">
            (2)
          </span>
          <div className="flex flex-1 items-center justify-between rounded-[10px] bg-[#D5E8FA] px-[clamp(30px,11vw,41px)] py-[15px] opacity-60">
            <span className="text-[clamp(18px,4.5vw,24px)] font-extrabold tracking-[0.05em] text-black">
              Event
            </span>
            <svg
              width="32"
              height="29"
              viewBox="0 0 32 29"
              fill="none"
            >
              <path
                d="M3 14.5h26M21 6.5l8 8-8 8"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 3: Post-Event (Non-Aktif) */}
        <div className="flex items-center gap-1">
          <span className="text-[12px] font-extrabold tracking-[0.05em] text-black">
            (3)
          </span>
          <div className="flex flex-1 items-center justify-between rounded-[10px] bg-[#D5E8FA] px-[clamp(30px,11vw,41px)] py-[15px] opacity-60">
            <span className="text-[clamp(18px,4.5vw,24px)] font-extrabold tracking-[0.05em] text-black">
              Post - Event
            </span>
            <svg
              width="32"
              height="29"
              viewBox="0 0 32 29"
              fill="none"
            >
              <path
                d="M3 14.5h26M21 6.5l8 8-8 8"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AlurPengisianPage;