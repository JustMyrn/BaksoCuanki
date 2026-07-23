import logoKemenham from '../assets/logo-kemenham.png';

function LandingPage({ onNavigate }) {
  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[390px] flex-col items-center overflow-hidden font-['Inter'] sm:max-w-md">
      {/* Background Gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #c9d9ec 10%, #2f96d5 47%, #00336d 74%)',
        }}
      />

      {/* === Navbar Atas === */}
      <nav className="relative z-20 flex w-full items-center justify-center gap-[clamp(44px,14vw,68px)] pt-[clamp(26px,4.7vh,38px)]">
        <a
          href="#tentang"
          className="text-[clamp(12px,2vw,14px)] font-bold tracking-[0.03em] text-[#0b3566] transition-opacity hover:opacity-70"
        >
          Tentang
        </a>
        <a
          href="#sop"
          className="text-[clamp(12px,2vw,14px)] font-bold tracking-[0.03em] text-[#0b3566] transition-opacity hover:opacity-70"
        >
          SOP
        </a>
        <a
          href="#tutorial"
          className="text-[clamp(12px,2vw,14px)] font-bold tracking-[0.03em] text-[#0b3566] transition-opacity hover:opacity-70"
        >
          Tutorial
        </a>
      </nav>

      {/* === Logo & Branding === */}
      <div className="relative z-10 mt-[clamp(86px,13.5vh,108px)] flex w-full flex-col items-center gap-[5px] px-8 sm:px-[31px]">
        <img
          src={logoKemenham}
          alt="Logo Kementerian HAM"
          className="h-[clamp(90px,14vh,112px)] w-[clamp(90px,14vh,112px)] object-contain drop-shadow-sm"
        />

        <h1
          className="text-[clamp(46px,9.2vw,52px)] font-extrabold leading-none tracking-[0.04em] text-[#f8fbff]"
          style={{
            WebkitTextStroke: '2.3px #073f78',
            paintOrder: 'stroke fill',
            textShadow: '0 2px 0 rgba(7, 63, 120, 0.25)',
          }}
        >
          INTEGRA
        </h1>

        <p className="text-center text-[clamp(16px,2.7vw,20px)] font-medium leading-tight text-[#f5fbff]">
          Integritas Administrasi &
          <br />
          Tata Kelola Perjalanan Dinas
        </p>

        <p className="text-center text-[clamp(17px,2.9vw,22px)] font-extrabold leading-tight text-[#ffd80a]">
          Kementerian Hak Asasi Manusia
          <br />
          Kantor Wilayah Lampung
        </p>
      </div>

      {/* === Spacer fleksibel === */}
      <div className="relative z-10 flex-1" />

      {/* === Card Selamat Datang (Ellipse + Tombol) === */}
      <div className="relative z-10 flex w-full flex-col items-center overflow-visible pb-[clamp(24px,4vh,40px)]">
        {/* Ellipse — posisi dari Figma: x=-57, y=496 (covers bottom area) */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
          <div
            className="bg-[#f5f2ea]"
            style={{
              width: 'clamp(418px,139vw,530px)',
              height: 'clamp(320px,53vh,440px)',
              borderRadius: '50% 50% 0 0 / 34% 34% 0 0',
            }}
          />
        </div>

        {/* Konten card */}
        <div className="relative z-10 flex flex-col items-center gap-[14px] pb-[clamp(24px,4vh,36px)] pt-[clamp(68px,11vh,88px)] sm:gap-4">
          <h2 className="text-[clamp(40px,8.5vw,48px)] font-bold text-[#0a3f79]">
            Selamat Datang
          </h2>

          <button
            type="button"
            onClick={() => onNavigate?.('login')}
            className="w-[clamp(130px,40vw,156px)] rounded-[30px] border-[3px] border-[#04305F] bg-[#04305F] py-[clamp(8px,1.5vh,11px)] text-center text-[clamp(17px,3vw,20px)] font-bold tracking-[0.05em] text-white shadow-md transition-all hover:brightness-110 active:scale-95"
          >
            Log In
          </button>

          <button
            type="button"
            onClick={() => onNavigate?.('signup')}
            className="w-[clamp(130px,40vw,156px)] rounded-[30px] border-[3px] border-[#04305F] bg-[#D5E8FA] py-[clamp(8px,1.5vh,11px)] text-center text-[clamp(17px,3vw,20px)] font-bold tracking-[0.05em] text-[#044B80] shadow-md transition-all hover:brightness-105 active:scale-95"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
