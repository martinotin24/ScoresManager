import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Trash2, Edit3, MapPin, Clock, Calendar, ArrowLeft, ArrowRight, Plus, PlayCircle, X, ListPlus, Music, FileText, Shuffle, Video, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- FUNCIONES AUXILIARES FUERA DEL COMPONENTE ---
const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const SERVER_URL = ""; 

  // --- ESTADOS ---
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null); 
  const [isShuffle, setIsShuffle] = useState(false); 
  const [shuffleQueue, setShuffleQueue] = useState([]); 
  
  const [event, setEvent] = useState({ name: '', location: '', event_date: '' });
  const [setlist, setSetlist] = useState([]);
  const [repertoire, setRepertoire] = useState([]);

  // --- FORMATEADORES ---
  const formatTime = (seconds) => {
    if (!seconds || seconds === 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateExactTotalTime = () => {
    const totalSeconds = setlist.reduce((acc, song) => {
      const duration = parseInt(song.duration_seconds, 10) || 0;
      return acc + duration;
    }, 0);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- GENERACIÓN DE PDF PROFESIONAL ---
  const generateProfessionalPDF = () => {
    try {
      const doc = new jsPDF();
      const margin = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const img = new Image();
      img.src = '/favicon.ico'; 

      const createPDFContent = (logo = null) => {
        if (logo) doc.addImage(logo, 'PNG', margin, 15, 10, 10);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);
        doc.text("MARTIN VIOLINIST", logo ? margin + 12 : margin, 23);

        doc.setDrawColor(16, 185, 129);
        doc.setLineWidth(0.5);
        doc.line(margin, 30, pageWidth - margin, 30);

        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text((event?.name || "SETLIST").toUpperCase(), margin, 45);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text(`Location: ${event?.location}`, margin, 52);
        doc.text(`Date: ${event?.event_date.replace('T', ' ')}`, margin, 57);

        doc.setFont("helvetica", "bold");
        doc.text(`Total Pieces: ${setlist.length}`, 140, 52);
        doc.text(`Duration: ${calculateExactTotalTime()}`, 140, 57);

        const tableRows = setlist.map((song, index) => [
          index + 1,
          song.title,
          song.composer,
          formatTime(song.duration_seconds)
        ]);

        autoTable(doc, {
          startY: 65,
          head: [['#', 'Song Title', 'Composer', 'Length']],
          body: tableRows,
          theme: 'striped',
          headStyles: { fillColor: [40, 40, 40], halign: 'center' },
          columnStyles: { 0: { cellWidth: 10, halign: 'center' }, 3: { cellWidth: 25, halign: 'center' } },
          margin: { left: margin, right: margin }
        });

        const finalY = doc.lastAutoTable.finalY + 15;
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.text("Martin Violinist - All pieces are violin cover versions", pageWidth / 2, finalY, { align: 'center' });

        doc.save(`Setlist_${event.name.replace(/\s+/g, '_')}.pdf`);
      };

      img.onload = () => createPDFContent(img);
      img.onerror = () => createPDFContent(null);

    } catch (error) {
      console.error("Error en PDF:", error);
      alert("Could not generate PDF. Please try again.");
    }
  };

  // --- LÓGICA DE REPRODUCCIÓN (CON PARADA AUTOMÁTICA) ---
  const toggleShuffle = () => {
    const newState = !isShuffle;
    setIsShuffle(newState);
    if (newState && setlist.length > 0) {
      const newQueue = shuffleArray(setlist);
      setShuffleQueue(newQueue);
      setSelectedSong(newQueue[0]);
    }
  };

  const handleNextSong = () => {
    if (setlist.length === 0) return;

    if (isShuffle) {
      const currentIdx = shuffleQueue.findIndex(s => s.id === selectedSong?.id);
      
      // Si hay una siguiente en la cola aleatoria, avanzamos
      if (currentIdx !== -1 && currentIdx < shuffleQueue.length - 1) {
        setSelectedSong(shuffleQueue[currentIdx + 1]);
      } 
      // Si es la última, cerramos el reproductor y apagamos shuffle
      else {
        setSelectedSong(null);
        setIsShuffle(false);
        console.log("Repertorio aleatorio completado. Parada automática.");
      }
    } else {
      // Modo Normal: Sigue el orden de la lista
      const currentIndex = setlist.findIndex(s => s.id === selectedSong?.id);
      if (currentIndex !== -1 && currentIndex < setlist.length - 1) {
        setSelectedSong(setlist[currentIndex + 1]);
      } else {
        // Al llegar al final de la lista normal, también cerramos
        setSelectedSong(null);
      }
    }
  };

  const handlePrevSong = () => {
    if (!selectedSong || setlist.length === 0) return;
    if (isShuffle) {
      const currentIdx = shuffleQueue.findIndex(s => s.id === selectedSong.id);
      if (currentIdx > 0) setSelectedSong(shuffleQueue[currentIdx - 1]);
    } else {
      const currentIndex = setlist.findIndex(s => s.id === selectedSong.id);
      if (currentIndex > 0) setSelectedSong(setlist[currentIndex - 1]);
    }
  };

  // --- LLAMADAS A API ---
  const fetchEventData = useCallback(async () => {
    try {
      setLoading(true);
      const eventRes = await axios.get('/api/events');
      const allEvents = Array.isArray(eventRes.data) ? eventRes.data : [];
      const currentEvent = allEvents.find(e => e.id === parseInt(id));
      
      if (currentEvent) {
        const dateFromDB = currentEvent.event_date; 
        const formattedForInput = dateFromDB.replace(' ', 'T').substring(0, 16);
        setEvent({ ...currentEvent, event_date: formattedForInput });
      }
      
      const setlistRes = await axios.get(`/api/events/${id}/songs`);
      setSetlist(Array.isArray(setlistRes.data) ? setlistRes.data : []);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchEventData(); }, [fetchEventData]);

  const handleUpdate = async () => {
    try {
      const formattedForDB = event.event_date.replace('T', ' ') + ':00';
      await axios.put(`/api/events/${id}`, { ...event, event_date: formattedForDB });
      setIsEditing(false);
      fetchEventData();
      alert("Gig updated successfully!");
    } catch (err) { alert("Error updating gig"); }
  };

  const removeFromSetlist = async (e, songId) => {
    e.stopPropagation(); 
    if (!window.confirm("Remove piece from setlist?")) return;
    try {
      await axios.delete(`/api/events/${id}/songs/${songId}`);
      fetchEventData();
    } catch (err) { alert("Error removing song"); }
  };

  const addToSetlist = async (songId) => {
    try {
      await axios.post('/api/event-songs', { event_id: id, song_id: songId, order_index: setlist.length + 1 });
      fetchEventData();
      setIsModalOpen(false); 
    } catch (err) { alert("Error adding song"); }
  };

  const openModal = async () => {
    try {
      const res = await axios.get('/api/songs');
      setRepertoire(res.data);
      setIsModalOpen(true);
    } catch (err) { alert("Error loading repertoire"); }
  };

  const handleDeleteEvent = async () => {
    if (window.confirm("Delete this gig?")) {
      try {
        await axios.delete(`/api/events/${id}`);
        navigate('/gigs');
      } catch (err) { alert("Delete failed"); }
    }
  };

  if (loading) return (
    <div className="p-10 text-center text-slate-500 font-mono italic flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      Loading gig details...
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen text-white font-sans">
      
      {/* Botones de Navegación y PDF */}
      <div className="flex justify-between items-center mb-8">
        <Link to="/gigs" className="text-slate-400 hover:text-white flex items-center gap-2 group transition-all text-sm">
          <ArrowLeft size={20} className="group-hover:-translate-x-1" /> Back to Gigs
        </Link>
        <button 
          onClick={generateProfessionalPDF}
          className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-5 py-2 rounded-2xl flex items-center gap-2 hover:bg-emerald-500 hover:text-white transition-all text-xs font-bold shadow-lg"
        >
          <FileDown size={18} /> DOWNLOAD PDF FOR CLIENT
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna Izquierda: Información del Evento */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8 shadow-2xl sticky top-24">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2 text-emerald-400">
                <Calendar size={22} /> {isEditing ? "Edit Gig" : "Gig Details"}
              </h2>
              <button onClick={() => setIsEditing(!isEditing)} className="text-slate-400 hover:text-emerald-400 transition-colors">
                {isEditing ? <X size={22} /> : <Edit3 size={22} />}
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <input className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none" value={event.name} onChange={e => setEvent({...event, name: e.target.value})} />
                <input className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none" value={event.location} onChange={e => setEvent({...event, location: e.target.value})} />
                <input type="datetime-local" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none" value={event.event_date} onChange={e => setEvent({...event, event_date: e.target.value})} />
                <button onClick={handleUpdate} className="w-full bg-emerald-500 py-3 rounded-xl font-bold mt-2">SAVE CHANGES</button>
                <button onClick={handleDeleteEvent} className="w-full bg-red-500/20 text-red-500 border border-red-500/30 py-2 rounded-xl text-xs font-bold mt-4 hover:bg-red-500 transition-all">DELETE GIG</button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold mb-4">{event?.name}</h1>
                  <div className="space-y-3 text-slate-400 text-sm">
                    <p className="flex items-center gap-3"><MapPin size={18} className="text-emerald-500"/> {event?.location}</p>
                    <p className="flex items-center gap-3"><Clock size={18} className="text-emerald-500"/> {event.event_date.replace('T', ' ')}</p>
                  </div>
                </div>
                <button onClick={openModal} className="w-full bg-emerald-500 hover:bg-emerald-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg">
                  <Plus size={22} /> ADD TO SETLIST
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: El Setlist */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-end mb-6">
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <PlayCircle className="text-emerald-400" /> Current Setlist
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsShuffle(false)}
                  className={`flex items-center gap-2 text-[10px] px-4 py-1.5 rounded-full border transition-all font-bold uppercase ${!isShuffle ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                >
                  <PlayCircle size={14} /> Play In Order
                </button>
                <button 
                  onClick={toggleShuffle}
                  className={`flex items-center gap-2 text-[10px] px-4 py-1.5 rounded-full border transition-all font-bold uppercase ${isShuffle ? 'bg-blue-500 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                >
                  <Shuffle size={14} /> Shuffle Mode
                </button>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Set Duration</span>
              <span className="text-xl font-mono font-bold text-emerald-400">{calculateExactTotalTime()}</span>
            </div>
          </div>

          <div className="space-y-3 pb-24">
            {setlist.length === 0 && <p className="text-slate-600 italic text-center py-10">Add songs from the library to start.</p>}
            {setlist.map((song, idx) => (
              <div key={`${song.id}-${idx}`} onClick={() => setSelectedSong(song)} className="cursor-pointer bg-slate-800/40 border border-slate-700 p-5 rounded-2xl flex justify-between items-center group hover:border-emerald-500/60 transition-all shadow-sm">
                <div className="flex items-center gap-5">
                  <span className="text-slate-600 font-mono text-xl font-black w-6">{idx + 1}</span>
                  <div>
                    <h3 className="text-white font-bold text-lg group-hover:text-emerald-400">{song.title}</h3>
                    <p className="text-xs text-slate-500 italic uppercase font-bold">{song.composer}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-slate-400">{formatTime(song.duration_seconds)}</span>
                  <button onClick={(e) => removeFromSetlist(e, song.id)} className="p-2 text-slate-500 hover:text-red-500 transition-all focus:outline-none"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reproductor / Visor (Full Screen Modal) */}
      {selectedSong && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 p-4 animate-in fade-in">
          <button onClick={handlePrevSong} className="absolute left-6 z-[120] p-5 text-white/40 hover:text-white hidden lg:block focus:outline-none"><ArrowLeft size={48} /></button>
          
          <div className="bg-slate-900 border border-slate-700 w-full max-w-7xl h-[90vh] rounded-3xl overflow-hidden flex flex-col relative shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-800/80">
              <div>
                <h2 className="text-2xl font-bold text-emerald-400">{selectedSong.title}</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{isShuffle ? '🔀 Shuffle Active' : '📋 Sequential'}</p>
              </div>
              <button onClick={() => setSelectedSong(null)} className="p-3 text-slate-400 hover:text-red-500 transition-all focus:outline-none"><X size={32} /></button>
            </div>
            
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-950">
              <div className={`flex-1 flex items-center justify-center bg-black h-full ${selectedSong.audio_filename ? 'md:w-[70%]' : 'w-full'}`}>
                {selectedSong.video_filename ? (
                  <video 
                    controls 
                    playsInline 
                    autoPlay 
                    muted 
                    onEnded={handleNextSong} // ✅ Salta a la siguiente al terminar
                    key={`v-gig-${selectedSong.id}`} 
                    className="w-full h-full object-contain"
                  >
                    <source src={`/uploads/${selectedSong.video_filename}`} type="video/mp4" />
                  </video>
                ) : selectedSong.pdf_filename ? (
                  <embed src={`/uploads/${selectedSong.pdf_filename}#toolbar=0`} type="application/pdf" width="100%" height="100%" className="bg-white" />
                ) : <div className="text-slate-800"><Music size={80} /></div>}
              </div>
              
              {selectedSong.audio_filename && (
                <div className="md:w-[30%] border-l border-slate-800 p-8 flex flex-col justify-center items-center bg-slate-900/40">
                  <Music className="text-blue-400 animate-pulse mb-8" size={60} />
                  <audio 
                    controls 
                    autoPlay 
                    onEnded={handleNextSong} // ✅ Salta a la siguiente al terminar
                    key={`audio-nav-${selectedSong.id}`} 
                    className="w-full"
                  >
                    <source src={`/uploads/${selectedSong.audio_filename}`} type="audio/mpeg" />
                  </audio>
                  <p className="mt-4 text-[10px] text-slate-500 text-center uppercase font-bold italic">Playing Backing Track</p>
                </div>
              )}
            </div>
          </div>

          <button onClick={handleNextSong} className="absolute right-6 z-[120] p-5 text-white/40 hover:text-white hidden lg:block focus:outline-none"><ArrowRight size={48} /></button>
        </div>
      )}

      {/* Modal de Biblioteca */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl max-h-[80vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2"><ListPlus className="text-emerald-400" /> Repertoire Library</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-2 flex-1 scrollbar-hide">
              {repertoire.map(song => {
                const added = setlist.some(item => item.id === song.id);
                return (
                  <div key={song.id} className={`flex items-center justify-between p-4 border rounded-2xl transition-all ${added ? 'opacity-30 border-slate-800' : 'bg-slate-900/50 border-slate-700'}`}>
                    <div>
                      <p className="font-bold text-white">{song.title}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{song.composer}</p>
                    </div>
                    {added ? (
                      <span className="text-[10px] font-bold text-slate-600 px-3 py-1 bg-slate-800 rounded-full uppercase">In Setlist</span>
                    ) : (
                      <button onClick={() => addToSetlist(song.id)} className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl transition-all shadow-md">
                        <Plus size={20} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails;