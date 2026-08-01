import { useState } from 'react';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import IsiDataDiriPage from './components/IsiDataDiriPage';
import DashboardPage from './components/DashboardPage';
import AlurPengisianPage from './components/AlurPengisianPage';
import PreEventPage from './components/PreEventPage';

function App() {
  const [page, setPage] = useState('landing');
  const [preEventData, setPreEventData] = useState(null);

  const checkAndNavigate = () => {
    // Cek apakah user perlu isi data diri
    const storedUser = localStorage.getItem('integra_user');
    let needsProfile = true;

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        // Kalau user sudah approved/sudah isi profile, langsung dashboard
        if (
          user.onboardingStatus === 'approved' ||
          user.onboardingStatus === 'pending_approval'
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

    // Cek apakah data diri pernah diisi sebelumnya
    const data = localStorage.getItem('integrasi_data_diri');
    setPage(data ? 'dashboard' : 'isi-data-diri');
  };

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
      />
    );
  }

  if (page === 'alur-pengisian') {
    return (
      <AlurPengisianPage
        onBack={() => setPage('dashboard')}
        onNavigate={(p) => setPage(p)}
      />
    );
  }

  if (page === 'pre-event') {
    return (
      <PreEventPage
        onBack={() => setPage('alur-pengisian')}
        onNext={(fullData) => {
          // ponytail: simpan ke localStorage untuk demo, nanti diganti POST /api/perjalanan-dinas
          localStorage.setItem('integra_pre_event', JSON.stringify(fullData));
          setPage('dashboard');
        }}
      />
    );
  }

  return <LandingPage onNavigate={(p) => setPage(p)} />;
}

export default App;
