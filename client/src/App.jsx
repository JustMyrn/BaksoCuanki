import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import IsiDataDiriPage from './components/IsiDataDiriPage';
import DashboardPage from './components/DashboardPage';
import AlurPengisianPage from './components/AlurPengisianPage';
import PreEventPage from './components/PreEventPage';
import PageProfile from './components/PageProfile';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function App() {
  const [page, setPage] = useState('landing');
  const [preEventData, setPreEventData] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  const checkAndNavigate = () => {
    const storedUser = localStorage.getItem('integra_user');
    let needsProfile = true;

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        // Sudah isi profil jika: full_name terisi, atau status pending_approval, atau approved
        if (
          (user.fullName && user.fullName.trim()) ||
          (user.full_name && user.full_name.trim()) ||
          user.onboardingStatus === 'pending_approval' ||
          user.onboardingStatus === 'approved'
        ) {
          needsProfile = false;
        }
      } catch {
        // fallback: cek localStorage lama
      }
    }

    if (!needsProfile) {
      setPage('dashboard');
      return;
    }

    // Cek apakah data diri pernah diisi sebelumnya (hanya sebagai fallback)
    const data = localStorage.getItem('integrasi_data_diri');
    setPage(data ? 'dashboard' : 'isi-data-diri');
  };

  // ⬇️ useEffect HARUS di atas semua conditional return (Rules of Hooks)
  // Auto-restore sesi saat refresh atau buka ulang
  useEffect(() => {
    if (sessionChecked) return;

    const token = localStorage.getItem('integra_token');
    const storedUser = localStorage.getItem('integra_user');

    if (!token || !storedUser) {
      setSessionChecked(true);
      return;
    }

    if (token === 'demo-token') {
      checkAndNavigate();
      setSessionChecked(true);
      return;
    }

    fetch(`${API_BASE_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.ok) {
          return res.json().then(() => {
            // Token valid — lanjut ke dashboard
            const user = JSON.parse(storedUser);
            localStorage.setItem('integra_user', JSON.stringify(user));
            checkAndNavigate();
          });
        }
        // Token expired/tidak valid — logout bersih
        throw new Error('session expired');
      })
      .catch(() => {
        localStorage.removeItem('integra_token');
        localStorage.removeItem('integra_user');
      })
      .finally(() => {
        setSessionChecked(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionChecked]);

  // ⬇️ Semua conditional return di ATAS useEffect (sudah ada di atas)

  if (page === 'login') {
    return (
      <LoginPage
        onBack={() => setPage('landing')}
        onNavigate={(p) => setPage(p)}
        onLoginSuccess={checkAndNavigate}
      />
    );
  }

  if (page === 'signup') {
    return (
      <SignUpPage
        onBack={() => setPage('landing')}
        onNavigate={(p) => setPage(p)}
        onSignUpSuccess={checkAndNavigate}
      />
    );
  }

  if (page === 'isi-data-diri') {
    return <IsiDataDiriPage onComplete={() => setPage('dashboard')} />;
  }

  if (page === 'dashboard') {
    return (
      <DashboardPage
        onNext={() => setPage('alur-pengisian')}
        onOpenProfile={() => setPage('profile')}
      />
    );
  }

  if (page === 'alur-pengisian') {
    return (
      <AlurPengisianPage
        onBack={() => setPage('dashboard')}
        onNavigate={(p) => setPage(p)}
        onOpenProfile={() => setPage('profile')}
      />
    );
  }

  if (page === 'pre-event') {
    return (
      <PreEventPage
        onBack={() => setPage('alur-pengisian')}
        onOpenProfile={() => setPage('profile')}
        onNext={(fullData) => {
          // ponytail: simpan ke localStorage untuk demo, nanti diganti POST /api/perjalanan-dinas
          localStorage.setItem('integra_pre_event', JSON.stringify(fullData));
          setPage('dashboard');
        }}
      />
    );
  }

  if (page === 'profile') {
    return (
      <PageProfile
        onBack={() => setPage('dashboard')}
        onLogout={() => setPage('landing')}
      />
    );
  }

  return <LandingPage onNavigate={(p) => setPage(p)} />;
}

export default App;