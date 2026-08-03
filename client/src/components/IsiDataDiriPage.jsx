import { useState } from 'react';
import logoKemenham from '../assets/logo-kemenham.png';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function IsiDataDiriPage({ onComplete }) {
  const [form, setForm] = useState({
    namaLengkap: '',
    nip: '',
    jabatan: '',
    pangkatGolongan: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { namaLengkap, nip, jabatan, pangkatGolongan } = form;

    if (!namaLengkap.trim() || !nip.trim() || !jabatan.trim() || !pangkatGolongan.trim()) {
      setError('Semua field wajib diisi');
      return;
    }

    setError('');
    setLoading(true);

    const token = localStorage.getItem('integra_token');

    // Kirim ke server
    if (token && token !== 'demo-token') {
      try {
        const res = await fetch(`${API_BASE_URL}/api/profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fullName: namaLengkap.trim(),
            nip: nip.trim(),
            jabatan: jabatan.trim(),
            pangkatGolongan: pangkatGolongan.trim(),
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Gagal menyimpan data');
        }

        // Update localStorage dengan user terbaru dari server
        if (data.user) {
          localStorage.setItem('integra_user', JSON.stringify(data.user));
        }
      } catch (err) {
        // Fallback: simpan ke localStorage jika backend error
        localStorage.setItem(
          'integrasi_data_diri',
          JSON.stringify({ namaLengkah: namaLengkap, nip, jabatan, pangkatGolongan })
        );
      }
    } else {
      // Demo mode / no token — localStorage fallback
      localStorage.setItem(
        'integrasi_data_diri',
        JSON.stringify({ namaLengkap, nip, jabatan, pangkatGolongan })
      );
    }

    setLoading(false);
    onComplete?.();
  };

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[390px] flex-col items-center overflow-hidden bg-[#FFFBF0] font-['Inter'] sm:max-w-md">
      {/* === Header === */}
      <div className="relative z-10 flex w-full items-center gap-2 px-[clamp(32px,10vw,44px)] pt-[clamp(50px,8vh,63px)]">
        <button
          type="button"
          onClick={onComplete}
          className="text-[#000000]"
          aria-label="Kembali"
        >
          <svg width="28" height="28" viewBox="0 0 34 34" fill="none">
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

      {/* === Card Form === */}
      <form
        onSubmit={handleSubmit}
        className="relative z-10 mt-[clamp(30px,5vh,42px)] w-[clamp(260px,77vw,302px)] rounded-[30px] bg-[#D5E8FA] px-[clamp(20px,6vw,32px)] py-[clamp(28px,5vh,40px)]"
      >
        {/* Logo & Judul di dalam card */}
        <div className="mb-8 flex flex-col items-center gap-[5px]">
          <img
            src={logoKemenham}
            alt="Logo Kemenham"
            className="h-[clamp(80px,13vh,118px)] w-[clamp(80px,13vh,118px)] object-contain"
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

        {/* Field Input */}
        <div className="flex flex-col gap-5">
          {/* Nama Lengkap */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="namaLengkap"
              className="text-[clamp(12px,2vw,15px)] font-bold text-[#000000]"
            >
              Nama Lengkap
            </label>
            <input
              id="namaLengkap"
              name="namaLengkap"
              type="text"
              value={form.namaLengkap}
              onChange={handleChange}
              placeholder="Masukkan nama lengkap"
              className="h-[41px] w-full border border-[#04305F] bg-[#EFEFED] px-3 text-[13px] font-bold text-[#04305F] outline-none placeholder:text-[#04305F]/40"
            />
          </div>

          {/* NIP */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="nip"
              className="text-[clamp(12px,2vw,15px)] font-bold text-[#000000]"
            >
              NIP
            </label>
            <input
              id="nip"
              name="nip"
              type="text"
              value={form.nip}
              onChange={handleChange}
              placeholder="Masukkan NIP"
              className="h-[41px] w-full border border-[#04305F] bg-[#EFEFED] px-3 text-[13px] font-bold text-[#04305F] outline-none placeholder:text-[#04305F]/40"
            />
          </div>

          {/* Jabatan */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="jabatan"
              className="text-[clamp(12px,2vw,15px)] font-bold text-[#000000]"
            >
              Jabatan
            </label>
            <input
              id="jabatan"
              name="jabatan"
              type="text"
              value={form.jabatan}
              onChange={handleChange}
              placeholder="Masukkan jabatan"
              className="h-[41px] w-full border border-[#04305F] bg-[#EFEFED] px-3 text-[13px] font-bold text-[#04305F] outline-none placeholder:text-[#04305F]/40"
            />
          </div>

          {/* Pangkat/Golongan */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="pangkatGolongan"
              className="text-[clamp(12px,2vw,15px)] font-bold text-[#000000]"
            >
              Pangkat/Golongan
            </label>
            <input
              id="pangkatGolongan"
              name="pangkatGolongan"
              type="text"
              value={form.pangkatGolongan}
              onChange={handleChange}
              placeholder="Masukkan pangkat/golongan"
              className="h-[41px] w-full border border-[#04305F] bg-[#EFEFED] px-3 text-[13px] font-bold text-[#04305F] outline-none placeholder:text-[#04305F]/40"
            />
          </div>

          {/* Error message */}
          {error && (
            <p className="text-center text-[12px] font-bold text-red-600">
              {error}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="mx-auto mt-2 w-[160px] rounded-[30px] bg-[#04305F] py-[10px] text-center text-[15px] font-bold tracking-[0.05em] text-white shadow-md transition-all hover:brightness-110 active:scale-95"
          >
            Simpan
          </button>
        </div>
      </form>
    </div>
  );
}

export default IsiDataDiriPage;