import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar as CalendarIcon, Plus, MapPin, Clock, Music, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, isAfter } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz'; // ✅ Importamos para manejar la zona horaria
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const TIMEZONE = "America/Vancouver"; // ✅ Definimos la zona de Surrey/Vancouver
  
  // ✅ Inicializamos currentMonth y today en la zona de Vancouver
  const [currentMonth, setCurrentMonth] = useState(toZonedTime(new Date(), TIMEZONE));
  const [loading, setLoading] = useState(true);
  const today = toZonedTime(new Date(), TIMEZONE); 

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await axios.get('/api/events');
      const allEvents = Array.isArray(res.data) ? res.data : [];
      
      // ✅ Convertimos cada fecha de la DB a la zona de Vancouver antes de comparar
      const upcoming = allEvents.filter(e => {
        const eventDate = toZonedTime(new Date(e.event_date), TIMEZONE);
        return isAfter(eventDate, today);
      });

      setEvents(upcoming.sort((a, b) => new Date(a.event_date) - new Date(b.event_date)));
      setLoading(false);
    } catch (err) {
      console.error("Error fetching events:", err);
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <div className="flex justify-between items-center mb-4 px-2">
      <h3 className="text-lg font-bold text-white uppercase tracking-widest">
        {/* ✅ Mes y año forzados a Vancouver */}
        {format(toZonedTime(currentMonth, TIMEZONE), "MMMM yyyy", { locale: enUS })}
      </h3>
      <div className="flex gap-2">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-slate-700 rounded text-slate-400 transition-colors">
          <ChevronLeft size={20}/>
        </button>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-slate-700 rounded text-slate-400 transition-colors">
          <ChevronRight size={20}/>
        </button>
      </div>
    </div>
  );

  const renderDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        // ✅ Comparación de días usando la zona horaria correcta
        const hasEvent = events.some(e => isSameDay(toZonedTime(new Date(e.event_date), TIMEZONE), cloneDay));
        const isTodayDay = isSameDay(day, today);

        days.push(
          <div key={format(day, 'yyyy-MM-dd')} className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all relative
            ${!isSameMonth(day, monthStart) ? "text-slate-700" : "text-slate-300"}
            ${hasEvent ? "bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30" : "hover:bg-slate-700"}
            ${isTodayDay ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-800" : ""} 
          `}>
            {format(day, "d")}
            {hasEvent && <span className="absolute bottom-1 w-1 h-1 bg-emerald-400 rounded-full"></span>}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(<div className="grid grid-cols-7 gap-1" key={`row-${day}`}>{days}</div>);
      days = [];
    }
    return <div className="space-y-1">{rows}</div>;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-400 to-emerald-500">Dashboard</h1>
          <p className="text-slate-400 mt-1 italic text-lg font-medium">Welcome again Martin</p>
        </div>
        <Link to="/create-event" className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 transition-all font-bold text-xs tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95">
          <Plus size={18} /> NEW EVENT
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Music size={20} className="text-emerald-400" />
            </div>
            Next Events
          </h2>
          
          {loading ? (
             <div className="space-y-4">
               {[1, 2].map(i => <div key={i} className="h-24 bg-slate-800/40 rounded-2xl animate-pulse border border-slate-700"></div>)}
             </div>
          ) : events.length === 0 ? (
            <div className="bg-slate-800/20 border border-dashed border-slate-700 rounded-3xl p-20 text-center">
              <CalendarIcon size={40} className="mx-auto text-slate-700 mb-4" />
              <p className="text-slate-500 italic">No future gigs scheduled.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map(evt => (
                <Link to={`/event/${evt.id}`} key={`event-card-${evt.id}`} className="block group">
                  <div className="bg-slate-800/40 border border-slate-700 p-6 rounded-3xl flex justify-between items-center hover:border-emerald-500/50 hover:bg-slate-800/60 transition-all">
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">{evt.name}</h3>
                      <div className="flex gap-5 text-sm text-slate-400">
                        <span className="flex items-center gap-2"><MapPin size={16} className="text-emerald-500/50"/> {evt.location}</span>
                        {/* ✅ Formateo de hora forzado a Vancouver */}
                        <span className="flex items-center gap-2">
                          <Clock size={16} className="text-emerald-500/50"/> 
                          {format(toZonedTime(new Date(evt.event_date), TIMEZONE), "MMM d, h:mm a")}
                        </span>
                      </div>
                    </div>
                    <div className="text-emerald-400 bg-slate-900 p-3 rounded-2xl border border-slate-700">
                      <Music size={22} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Calendario Side */}
        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-[2rem] p-8 h-fit shadow-2xl sticky top-24">
          {renderHeader()}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-500 mb-6 uppercase tracking-[0.2em]">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <div key={`header-${index}`}>{day}</div>
            ))}
          </div>
          {renderDays()}
          <div className="mt-8 pt-6 border-t border-slate-700/50 flex flex-col gap-3">
            <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Today (BC Time)
            </div>
            <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              Performance
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;