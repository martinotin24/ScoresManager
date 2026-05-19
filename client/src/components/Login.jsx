import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Music, Lock, User, ArrowRight } from 'lucide-react';

// ✅ Recibimos onLoginSuccess como prop
const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  // ✅ Usamos la URL de producción o vacía si Nginx maneja el proxy
  const SERVER_URL = "";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await axios.post(`${SERVER_URL}/api/login`, { username, password });
      
      if (res.data.token) {
        // 1. Guardamos los datos en el storage
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', username);

        // ✅ 2. AVISAMOS A APP.JSX: Esto hará que el menú aparezca AL INSTANTE
        if (onLoginSuccess) {
          onLoginSuccess();
        }

        // 3. Redirigimos
        navigate('/dashboard'); 
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error al iniciar sesión");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        {/* LOGO / ICONO */}
        <div className="flex flex-col items-center mb-10">
          <div className="bg-emerald-500/10 p-5 rounded-3xl border border-emerald-500/20 mb-4">
            <Music size={48} className="text-emerald-400" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">GigManager</h1>
          <p className="text-slate-500 text-sm mt-2">Welcome Again, Martin</p>
        </div>

        {/* FORMULARIO */}
        <form onSubmit={handleLogin} className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-xl shadow-2xl space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-3 px-4 rounded-xl text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">User</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-400 transition-colors" size={20} />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                placeholder="Username"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-400 transition-colors" size={20} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20"
          >
            ENTER <ArrowRight size={20} />
          </button>
        </form>

        <p className="text-center text-slate-600 text-[10px] mt-8 uppercase tracking-[0.2em]">
          Protegido por GigManager Security
        </p>
      </div>
    </div>
  );
};

export default Login;