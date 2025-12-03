import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import History from './pages/History';
import Landing from './pages/Landing';
import Layout from './components/Layout';
import { User } from './types';
import { getCurrentUser } from './services/authService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionUser = getCurrentUser();
    if (sessionUser) {
      setUser(sessionUser);
    }
    setLoading(false);
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading ResuMate...</div>;

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={!user ? <Landing /> : <Navigate to="/dashboard" />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        
        {/* Protected Routes */}
        <Route element={user ? <Layout user={user} setUser={setUser} /> : <Navigate to="/login" />}>
          <Route path="/dashboard" element={<Dashboard user={user!} />} />
          <Route path="/history" element={<History user={user!} />} />
          <Route path="/profile" element={<Profile user={user!} setUser={setUser} />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;