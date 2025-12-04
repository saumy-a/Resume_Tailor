import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { User } from '../types';
import { logout } from '../services/authService';

interface LayoutProps {
  user: User;
  setUser: (u: User | null) => void;
}

const Layout: React.FC<LayoutProps> = ({ user, setUser }) => {
  const location = useLocation();

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'History', path: '/history' },
    { label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link to="/dashboard" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
               <span className="material-symbols-outlined text-indigo-500 text-3xl">description</span>
               <h1 className="text-2xl font-bold text-indigo-500 tracking-tight">ResuMate SaaS</h1>
            </Link>
            
            <div className="flex items-center space-x-6">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-medium text-gray-700">{user.name}</span>
                <span className="text-xs text-gray-400">{user.email}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="text-sm text-red-500 hover:text-red-600 font-medium transition-colors flex items-center"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm z-10">
        <div className="container mx-auto px-6">
          <div className="flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                  location.pathname === item.path
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow container mx-auto p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;