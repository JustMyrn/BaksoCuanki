import { useState } from 'react';
import AdminLoginPage from './AdminLoginPage';
import AdminDashboardPage from './AdminDashboardPage';
import AdminAssignPerjalananPage from './AdminAssignPerjalananPage';
import AdminAssignBerhasilPage from './AdminAssignBerhasilPage';
import AdminProgresPerjalananPage from './AdminProgresPerjalananPage';
import AdminReviewPreEventPage from './AdminReviewPreEventPage';
import AdminReviewEventPage from './AdminReviewEventPage';
import AdminReviewPostEventPage from './AdminReviewPostEventPage';
import AdminReviewFinalPage from './AdminReviewFinalPage';
import AdminReviewApprovedPage from './AdminReviewApprovedPage';
import AdminReviewDeniedPage from './AdminReviewDeniedPage';
import AdminReviewCetakBerkasPage from './AdminReviewCetakBerkasPage';
import AdminManageUserSignupPage from './AdminManageUserSignupPage';
import AdminManageUserResetPasswordPage from './AdminManageUserResetPasswordPage';

function AdminApp() {
  const [adminPage, setAdminPage] = useState(() => localStorage.getItem('integra_admin_page') || 'login');

  const persistPage = (page, extra) => {
    localStorage.setItem('integra_admin_page', page);
    if (extra) localStorage.setItem('integra_review_data', JSON.stringify(extra));
    setAdminPage(page);
  };

  const handleLoginSuccess = () => {
    persistPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('integra_admin_token');
    localStorage.removeItem('integra_admin_user');
    localStorage.removeItem('integra_admin_page');
    setAdminPage('login');
  };

  if (adminPage === 'login') {
    return <AdminLoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (adminPage === 'assign') {
    return <AdminAssignPerjalananPage onBack={() => persistPage('dashboard')} onLogout={handleLogout} onNavigate={persistPage} />;
  }

  if (adminPage === 'assign-berhasil') {
    return <AdminAssignBerhasilPage onBack={() => persistPage('assign')} onLogout={handleLogout} onNavigate={persistPage} />;
  }

  if (adminPage === 'progres') {
    return <AdminProgresPerjalananPage onBack={() => persistPage('dashboard')} onLogout={handleLogout} onNavigate={persistPage} />;
  }

  if (adminPage === 'manage-user-signup') {
    return <AdminManageUserSignupPage onBack={() => persistPage('dashboard')} onLogout={handleLogout} onNavigate={persistPage} />;
  }

  if (adminPage === 'manage-user-reset') {
    return <AdminManageUserResetPasswordPage onBack={() => persistPage('manage-user-signup')} onLogout={handleLogout} onNavigate={persistPage} />;
  }

  if (adminPage === 'review-pre') {
    return <AdminReviewPreEventPage onBack={() => persistPage('progres')} onLogout={handleLogout} onNavigate={persistPage} />;
  }

  if (adminPage === 'review-event') {
    return <AdminReviewEventPage onBack={() => persistPage('progres')} onLogout={handleLogout} onNavigate={persistPage} />;
  }

  if (adminPage === 'review-post') {
    return <AdminReviewPostEventPage onBack={() => persistPage('progres')} onLogout={handleLogout} onNavigate={persistPage} />;
  }

  if (adminPage === 'review-final') {
    return <AdminReviewFinalPage onBack={() => persistPage('review-post')} onLogout={handleLogout} onNavigate={persistPage} />;
  }

  if (adminPage === 'review-approved') {
    return <AdminReviewApprovedPage onBack={() => persistPage('progres')} onLogout={handleLogout} onNavigate={persistPage} />;
  }

  if (adminPage === 'review-cetak-berkas') {
    return <AdminReviewCetakBerkasPage onBack={() => persistPage('review-approved')} onLogout={handleLogout} onNavigate={persistPage} />;
  }

  if (adminPage === 'review-denied') {
    return <AdminReviewDeniedPage onBack={() => persistPage('progres')} onLogout={handleLogout} onNavigate={persistPage} />;
  }

  return <AdminDashboardPage onLogout={handleLogout} onNavigate={persistPage} />;
}

export default AdminApp;