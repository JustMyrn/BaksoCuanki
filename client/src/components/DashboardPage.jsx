import { useState, useEffect } from 'react';
import logoKemenham from '../assets/logo-kemenham.png';

function DashboardPage({ onNext, onOpenProfile }) {
  const [user, setUser] = useState(null);
  const [suratList, setSuratList] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('integra_user');
    let parsedUser = null;

    if (storedUser) {
      try {
        parsedUser = JSON.parse(storedUser);
      } catch {
        parsedUser = null;
      }
    }

    // Fetch dari backend jika token tersedia
    const token = localStorage.getItem('integra_token');

    const fetchBackend = async () => {
      try {
        const [meRes, spdRes] = await Promise.all([
          fetch('http://localhost:5000/api/me', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('http://localhost:5000/api/perjalanan-dinas', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (meRes.ok) {
          const { user: meUser } = await meRes.json();
          setUser(meUser);
        } else {
          setUser(parsedUser);
        }

        if (spdRes.ok) {
          const { perjalanan } = await spdRes.json();
          setSuratList(perjalanan.map((spd) => ({
            nama: `SPD - ${spd.tujuanPerjalanan}`,
            url: '',
          })));
        }

      } catch {
        // Fallback ke localStorage
        setUser(parsedUser);

        const storedProfile = localStorage.getItem('integrasi_data_diri');
        if (storedProfile && !parsedUser) {
          try {
            const profile = JSON.parse(storedProfile);
            setUser({ fullName: profile.namaLengkap || 'Demo User' });
          } catch {
            // abaikan
          }
        }

        const storedSurat = localStorage.getItem('integra_surat_list');
        if (storedSurat) {
          try {
            setSuratList(JSON.parse(storedSurat));
          } catch {
            setSuratList([]);
          }
        }
      }
    };

    if (token && token !== 'demo-token') {
      fetchBackend();
    } else {
      // Demo / no token — gunakan localStorage
      setUser(parsedUser);
      const storedProfile = localStorage.getItem('integrasi_data_diri');
      if (storedProfile && !parsedUser) {
        try {
          const profile = JSON.parse(storedProfile);
          setUser({ fullName: profile.namaLengkap || 'Demo User' });
        } catch { /* abaikan */ }
      }
      const storedSurat = localStorage.getItem('integra_surat_list');
      if (storedSurat) {
        try {
          setSuratList(JSON.parse(storedSurat));
        } catch {
          setSuratList([]);
        }
      }
    }
  }, []);

  const hasSurat = suratList.length > 0;

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[390px] flex-col bg-white font-['Inter'] sm:max-w-md">
      {/* === NAVBAR CORE UI === */}
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
              <span className="text-[11px] font-bold text-[#000000]">{user?.fullName || user?.full_name || 'Demo User'}</span>
            </div>
            <svg width="37" height="37" viewBox="0 0 44 44" fill="currentColor" className="text-black shrink-0"><path d="M22 2c-8.8 0-16 7.2-16 16s7.2 16 16 16 16-7.2 16-16S30.8 2 22 2zm0 6c3.3 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6 2.7-6 6-6zm0 26.4c-4.8 0-9-2.4-11.4-6 2.4-3.6 6.6-6 11.4-6s9 2.4 11.4 6c-2.4 3.6-6.6 6-11.4 6z" /></svg>
          </button>
        </div>
      </header>

      {/* === Konten Utama === */}
      {hasSurat ? (
        /* Var 1: Ada Surat Perjalanan Dinas Aktif */
        <div className="flex flex-1 flex-col items-center px-[clamp(38px,13vw,51px)] pt-[clamp(90px,16vh,112px)]">
          <h2 className="mb-[11px] text-center text-[clamp(18px,3.5vw,20px)] font-bold text-black">
            Surat Perjalanan Dinas Aktif
          </h2>

          {/* Area surat */}
          <div className="flex w-full flex-1 items-center justify-center rounded bg-[#D9D9D9]">
            {suratList.map((surat, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center gap-2 p-6 text-center"
              >
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#666"
                  strokeWidth="1.5"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <span className="text-[14px] font-bold text-[#333]">
                  {surat.nama || 'Surat Perjalanan Dinas'}
                </span>
                {surat.url && (
                  <a
                    href={surat.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[12px] font-bold text-[#04305F] underline"
                  >
                    Lihat Surat
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Tombol Next */}
          <div className="flex w-full justify-end py-[clamp(16px,3vh,24px)]">
            <button
              type="button"
              onClick={() => onNext?.()}
              className="rounded-[70px] bg-[#04305F] px-[clamp(24px,7vw,30px)] py-[6px] text-center text-[clamp(17px,3vw,20px)] font-bold text-white shadow-md transition-all hover:brightness-110 active:scale-95"
            >
              Next
            </button>
          </div>
        </div>
      ) : (
        /* Var 2: Tidak Ada Surat Perjalanan Dinas Aktif */
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 pb-16">
          {/* Ikon document-delete */}
          <svg
            width="54"
            height="54"
            viewBox="0 0 54 54"
            fill="none"
            className="mb-2 text-[#807A7A]"
          >
            <path
              d="M12 6C12 4.34 13.34 3 15 3h24c1.66 0 3 1.34 3 3v3h9c1.1 0 2 .9 2 2s-.9 2-2 2H3c-1.1 0-2-.9-2-2s.9-2 2-2h9V6zm4 0v3h22V6H16zM5 16h44l-3.18 31.8C45.58 50.5 43.08 52 40.3 52H13.7c-2.78 0-5.28-1.5-5.52-4.2L5 16zm10 8v18c0 1.1.9 2 2 2s2-.9 2-2V24c0-1.1-.9-2-2-2s-2 .9-2 2zm10 0v18c0 1.1.9 2 2 2s2-.9 2-2V24c0-1.1-.9-2-2-2s-2 .9-2 2z"
              fill="currentColor"
            />
          </svg>

          <p className="text-center text-[clamp(17px,3.5vw,20px)] font-bold text-[#807A7A]">
            Maaf, Tidak Ada
            <br />
            Surat Perjalanan Dinas Aktif
          </p>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;