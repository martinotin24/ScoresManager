import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
// Importamos Trash2 para el botón de borrar
import { Plus, MapPin, Clock, Calendar as CalendarIcon, ChevronRight, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await axios.get('/api/events');
      setEvents(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // --- NUEVA FUNCIÓN PARA ELIMINAR ---
  const handleDelete = async (e, id) => {
    e.preventDefault(); // Evita que el Link se active y nos mande a la otra página
    e.stopPropagation(); // Evita que el clic se propague al contenedor

    if (window.confirm("¿Seguro que quieres eliminar este evento?")) {
      try {
        await axios.delete(`/api/events/${id}`);
        // Filtramos el estado para que desaparezca visualmente
        setEvents(events.filter(evt => evt.id !== id));
      } catch (err) {
        console.error("Error al eliminar:", err);
        alert("No se pudo eliminar el evento.");
      }
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-8 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <CalendarIcon className="text-emerald-400" size={32} /> Performance Schedule
          </h1>
          <p className="text-slate-400 mt-2">Manage your upcoming violin gigs and weddings.</p>
        </div>
        
        <Link to="/create-event" className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 transition-all font-bold shadow-lg shadow-emerald-500/20 active:scale-95">
          <Plus size={20} /> NEW EVENT
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full py-20 text-center text-slate-500 animate-pulse">Loading schedule...</div>
        ) : events.length > 0 ? (
          events.map(evt => (
            <Link to={`/event/${evt.id}`} key={evt.id} className="group relative">
              <div className="bg-slate-800/40 border border-slate-700 p-6 rounded-3xl flex justify-between items-center hover:border-emerald-500/50 hover:bg-slate-800/60 transition-all shadow-sm h-full">
                <div className="space-y-3 pr-10"> {/* Espacio para que no choque con el botón */}
                  <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">{evt.name}</h3>
                  <div className="flex flex-col gap-2 text-sm text-slate-400">
                    <span className="flex items-center gap-2"><MapPin size={16} className="text-emerald-500"/> {evt.location}</span>
                    <span className="flex items-center gap-2"><Clock size={16} className="text-emerald-500"/> {format(new Date(evt.event_date), "MMMM d, yyyy - h:mm a")}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* --- BOTÓN DE ELIMINAR --- */}
                  <button 
                    onClick={(e) => handleDelete(e, evt.id)}
                    className="p-3 bg-slate-900 text-slate-500 hover:text-red-400 hover:border-red-400/50 border border-slate-700 rounded-2xl transition-all"
                  >
                    <Trash2 size={20} />
                  </button>

                  <div className="bg-slate-900 p-4 rounded-2xl text-slate-500 group-hover:text-emerald-400 border border-slate-700 transition-all">
                    <ChevronRight size={24} />
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full py-20 bg-slate-800/20 border-2 border-dashed border-slate-800 rounded-3xl text-center">
             <CalendarIcon size={48} className="mx-auto text-slate-700 mb-4" />
             <p className="text-slate-500 text-lg">No events scheduled yet.</p>
             <Link to="/create-event" className="text-emerald-400 hover:underline mt-2 inline-block">Create your first gig here</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventList;