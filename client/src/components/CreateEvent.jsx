import React, { useState } from 'react';
import axios from 'axios';
import { Calendar, MapPin, Tag, ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CreateEvent = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', location: '', event_date: '' });

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const res = await axios.post('/api/events', formData);
    if (res.status === 200 || res.status === 201) {
      navigate('/gigs'); 
    }
  } catch (err) {
    console.error("Error saving:", err);
    alert("Check backend logs; the event might not have saved.");
  }
};

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white flex items-center gap-2 mb-6 transition-colors group">
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform"/> Back to Dashboard
      </button>
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
          <Calendar className="text-emerald-400" /> New Performance
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-slate-400 text-sm font-medium mb-2 flex items-center gap-2"><Tag size={16}/> Event Name</label>
            <input className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all" placeholder="e.g. Wedding Ceremony" required onChange={e => setFormData({...formData, name: e.target.value})}/>
          </div>
          <div>
            <label className="block text-slate-400 text-sm font-medium mb-2 flex items-center gap-2"><MapPin size={16}/> Venue</label>
            <input className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all" placeholder="Location name" onChange={e => setFormData({...formData, location: e.target.value})}/>
          </div>
          <div>
            <label className="block text-slate-400 text-sm font-medium mb-2 flex items-center gap-2"><Calendar size={16}/> Date and Time</label>
            <input type="datetime-local" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all" required onChange={e => setFormData({...formData, event_date: e.target.value})}/>
          </div>
          <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 py-4 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
            <Save size={20}/> SAVE EVENT
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;