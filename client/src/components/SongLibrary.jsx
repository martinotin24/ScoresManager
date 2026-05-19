import { Buffer } from 'buffer';
window.Buffer = Buffer; 

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Music, FileText, Video, Trash2, X, Search, Clock, Download } from 'lucide-react';

const SongLibrary = () => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileType, setFileType] = useState(null); 
  const [wantAudio, setWantAudio] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSong, setSelectedSong] = useState(null);
  const [formData, setFormData] = useState({ 
    title: '', composer: '', pdf: null, audio: null, video: null, duration_seconds: 0 
  });

  const SERVER_URL = ""; 

  const formatTime = (seconds) => {
    if (!seconds || seconds === 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => { fetchSongs(); }, []);

  const fetchSongs = async () => {
    try {
      const res = await axios.get('/api/songs');
      setSongs(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error("Error fetching library:", err); }
  };

  const handleDownload = (song) => {
    const files = [
      { name: song.pdf_filename, ext: 'pdf' },
      { name: song.audio_filename, ext: 'mp3' },
      { name: song.video_filename, ext: 'mp4' }
    ];
    files.forEach(file => {
      if (file.name) {
        const link = document.createElement('a');
        link.href = `${SERVER_URL}/uploads/${file.name}`;
        link.setAttribute('download', `${song.title}_${song.composer}.${file.ext}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setFormData(prev => ({ ...prev, [type]: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let finalDuration = 0;

    // LÓGICA DE EXTRACCIÓN DE TIEMPO REFORZADA
    if (formData.audio || formData.video) {
      const fileToMeasure = formData.audio || formData.video;
      const mediaType = formData.audio ? 'audio' : 'video';
      
      const el = document.createElement(mediaType);
      el.preload = 'metadata';
      el.src = URL.createObjectURL(fileToMeasure);

      try {
        await new Promise((resolve) => {
          // Intento 1: loadedmetadata (rápido)
          el.onloadedmetadata = () => {
            if (el.duration && el.duration !== Infinity) {
              finalDuration = Math.round(el.duration);
              resolve();
            }
          };

          // Intento 2: Si el video es rebelde, esperamos un poco más
          el.onprogress = () => {
             if (el.duration && el.duration !== Infinity && finalDuration === 0) {
               finalDuration = Math.round(el.duration);
               resolve();
             }
          };

          // Timeout de seguridad: Si en 4 segundos no hay nada, seguimos con 0
          setTimeout(() => {
            if (finalDuration === 0 && el.duration && el.duration !== Infinity) {
              finalDuration = Math.round(el.duration);
            }
            resolve();
          }, 4000);
        });
      } catch (err) {
        console.error("Error detectando tiempo:", err);
      } finally {
        URL.revokeObjectURL(el.src);
      }
    }

    const data = new FormData();
    data.append('title', formData.title);
    data.append('composer', formData.composer);
    data.append('duration_seconds', finalDuration || 0);
    if (formData.pdf) data.append('pdf', formData.pdf);
    if (formData.audio) data.append('audio', formData.audio);
    if (formData.video) data.append('video', formData.video);

    try {
      await axios.post('/api/songs', data);
      alert(`¡Pieza guardada! Duración: ${formatTime(finalDuration)}`);
      resetForm();
      fetchSongs();
    } catch (err) { 
      alert("Error al subir archivo"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm("¿Eliminar esta pieza?")) {
      try {
        await axios.delete(`/api/songs/${id}`);
        fetchSongs();
      } catch (err) { alert("Error al eliminar"); }
    }
  };

  const resetForm = () => {
    setFormData({ title: '', composer: '', pdf: null, audio: null, video: null, duration_seconds: 0 });
    setFileType(null);
    setWantAudio(false);
  };

  const closeModal = () => setSelectedSong(null);

  return (
    <div className="p-6 max-w-6xl mx-auto text-white font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Music className="text-emerald-400"/> Repertoire Library
        </h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
          <input className="bg-slate-800 border border-slate-700 rounded-full pl-10 pr-4 py-2 outline-none w-64 focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="Search piece..." onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl h-fit">
          <h2 className="text-xl font-bold mb-6 text-slate-300 italic">Add New Piece</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 outline-none" placeholder="Title" required onChange={e => setFormData({...formData, title: e.target.value})} value={formData.title} />
            <input className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 outline-none" placeholder="Composer" required onChange={e => setFormData({...formData, composer: e.target.value})} value={formData.composer} />
            
            {!fileType && (
              <div className="pt-4 grid grid-cols-3 gap-2">
                <button type="button" onClick={() => setFileType('pdf')} className="flex flex-col items-center p-4 bg-slate-900 rounded-2xl border border-slate-700 hover:border-red-500 transition-all group"><FileText className="text-red-400 mb-1 group-hover:scale-110"/><span className="text-[10px] font-bold">PDF</span></button>
                <button type="button" onClick={() => setFileType('audio')} className="flex flex-col items-center p-4 bg-slate-900 rounded-2xl border border-slate-700 hover:border-blue-500 transition-all group"><Music className="text-blue-400 mb-1 group-hover:scale-110"/><span className="text-[10px] font-bold">MP3</span></button>
                <button type="button" onClick={() => setFileType('video')} className="flex flex-col items-center p-4 bg-slate-900 rounded-2xl border border-slate-700 hover:border-purple-500 transition-all group"><Video className="text-purple-400 mb-1 group-hover:scale-110"/><span className="text-[10px] font-bold">MP4</span></button>
              </div>
            )}

            {fileType === 'pdf' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex justify-between items-center">
                  <span className="text-xs truncate">{formData.pdf ? formData.pdf.name : 'Select PDF'}</span>
                  <input type="file" accept=".pdf" className="hidden" id="pdf-file" onChange={e => handleFileChange(e, 'pdf')}/>
                  <label htmlFor="pdf-file" className="bg-red-500 px-3 py-1 rounded-full text-[10px] font-bold cursor-pointer">BROWSE</label>
                </div>
                {formData.pdf && (
                  <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 text-center">
                    <p className="text-[10px] text-slate-400 mb-3 uppercase font-bold">Add audio?</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setWantAudio(true)} className={`flex-1 py-2 rounded-lg text-[10px] font-black ${wantAudio ? 'bg-emerald-500 text-white' : 'bg-slate-700'}`}>YES</button>
                      <button type="button" onClick={() => {setWantAudio(false); setFormData({...formData, audio: null})}} className={`flex-1 py-2 rounded-lg text-[10px] font-black ${!wantAudio ? 'bg-slate-600' : 'bg-slate-700'}`}>NO</button>
                    </div>
                  </div>
                )}
                {wantAudio && (
                  <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl flex justify-between items-center">
                    <span className="text-xs truncate">{formData.audio ? formData.audio.name : 'Select MP3'}</span>
                    <input type="file" accept=".mp3" className="hidden" id="audio-file" onChange={e => handleFileChange(e, 'audio')}/>
                    <label htmlFor="audio-file" className="bg-blue-500 px-3 py-1 rounded-full text-[10px] font-bold cursor-pointer">BROWSE</label>
                  </div>
                )}
              </div>
            )}

            {(fileType === 'audio' || fileType === 'video') && (
              <div className="bg-slate-900 border border-slate-700 p-4 rounded-2xl flex justify-between items-center animate-in zoom-in-95">
                <span className="text-xs truncate">{formData[fileType] ? formData[fileType].name : `Select ${fileType}`}</span>
                <input type="file" accept={fileType === 'audio' ? '.mp3' : '.mp4'} className="hidden" id="gen-file" onChange={e => handleFileChange(e, fileType)}/>
                <label htmlFor="gen-file" className="bg-emerald-500 px-4 py-2 rounded-xl text-[10px] font-bold cursor-pointer uppercase">Choose</label>
              </div>
            )}

            {fileType && (
              <div className="flex gap-2 pt-4">
                <button type="submit" disabled={loading} className="flex-1 bg-emerald-500 py-3 rounded-xl font-bold shadow-lg active:scale-95 disabled:opacity-50">
                  {loading ? 'SAVING...' : 'SAVE PIECE'}
                </button>
                <button type="button" onClick={resetForm} className="bg-slate-700 p-3 rounded-xl"><X size={20} /></button>
              </div>
            )}
          </form>
        </div>

        <div className="lg:col-span-2 space-y-3 overflow-y-auto max-h-[75vh] pr-2">
          {songs.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase())).map((song) => (
            <div key={song.id} className="bg-slate-800/40 border border-slate-700 p-5 rounded-3xl flex justify-between items-center group hover:border-emerald-500 transition-all">
              <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => setSelectedSong(song)}>
                <div className="p-3 bg-slate-900 rounded-2xl border border-slate-700 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-900 transition-all"><Music size={24} /></div>
                <div>
                  <h3 className="font-bold text-white group-hover:text-emerald-400">{song.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-slate-500">{song.composer}</p>
                    <div className="flex gap-1.5 bg-slate-900/50 px-2 py-0.5 rounded-full border border-slate-700/50">
                      {song.pdf_filename && <FileText size={10} className="text-red-400" />}
                      {song.audio_filename && <Music size={10} className="text-blue-400" />}
                      {song.video_filename && <Video size={10} className="text-purple-400" />}
                    </div>
                    {song.duration_seconds > 0 && (
                      <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                        <Clock size={10} className="text-emerald-500/70" />
                        <span className="text-[10px] font-mono text-emerald-400/90 font-bold">{formatTime(song.duration_seconds)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); handleDownload(song); }} className="p-3 text-slate-400 hover:text-emerald-400 bg-slate-900/50 rounded-2xl transition-all border border-transparent hover:border-emerald-500/30">
                  <Download size={20} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(song.id); }} className="p-3 text-slate-400 hover:text-red-500 bg-slate-900/50 rounded-2xl transition-all">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedSong && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-7xl h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-800/80">
              <h2 className="text-2xl font-bold text-emerald-400">{selectedSong.title}</h2>
              <button onClick={closeModal} className="p-3 text-slate-400 hover:text-red-500 transition-all"><X size={32} /></button>
            </div>
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-950">
              <div className={`flex-1 h-full bg-black flex items-center justify-center ${selectedSong.pdf_filename && selectedSong.audio_filename ? 'md:w-[70%]' : 'w-full'}`}>
                {selectedSong.video_filename ? (
                  <video controls key={`v-${selectedSong.id}`} className="w-full h-full object-contain" playsInline muted autoPlay>
                    <source src={`${SERVER_URL}/uploads/${selectedSong.video_filename}`} type="video/mp4" />
                  </video>
                ) : selectedSong.pdf_filename ? (
                  <embed src={`${SERVER_URL}/uploads/${selectedSong.pdf_filename}#toolbar=0`} type="application/pdf" width="100%" height="100%" className="bg-white" />
                ) : <Music size={80} className="opacity-20" />}
              </div>
              {selectedSong.audio_filename && (
                <div className="md:w-[30%] border-l border-slate-800 p-8 flex flex-col justify-center items-center bg-slate-900/40">
                  <Music className="text-blue-400 mb-6 animate-pulse" size={60} />
                  <audio controls key={`a-${selectedSong.id}`} className="w-full shadow-lg">
                    <source src={`${SERVER_URL}/uploads/${selectedSong.audio_filename}`} type="audio/mpeg" />
                  </audio>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SongLibrary;