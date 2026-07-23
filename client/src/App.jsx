import { useState } from 'react';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';

function App() {
  const [page, setPage] = useState('landing');

  if (page === 'login') {
    return (
      <LoginPage
        onBack={() => setPage('landing')}
        onNavigate={(p) => setPage(p)}
      />
    );
  }

  if (page === 'signup') {
    return (
      <SignUpPage
        onBack={() => setPage('landing')}
        onNavigate={(p) => setPage(p)}
      />
    );
  }

  return <LandingPage onNavigate={(p) => setPage(p)} />;
}

export default App;
