import React from 'react';
import logoKemenham from '../assets/logo-kemenham.png';

function ApprovedPage({ onNavigateLogin }) {
  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[390px] flex-col bg-[#FFFBF0] font-['Inter'] shadow-xl">
      {/* HEADER KEMENHAM */}
      <div className="relative h-[90px] w-full mt-[28px] pl-[5px]">
        {/* Logo */}
        <div className="absolute left-[5px] top-0 flex h-[47px] w-[59px] items-center justify-start">
          <img src={logoKemenham} alt="KEMENHAM" className="h-[59px] w-[59px] object-contain" />
        </div>
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
      <div className="mt-[160px] flex flex-col items-center justify-center gap-[10px] px-6 text-center">
        {/* Checkmark Icon */}
        <div className="relative flex h-[44px] w-[44px] items-center justify-center overflow-hidden">
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M37.5 12.5L16.5 33.5L6.5 23.5" stroke="#002659" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <div className="flex flex-col items-center mt-2">
          <span className="text-[16px] text-black">Akun berhasil dibuat!</span>
          <div className="flex items-center gap-1 mt-1 text-[15px]">
            <span className="text-black">Silahkan</span>
            <button onClick={onNavigateLogin} className="font-extrabold italic text-[#043C81] hover:underline active:opacity-70">
              Log In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApprovedPage;
