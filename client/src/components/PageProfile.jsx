import { useState, useEffect } from 'react';
import logoKemenham from '../assets/logo-kemenham.png';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function PageProfile({ onBack, onLogout }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('integra_token');
    const storedUser = localStorage.getItem('integra_user');

    // Coba dari localStorage dulu (instant)
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // abaikan
      }
    }

    // Fetch dari backend
    if (token && token !== 'demo-token') {
      fetch(`${API_BASE_URL}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setUser(data.user);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const displayName = user?.fullName || user?.full_name || '-';
  const displayNip = user?.nip || '-';
  const displayJabatan = user?.jabatan || '-';
  const displayPangkat = user?.pangkatGolongan || user?.pangkat_golongan || '-';

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[390px] flex-col bg-[#FFFBF0] font-['Inter'] sm:max-w-md">
      {/* === Header === */}
      <div className="flex items-center gap-2 px-[clamp(34px,10vw,44px)] pt-[clamp(50px,8vh,63px)]">
        <button
          type="button"
          onClick={onBack}
          className="text-[#000000]"
          aria-label="Kembali"
        >
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
            <path
              d="M21 9L12 17L21 25"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <span className="text-[14px] font-bold tracking-[0.1em] text-[#000000]">
          Profile
        </span>
      </div>

      {/* === Card Profil === */}
      <div className="mx-[clamp(34px,10vw,44px)] mt-[clamp(30px,5vh,42px)] flex flex-col items-center rounded-[30px] bg-[#D5E8FA] px-6 py-[clamp(32px,6vh,48px)]">
        {/* Logo + INTEGRA */}
        <div className="mb-8 flex flex-col items-center gap-[7px]">
          <img
            src={logoKemenham}
            alt="Logo Kemenham"
            className="h-[clamp(90px,14vh,118px)] w-[clamp(90px,14vh,118px)] object-contain"
          />
          <h1
            className="text-[clamp(28px,5.5vw,36px)] font-extrabold leading-none tracking-[0.07em] text-[#FCFCFC]"
            style={{
              WebkitTextStroke: '2px #042858',
              paintOrder: 'stroke fill',
            }}
          >
            INTEGRA
          </h1>
        </div>

        {/* Data Diri */}
        {loading ? (
          <div className="py-6 text-center text-[14px] text-[#000000]">Loading...</div>
        ) : (
          <div className="flex w-full flex-col gap-4">
            {/* Nama Lengkap */}
            <div className="text-center">
              <p className="text-[15px] font-bold text-[#000000]">{displayName}</p>
            </div>

            {/* NIP */}
            <div className="text-center">
              <p className="text-[12px] text-[#000000]">NIP. {displayNip}</p>
            </div>

            {/* Jabatan/Bagian */}
            <div className="text-center">
              <p className="text-[12px] text-[#000000]">Jabatan/Bagian: {displayJabatan}</p>
            </div>

            {/* Pangkat/Golongan */}
            <div className="text-center">
              <p className="text-[12px] text-[#000000]">Pangkat/Golongan: {displayPangkat}</p>
            </div>
          </div>
        )}

        {/* Tombol Logout */}
        {!loading && (
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('integra_token');
              localStorage.removeItem('integra_user');
              localStorage.removeItem('integra_demo_mode');
              localStorage.removeItem('integrasi_data_diri');
              onLogout?.();
            }}
            className="mt-8 w-[160px] rounded-[30px] bg-[#04305F] py-[10px] text-center text-[15px] font-bold tracking-[0.05em] text-white shadow-md transition-all hover:brightness-110 active:scale-95"
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
}

export default PageProfile;