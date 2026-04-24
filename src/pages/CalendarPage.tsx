import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '../components/Common';
import { AddEventModal } from '../components/modals/AddEventModal';
import { supabase } from '../lib/supabase';

interface CalEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  color: string;
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export const CalendarPage = () => {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [clickedDate, setClickedDate] = useState<string | undefined>(undefined);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const start = new Date(year, month, 1).toISOString();
    const end   = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    const { data } = await supabase
      .from('calendar_events')
      .select('id, title, start_time, end_time, color')
      .gte('start_time', start)
      .lte('start_time', end)
      .order('start_time', { ascending: true });
    if (data) setEvents(data);
    setLoading(false);
  }, [year, month]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const eventsForDay = (day: number) =>
    events.filter(e => {
      const d = new Date(e.start_time);
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const upcomingEvents = [...events]
    .filter(e => new Date(e.start_time) >= new Date())
    .slice(0, 5);

  return (
    <>
      {showAddEvent && (
        <AddEventModal
          onClose={() => setShowAddEvent(false)}
          onSuccess={() => { setShowAddEvent(false); fetchEvents(); }}
          defaultDate={clickedDate}
        />
      )}

      <div className="flex-1 overflow-y-auto px-8 pb-8 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="text-[32px] font-extrabold text-text-main tracking-tight leading-tight">Calendar</div>
            <div className="text-[14px] text-text-3 mt-1 font-medium">
              {MONTH_NAMES[month]} {year} {isCurrentMonth ? `· Today is ${MONTH_NAMES[month]} ${today.getDate()}` : ''}
            </div>
          </div>
          <div className="flex gap-3 items-center">
            {/* Month nav */}
            <div className="flex items-center gap-1 bg-white border border-border-light rounded-xl shadow-sm overflow-hidden">
              <button onClick={prevMonth} className="px-3 py-3 hover:bg-gray-50 text-text-3 hover:text-brand transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span className="px-3 text-[14px] font-bold text-text-main">{MONTH_NAMES[month].slice(0,3)} {year}</span>
              <button onClick={nextMonth} className="px-3 py-3 hover:bg-gray-50 text-text-3 hover:text-brand transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
            <button
              onClick={() => { setClickedDate(undefined); setShowAddEvent(true); }}
              className="bg-brand hover:bg-brand-dark text-white rounded-xl px-5 py-3 text-[14px] font-bold flex items-center gap-2 transition-all shadow-[0_8px_20px_rgba(92,79,229,0.25)] hover:-translate-y-0.5"
            >
              <Icon name="plus" size={16} /> Add Event
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6 flex-1">
          {/* Calendar grid */}
          <div className="col-span-3 bg-white rounded-3xl p-7 shadow-sm border border-border-light/50">
            <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-2xl overflow-hidden border border-gray-100">
              {/* Weekday headers */}
              {WEEKDAYS.map(d => (
                <div key={d} className="bg-white py-4 text-center text-[12px] font-bold text-text-3 uppercase tracking-wider">{d}</div>
              ))}

              {/* Empty cells before the 1st */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-white p-4 h-[110px] opacity-20" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const dayEvents = eventsForDay(day);
                const isToday = isCurrentMonth && day === today.getDate();
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                return (
                  <div
                    key={day}
                    onClick={() => { setClickedDate(dateStr); setShowAddEvent(true); }}
                    className={`bg-white p-3 h-[110px] transition-colors hover:bg-gray-50 group cursor-pointer ${isToday ? 'bg-brand/5' : ''}`}
                  >
                    <div className={`text-[13px] font-bold mb-1.5 flex items-center justify-center w-7 h-7 rounded-full ${isToday ? 'bg-brand text-white' : 'text-text-main group-hover:text-brand'}`}>
                      {day}
                    </div>
                    <div className="space-y-1 overflow-hidden">
                      {dayEvents.slice(0, 2).map(e => (
                        <div
                          key={e.id}
                          className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded-md truncate"
                          style={{ backgroundColor: e.color }}
                          title={`${e.title} · ${formatTime(e.start_time)}`}
                        >
                          {e.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[10px] font-bold text-text-3">+{dayEvents.length - 2} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {loading && (
              <div className="text-center text-text-3 text-[13px] font-medium mt-4 animate-pulse">Loading events…</div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming events */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-border-light/50">
              <div className="font-bold text-[16px] text-text-main mb-5">Upcoming Events</div>
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-4">
                  <div className="text-[13px] font-bold text-text-3">No upcoming events</div>
                  <button
                    onClick={() => setShowAddEvent(true)}
                    className="mt-2 text-[12px] font-bold text-brand hover:underline"
                  >
                    + Add one
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingEvents.map(e => (
                    <div key={e.id} className="flex gap-3">
                      <div className="w-1.5 flex-shrink-0 rounded-full mt-1" style={{ backgroundColor: e.color, minHeight: '40px' }} />
                      <div>
                        <div className="text-[14px] font-bold text-text-main leading-tight">{e.title}</div>
                        <div className="text-[12px] text-text-3 font-medium mt-0.5">
                          {new Date(e.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {formatTime(e.start_time)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>


          </div>
        </div>
      </div>
    </>
  );
};
