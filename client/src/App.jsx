import { useState, useEffect, useRef } from 'react';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import IsiDataDiriPage from './components/IsiDataDiriPage';
import DashboardPage from './components/DashboardPage';
import AlurPengisianPage from './components/AlurPengisianPage';
import PreEventPage from './components/PreEventPage';
import PageProfile from './components/PageProfile';
import PreEventFinalPage from './components/PreEventFinalPage';
import EventAlurPengisianPage from './components/EventAlurPengisianPage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function App() {
  const [page, setPage] = useState(() => localStorage.getItem('integra_page') || 'landing');
  const [preEventData, setPreEventData] = useState(() => {
    try { return JSON.parse(localStorage.getItem('integra_pre_event_draft')) || null; } catch { return null; }
  });
  const [preEventSubmitted, setPreEventSubmitted] = useState(() => localStorage.getItem('integra_pre_event_submitted') === 'true');
  const [sessionChecked, setSessionChecked] = useState(false);
  const didInit = useRef(false);

  const checkAndNavigate = () => {
    // Restore halaman yang terakhir dibuka (setelah refresh)
    const internalPages = ['dashboard','isi-data-diri','alur-pengisian','pre-event','pre-event-final','event-alur-pengisian','profile'];
    const savedPage = localStorage.getItem('integra_page');
    if (savedPage && internalPages.includes(savedPage)) {
      setPage(savedPage);
      return;
    }

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
      setPage('landing');
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
            const user = JSON.parse(storedUser);
            localStorage.setItem('integra_user', JSON.stringify(user));
            checkAndNavigate();
          });
        }
        if (res.status === 401) throw new Error('expired');
        // Server error lainnya → tetap lanjutkan (offline friendly)
        checkAndNavigate();
      })
      .catch(() => {
        // Hanya hapus token jika benar-benar expired (401), bukan network error
        if (!navigator.onLine) { checkAndNavigate(); }
        else {
          localStorage.removeItem('integra_token');
          localStorage.removeItem('integra_user');
          setPage('landing');
        }
      })
      .finally(() => {
        setSessionChecked(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionChecked]);

  // Persistensi: simpan halaman saat ini & flag submitted ke localStorage
  useEffect(() => { if (!didInit.current) { didInit.current = true; return; } localStorage.setItem('integra_page', page); }, [page]);
  useEffect(() => { localStorage.setItem('integra_pre_event_submitted', preEventSubmitted ? 'true' : 'false'); }, [preEventSubmitted]);

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
        readOnly={preEventSubmitted}
        onNext={(fullData) => {
          localStorage.setItem('integra_pre_event_draft', JSON.stringify(fullData));
          setPreEventData(fullData);
          setPage('pre-event-final');
        }}
      />
    );
  }

  if (page === 'pre-event-final') {
    return (
      <PreEventFinalPage
        onBack={() => setPage('pre-event')}
        onOpenProfile={() => setPage('profile')}
        preEventData={preEventData}
        submitted={preEventSubmitted}
        onSave={async (finalData) => {
          const fullData = { ...preEventData, ...finalData };
          localStorage.setItem('integra_pre_event', JSON.stringify(fullData));
          try {
            const token = localStorage.getItem('integra_token');
            if (token && token !== 'demo-token') {
              await fetch(`${API_BASE_URL}/api/perjalanan-dinas`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(fullData),
              });
            }
          } catch (e) { /* demo fallback */ }
          setPreEventSubmitted(true);
        }}
        onNext={() => setPage('event-alur-pengisian')}
      />
    );
  }

  if (page === 'event-alur-pengisian') {
    return (
      <EventAlurPengisianPage
        onBack={() => setPage('dashboard')}
        onNavigate={(p) => setPage(p)}
        onOpenProfile={() => setPage('profile')}
      />
    );
  }

  if (page === 'profile') {
    return (
      <PageProfile
        onBack={() => setPage('dashboard')}
        onLogout={() => { localStorage.removeItem('integra_page'); setPage('landing'); }}
      />
    );
  }

  return <LandingPage onNavigate={(p) => setPage(p)} />;
}

export default App;