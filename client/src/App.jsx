import React, { useState, useEffect } from 'react'; // Añadimos useState y useEffect
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { LayoutGrid, Music, Calendar as CalendarIcon, LogOut } from 'lucide-react';
import axios from 'axios';

import Dashboard from './components/Dashboard';
import SongLibrary from './components/SongLibrary';
import CreateEvent from './components/CreateEvent';
import EventList from './components/EventList';
import EventDetails from './components/EventDetails';
import Login from './components/Login';

axios.defaults.baseURL = "";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  // ✅ NUEVO: Estado de autenticación para que React "reaccione" al cambio
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  // ✅ Función para actualizar el estado desde el Login
  const checkAuth = () => {
    setIsAuthenticated(!!localStorage.getItem('token'));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false); // Actualizamos el estado al instante
    window.location.href = '/login';
  };

  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-white font-sans">
        
        {/* ✅ Ahora el menú se mostrará/ocultará al instante */}
        {isAuthenticated && (
          <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 sticky top-0 z-50 shadow-lg">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <Link to="/dashboard" className="flex items-center gap-2 group">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center group-hover:bg-emerald-400 transition-colors">
                  <Music size={20} className="text-slate-900" />
                </div>
                <span className="text-emerald-400 font-bold text-xl tracking-wider hidden sm:inline uppercase">
                  GIG MANAGER
                </span>
              </Link>

              <div className="flex items-center gap-4 sm:gap-8">
                <Link to="/dashboard" className="flex items-center gap-2 text-slate-300 hover:text-emerald-400 transition-all font-medium">
                  <LayoutGrid size={18} /> <span className="text-sm">Dashboard</span>
                </Link>
                <Link to="/gigs" className="flex items-center gap-2 text-slate-300 hover:text-emerald-400 transition-all font-medium">
                  <CalendarIcon size={18} /> <span className="text-sm">Gigs</span>
                </Link>
                <Link to="/library" className="flex items-center gap-2 text-slate-300 hover:text-emerald-400 transition-all font-medium">
                  <Music size={18} /> <span className="text-sm">Repertoire</span>
                </Link>

                <button 
                  onClick={handleLogout}
                  className="ml-4 flex items-center gap-2 text-slate-500 hover:text-red-400 transition-all font-bold text-xs uppercase tracking-widest"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </div>
          </nav>
        )}

        <main className="max-w-6xl mx-auto p-4">
          <Routes>
            {/* ✅ Pasamos checkAuth al Login para que avise cuando el usuario entre */}
            <Route path="/login" element={<Login onLoginSuccess={checkAuth} />} />
            
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/gigs" element={<ProtectedRoute><EventList /></ProtectedRoute>} />
            <Route path="/create-event" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
            <Route path="/library" element={<ProtectedRoute><SongLibrary /></ProtectedRoute>} />
            <Route path="/event/:id" element={<ProtectedRoute><EventDetails /></ProtectedRoute>} />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>

        <footer className="mt-20 py-8 border-t border-slate-800 text-center text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} Violin GigManager - Final Project
        </footer>
      </div>
    </Router>
  );
}

export default App;