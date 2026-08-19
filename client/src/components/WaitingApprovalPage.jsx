import React from 'react';
import logoKemenham from '../assets/logo-kemenham.png';

function WaitingApprovalPage({ onBack }) {
  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[390px] flex-col bg-[#FFFBF0] font-['Inter'] shadow-xl">
      {/* HEADER KEMENHAM */}
      <div className="relative h-[90px] w-full mt-[28px] pl-[5px]">
        {/* Logo */}
        <button type="button" onClick={onBack} className="absolute left-[5px] top-0 flex h-[47px] w-[59px] items-center justify-start hover:opacity-80 active:scale-95 transition-all">
          <img src={logoKemenham} alt="KEMENHAM" className="h-[59px] w-[59px] object-contain" />
        </button>
        {/* Title "KEMENHAM" */}
        <div className="absolute left-[67px] top-0 flex items-center justify-center">
          <span className="text-[14px] font-bold tracking-[1.40px] text-[#04305F]">KEMENHAM</span>
        </div>
        {/* Subtitle */}
        <div className="absolute left-[57px] top-[18px] flex h-[37px] items-center justify-center p-[10px]">
          <span className="w-[173px] text-[11px] font-bold leading-tight text-[#045890]">
            Kementerian Hak Asasi Manusia<br />
            Kantor Wilayah Lampung
          </span>
        </div>
      </div>

      {/* CENTER CONTENT */}
      <div className="mt-[160px] flex flex-col items-center justify-center gap-2 px-6 text-center">
        {/* Clock Icon */}
        <div className="relative flex h-[44px] w-[44px] items-center justify-center overflow-hidden">
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="22" cy="22" r="18" stroke="#002659" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 10V22L29 27" stroke="#002659" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <h2 className="text-[18px] font-bold text-black">Berhasil Mendaftar!</h2>
        <p className="text-[13px] text-black">Menunggu Persetujuan Admin</p>
      </div>

    </div>
  );
}

export default WaitingApprovalPage;
