"use client";
import React, { useState, useEffect } from 'react';
import BulkWasteUpload from '../../../../src/components/BulkWasteUpload';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function OrgBulkUploadPage() {
  const { data: session, status } = useSession();
  const [wasteName, setWasteName] = useState("");
  const [date, setDate] = useState("");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingEvents, setFetchingEvents] = useState(true);
  const [message, setMessage] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [generatingDate, setGeneratingDate] = useState(false);
  const [isDateGenerated, setIsDateGenerated] = useState(false);
  const [wasteImage, setWasteImage] = useState(null);
  const router = useRouter();

  const fetchEvents = async () => {
    if (status !== 'authenticated' || !session?.user?.email) return;
    setFetchingEvents(true);
    try {
      const response = await fetch(`/api/markDate?email=${encodeURIComponent(session.user.email)}`);
      const text = await response.text();
      let data = null;
      if (text) {
        try { data = JSON.parse(text); } catch (e) { console.error('Non-JSON response from /api/markDate:', text); throw new Error(text || 'Failed to fetch events'); }
      }
      if (!response.ok) throw new Error(data?.error || text || 'Failed to fetch events');
      setEvents(data?.events || []);
    } catch (err) {
      console.error(err);
      setMessage('Failed to load events.');
    } finally {
      setFetchingEvents(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchEvents();
      const today = new Date();
      setDate(formatDateForInput(today));
      setSelectedDate(today);
    }
  }, [status, session]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
  }, [status, router]);

  const formatDateForInput = (d) => {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  };

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) setWasteImage(e.target.files[0]);
  };

  const handleGenerateDate = async () => {
    if (!wasteName && !wasteImage) { setMessage('Please enter a waste name or upload an image.'); return; }
    setGeneratingDate(true); setMessage('');
    try {
      const formData = new FormData();
      if (wasteName) formData.append('wasteName', wasteName);
      if (wasteImage) formData.append('wasteImage', wasteImage);
      const res = await fetch('/api/generateDate', { method: 'POST', body: formData });
      let data;
      try { data = await res.json(); } catch (e) { const t = await res.text(); console.error('Non-JSON response from /api/generateDate:', t); throw new Error(t || 'Failed to generate date'); }
      if (!res.ok) throw new Error(data?.error || 'Failed to generate date');
      if (data.disposalDate) {
        setDate(data.disposalDate);
        const dObj = new Date(data.disposalDate);
        setSelectedDate(dObj);
        setCurrentMonth(new Date(dObj.getFullYear(), dObj.getMonth(), 1));
        setIsDateGenerated(true);
        setMessage('Disposal date generated!');
      }
    } catch (err) {
      console.error(err);
      setMessage('Failed to generate date.');
    } finally { setGeneratingDate(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!wasteName || !date) { setMessage('Please provide both a waste name and date.'); return; }
    setLoading(true); setMessage('');
    try {
      const res = await fetch('/api/markDate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: wasteName, date, email: session.user.email }) });
      if (!res.ok) throw new Error('Failed to add event');
      setWasteName(''); setWasteImage(null); setDate(formatDateForInput(new Date())); setIsDateGenerated(false);
      fetchEvents(); setMessage('Disposal event added successfully!');
    } catch (err) { console.error(err); setMessage('Failed to add event.'); } finally { setLoading(false); }
  };

  const handleDeleteEvent = async (id) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      const res = await fetch('/api/markDate', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, email: session.user.email }) });
      if (!res.ok) throw new Error('Failed');
      fetchEvents(); setMessage('Event deleted successfully!');
    } catch (err) { console.error(err); setMessage('Failed to delete event.'); }
  };

  const groupEventsByDate = () => {
    const grouped = {};
    events.forEach(ev => {
      const key = new Date(ev.date).toISOString().split('T')[0];
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(ev);
    });
    return grouped;
  };

  const renderCalendar = () => {
    const eventsByDate = groupEventsByDate();
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const monthName = currentMonth.toLocaleString('default', { month: 'long' });
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysOfWeek = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const rows = [];
    let cells = [];
    for (let i=0;i<firstDay;i++) cells.push(<td key={`empty-${i}`} className="p-2 border border-gray-700 bg-gray-900"></td>);
    for (let day=1; day<=daysInMonth; day++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
      const isSelected = selectedDate?.toDateString() === new Date(year, month, day).toDateString();
      const dayEvents = eventsByDate[dateStr] || [];
      cells.push(
        <td key={day} className="p-0 border border-gray-700">
          <div className={`h-24 p-1 cursor-pointer transition-colors ${isToday ? 'bg-gray-700' : 'bg-gray-800'} ${isSelected ? 'ring-2 ring-emerald-500 z-10' : ''} hover:bg-gray-600`} onClick={() => { const d = new Date(year, month, day); setSelectedDate(d); setDate(formatDateForInput(d)); }}>
            <div className={`text-right text-sm ${isToday ? 'text-emerald-400 font-bold' : 'text-gray-400'}`}>{day}</div>
            <div className="mt-1 space-y-1">
              {dayEvents.slice(0,2).map(ev => (<div key={ev.id} className="text-[10px] bg-emerald-600 text-white p-0.5 rounded truncate">{ev.title}</div>))}
              {dayEvents.length>2 && <div className="text-[10px] text-gray-500">+{dayEvents.length-2} more</div>}
            </div>
          </div>
        </td>
      );
      if ((cells.length)%7===0 || day===daysInMonth) {
        while (cells.length<7 && day===daysInMonth) cells.push(<td key={`empty-end-${cells.length}`} className="p-2 border border-gray-700 bg-gray-900"></td>);
        rows.push(<tr key={day}>{cells}</tr>);
        cells = [];
      }
    }
    return (
      <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">{monthName} {year}</h2>
          <div className="flex space-x-2">
            <button onClick={() => setCurrentMonth(new Date(year, month-1, 1))} className="p-2 bg-gray-700 rounded hover:bg-gray-600 text-white">←</button>
            <button onClick={() => setCurrentMonth(new Date())} className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 text-white">Today</button>
            <button onClick={() => setCurrentMonth(new Date(year, month+1, 1))} className="p-2 bg-gray-700 rounded hover:bg-gray-600 text-white">→</button>
          </div>
        </div>
        <table className="w-full border-collapse">
          <thead><tr>{daysOfWeek.map(d => <th key={d} className="p-2 text-gray-400 text-xs font-medium">{d}</th>)}</tr></thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
    );
  };

  const selectedDateEvents = selectedDate ? groupEventsByDate()[formatDateForInput(selectedDate)] || [] : [];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center cursor-pointer" onClick={() => router.push('/') }>
            <span className="text-emerald-500 font-bold text-2xl mr-2">EcoClassify</span>
            <span className="hidden md:inline bg-emerald-900/50 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-800">INSTITUTIONAL</span>
          </div>
          {session && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400 hidden sm:inline">Welcome, <span className="text-emerald-400">{session.user?.name}</span></span>
              <button onClick={() => signOut({ callbackUrl: '/' })} className="px-4 py-2 bg-red-900/20 text-red-400 border border-red-900/50 rounded-lg text-sm hover:bg-red-900/40 transition-colors">Sign Out</button>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4">Organization Bulk CSV Upload</h2>
              <BulkWasteUpload onProcessed={fetchEvents} />
            </div>

            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">Quick Disposal Setup</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Waste Item Name</label>
                  <div className="flex space-x-2">
                    <input type="text" value={wasteName} onChange={(e) => setWasteName(e.target.value)} className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g. Bulk Office Paper" />
                    <button type="button" onClick={handleGenerateDate} disabled={generatingDate || (!wasteName && !wasteImage)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-500 disabled:opacity-50 transition-colors text-sm font-medium">{generatingDate ? '...' : 'AI Date'}</button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Or Upload Photo</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-700 rounded-xl cursor-pointer bg-gray-900 hover:bg-gray-800 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                      <p className="text-xs text-gray-500">{wasteImage ? wasteImage.name : 'Click to identify waste'}</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                </div>

                {isDateGenerated && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Proposed Date</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none" />
                    <button type="submit" disabled={loading} className="w-full mt-4 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20">{loading ? 'Scheduling...' : 'Confirm Schedule'}</button>
                  </div>
                )}
              </form>
              {message && <div className={`mt-4 p-3 rounded-lg text-sm ${message.includes('success') ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>{message}</div>}
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            {renderCalendar()}

            {selectedDate && (
              <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white">Schedule for {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</h3>
                  <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-400">{selectedDateEvents.length} Tasks</span>
                </div>
                <div className="space-y-3">
                  {selectedDateEvents.length > 0 ? (
                    selectedDateEvents.map(ev => (
                      <div key={ev.id} className="flex items-center justify-between p-4 bg-gray-900 rounded-xl border border-gray-800 hover:border-gray-600 transition-colors">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 mr-4 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                          <span className="font-medium">{ev.title}</span>
                        </div>
                        <button onClick={() => handleDeleteEvent(ev.id)} className="text-gray-500 hover:text-red-400 transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 italic text-sm">No disposal tasks scheduled for this day</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
