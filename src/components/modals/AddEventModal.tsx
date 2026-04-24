import React, { useState, useEffect } from 'react';
import { Modal, FormField, ModalActions, inputCls } from './Modal';
import { supabase } from '../../lib/supabase';

const COLOR_OPTIONS = [
  { label: 'Brand',   value: '#5C4FE5', cls: 'bg-brand' },
  { label: 'Green',   value: '#10B981', cls: 'bg-green-500' },
  { label: 'Red',     value: '#EF4444', cls: 'bg-red-500' },
  { label: 'Amber',   value: '#F59E0B', cls: 'bg-amber-500' },
  { label: 'Cyan',    value: '#06B6D4', cls: 'bg-cyan-500' },
  { label: 'Purple',  value: '#8B5CF6', cls: 'bg-purple-500' },
];

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  defaultDate?: string; // YYYY-MM-DD pre-fill
}

export const AddEventModal = ({ onClose, onSuccess, defaultDate }: Props) => {
  const today = defaultDate ?? new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [startTime, setStartTime] = useState('10:00');
  const [endDate, setEndDate] = useState(today);
  const [endTime, setEndTime] = useState('11:00');
  const [color, setColor] = useState(COLOR_OPTIONS[0].value);
  const [projectId, setProjectId] = useState('');
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase
      .from('projects')
      .select('id, name')
      .eq('status', 'Active')
      .then(({ data }) => { if (data) setProjects(data); });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) throw new Error('You must be logged in.');

      const startISO = new Date(`${startDate}T${startTime}:00`).toISOString();
      const endISO   = new Date(`${endDate}T${endTime}:00`).toISOString();

      if (new Date(endISO) <= new Date(startISO)) {
        throw new Error('End time must be after start time.');
      }

      const { error: insertErr } = await supabase.from('calendar_events').insert({
        title:       title.trim(),
        description: description.trim() || null,
        start_time:  startISO,
        end_time:    endISO,
        color,
        project_id:  projectId || null,
        created_by:  user.id,
      });
      if (insertErr) throw insertErr;

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create event.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Add Calendar Event" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-[13px] font-semibold rounded-2xl">
            {error}
          </div>
        )}

        <FormField label="Event Title *">
          <input
            required
            type="text"
            placeholder="e.g. Sprint Planning, Design Review..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            className={inputCls}
          />
        </FormField>

        <FormField label="Description">
          <textarea
            rows={2}
            placeholder="What's this event about?"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className={`${inputCls} resize-none`}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Start Date *">
            <input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} />
          </FormField>
          <FormField label="Start Time">
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={inputCls} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="End Date">
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} />
          </FormField>
          <FormField label="End Time">
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className={inputCls} />
          </FormField>
        </div>

        <FormField label="Project (optional)">
          <select value={projectId} onChange={e => setProjectId(e.target.value)} className={inputCls}>
            <option value="">No specific project</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </FormField>

        <FormField label="Color">
          <div className="flex gap-2 flex-wrap pt-1">
            {COLOR_OPTIONS.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                className={`w-9 h-9 rounded-xl transition-all ${c.cls} ${color === c.value ? 'ring-2 ring-offset-2 ring-brand scale-110' : 'hover:scale-105'}`}
                title={c.label}
              />
            ))}
          </div>
        </FormField>

        {/* Live preview pill */}
        {title && (
          <div
            className="text-[12px] font-bold text-white px-3 py-2 rounded-xl inline-flex items-center gap-2"
            style={{ backgroundColor: color }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            {title} · {startDate} {startTime}
          </div>
        )}

        <ModalActions onClose={onClose} loading={loading} submitLabel="Create Event" />
      </form>
    </Modal>
  );
};
