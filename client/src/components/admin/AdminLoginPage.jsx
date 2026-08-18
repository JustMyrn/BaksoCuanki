import { useState } from 'react';
import '@fontsource/aoboshi-one';
import logoKemenham from '../../assets/logo-kemenham.png';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function AdminLoginPage({ onLoginSuccess }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [show, setShow] = useState(false);
  const [load, setLoad] = useState(false);
  const [err, setErr] = useState('');

  async function login(e) {
    e.preventDefault(); setLoad(true); setErr('');
    try {
      const r = await fetch(`${API}/api/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:user,password:pass})});
      const d = await r.json();
      if(!r.ok) throw new Error(d.message||'Login failed');
      if(d.token) localStorage.setItem('integra_admin_token',d.token);
      localStorage.setItem('integra_admin_user',JSON.stringify(d.user||null));
      localStorage.setItem('integra_admin_page','dashboard');
      onLoginSuccess?.();
    } catch(x){setErr(x.message||'Login gagal')}
    finally{setLoad(false);}
  }
  const S=v=>({WebkitTextStroke:v,paintOrder:'stroke fill'});
  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden" style={{padding:'44px 28px'}}>
      {/* Background: kanwil building jelas */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-100 to-blue-200"/>
        <img src="/images/kanwil-building.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.85]"/>
      </div>

      {/* Logo KEMENHAM kiri-atas */}
      <div className="absolute left-7 top-8 z-20 flex items-center gap-3">
        <img src={logoKemenham} alt="" className="h-20 w-20 shrink-0 object-contain"/>
        <div className="flex flex-col">
          <span className="text-sm font-bold leading-none text-blue-900">KEMENHAM</span>
          <span className="text-xs font-bold leading-tight text-blue-900">Kementerian Hak Asasi Manusia</span>
          <span className="text-xs font-bold leading-tight text-blue-900">Kantor Wilayah Lampung</span>
        </div>
      </div>

      {/* Container putih transparan besar */}
      <div className="relative z-10 flex w-full max-w-7xl flex-col items-center rounded-3xl bg-white/[0.70] px-16 py-12 shadow-2xl border-4 border-white/40">
        <div className="text-center">
          <h1 className="font-['Inter'] text-[84px] font-black leading-[1] tracking-[0.1em] text-white" style={S('7px #04133E')}>INTEGRA</h1>
          <h2 className="font-['Inter'] text-[36px] font-black tracking-[0.05em] text-white" style={S('3px #04133E')}>Selamat Datang</h2>
        </div>
        <div className="h-[60px]"/>
        <div className="w-[clamp(400px,55vw,819px)] rounded-[25px] bg-[#D5E8FA] px-20 py-10 shadow-lg">
          <h3 className="mb-[26px] text-center font-['Aoboshi_One'] text-[64px] leading-[1] text-[#04133E]" style={S('1px #FFF')}>Log in</h3>
          <form onSubmit={login} className="flex flex-col items-center gap-[18px]">
            <input type="text" placeholder="Username" value={user} onChange={e=>setUser(e.target.value)}
              className="w-full rounded-[25px] border-[4px] border-black bg-[#D5E8FA] px-10 py-[28px] font-['Aoboshi_One'] text-[24px] text-black placeholder:text-black/50 outline-none focus:border-[#04305F]" required />
            <div className="relative w-full">
              <input type={show?'text':'password'} placeholder="Kata Sandi" value={pass} onChange={e=>setPass(e.target.value)}
                className="w-full rounded-[25px] border-[4px] border-black bg-[#D5E8FA] px-10 py-[28px] font-['Aoboshi_One'] text-[24px] text-black placeholder:text-black/50 outline-none focus:border-[#04305F]" required />
              <button type="button" onClick={()=>setShow(!show)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-bold text-[#04305F]/60 hover:text-[#04305F]">{show?'Hide':'Show'}</button>
            </div>
            <button type="submit" disabled={load}
              className="mt-[14px] h-[60px] w-[261px] rounded-[25px] bg-[#04133E] text-center font-['Aoboshi_One'] text-[24px] tracking-[0.05em] text-white shadow-md hover:brightness-110 active:scale-95 disabled:opacity-60">{load?'Loading...':'Log In'}</button>
          </form>
          {err&&<p className="mt-4 text-center text-[13px] font-bold text-red-600">{err}</p>}
        </div>
      </div>
    </div>
  );
}

export default AdminLoginPage;