import { useState } from 'react';
import AdminLoginPage from './AdminLoginPage';
import AdminDashboardPage from './AdminDashboardPage';

function AdminApp() {
  const [adminPage, setAdminPage] = useState(() => localStorage.getItem('integra_admin_page') || 'login');

  const persistPage = (page) => {
    localStorage.setItem('integra_admin_page', page);
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

  return <AdminDashboardPage onLogout={handleLogout} />;
}

export default AdminApp;