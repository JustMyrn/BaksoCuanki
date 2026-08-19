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
import EventPage from './components/EventPage';
import PostEventAlurPengisianPage from './components/PostEventAlurPengisianPage';
import PostEventPage from './components/PostEventPage';
import PostEventFinalPage from './components/PostEventFinalPage';
import WaitingApprovalPage from './components/WaitingApprovalPage';
import ApprovedPage from './components/ApprovedPage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function App() {
  const [page, setPage] = useState(() => localStorage.getItem('integra_page') || 'landing');
  const [preEventData, setPreEventData] = useState(() => {
    try { return JSON.parse(localStorage.getItem('integra_pre_event_draft')) || null; } catch { return null; }
  });
  const [preEventSubmitted, setPreEventSubmitted] = useState(() => localStorage.getItem('integra_pre_event_submitted') === 'true');
  const [eventSubmitted, setEventSubmitted] = useState(() => localStorage.getItem('integra_event_submitted') === 'true');
  const [postEventSubmitted, setPostEventSubmitted] = useState(() => localStorage.getItem('integra_post_event_submitted') === 'true');
  const [sessionChecked, setSessionChecked] = useState(false);
  const didInit = useRef(false);

  const checkAndNavigate = () => {
    // Restore halaman yang terakhir dibuka (setelah refresh)
    const internalPages = ['dashboard','isi-data-diri','alur-pengisian','pre-event','pre-event-final','event-alur-pengisian','event','post-event-alur-pengisian','profile','waiting-approval','approved-page'];
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
      // Jika butuh persetujuan admin
      const u = JSON.parse(storedUser);
      if (u.onboardingStatus === 'pending_approval' || u.approvalStatus === 'pending') {
        setPage('waiting-approval');
        return;
      }
      // Jika sudah diapprove tapi belum lihat halaman success
      if (u.approvalStatus === 'approved' && !localStorage.getItem('integra_has_seen_approved')) {
        setPage('approved-page');
        return;
      }
      
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
  useEffect(() => { localStorage.setItem('integra_event_submitted', eventSubmitted ? 'true' : 'false'); }, [eventSubmitted]);

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
    return <IsiDataDiriPage onComplete={() => setPage('waiting-approval')} />;
  }

  if (page === 'waiting-approval') {
    return (
      <WaitingApprovalPage
        onBack={() => {
          localStorage.removeItem('integra_token');
          localStorage.removeItem('integra_user');
          setPage('landing');
        }}
      />
    );
  }

  if (page === 'approved-page') {
    return (
      <ApprovedPage
        onNavigateLogin={() => {
          localStorage.setItem('integra_has_seen_approved', 'true');
          localStorage.removeItem('integra_token');
          localStorage.removeItem('integra_user');
          setPage('login');
        }}
      />
    );
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
        onReset={() => {
          localStorage.removeItem('integra_pre_event_draft');
          localStorage.removeItem('integra_pre_event_final_draft');
          localStorage.removeItem('integra_pre_event_submitted');
          localStorage.removeItem('integra_pre_event');
          setPreEventData(null);
          setPreEventSubmitted(false);
          setPage('pre-event');
          window.location.reload(); // Force reload to clear all states reliably
        }}
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

  if (page === 'event') {
    return (
      <EventPage
        onBack={() => setPage('event-alur-pengisian')}
        onOpenProfile={() => setPage('profile')}
        submitted={eventSubmitted}
        onSave={async (data) => {
          console.log('Event Saved', data);
          setEventSubmitted(true);
          setPage('post-event-alur-pengisian');
        }}
        onReset={() => {
          localStorage.removeItem('integra_event_draft');
          localStorage.removeItem('integra_event_submitted');
          setEventSubmitted(false);
          setPage('event');
          window.location.reload();
        }}
        onNext={() => setPage('post-event-alur-pengisian')}
      />
    );
  }

  if (page === 'post-event-alur-pengisian') {
    return (
      <PostEventAlurPengisianPage
        onBack={() => setPage('dashboard')}
        onNavigate={(p) => setPage(p)}
        onOpenProfile={() => setPage('profile')}
      />
    );
  }

  if (page === 'post-event') {
    return (
      <PostEventPage
        onBack={() => setPage('post-event-alur-pengisian')}
        readOnly={postEventSubmitted}
        onNext={() => setPage('post-event-final')}
      />
    );
  }

  if (page === 'post-event-final') {
    return (
      <PostEventFinalPage
        onBack={() => setPage('post-event')}
        readOnly={postEventSubmitted}
        onSave={async (data) => {
          try {
            const token = localStorage.getItem('integra_token');
            const res = await fetch(`${API_BASE_URL}/api/post-event`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(data),
            });
            if (res.ok) {
              setPostEventSubmitted(true);
              localStorage.setItem('integra_post_event_submitted', 'true');
            } else {
              alert('Gagal menyimpan Post-Event');
            }
          } catch (err) {
            alert('Terjadi kesalahan jaringan');
          }
        }}
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