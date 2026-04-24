import React, { useState, useEffect } from 'react';
import { Modal, FormField, ModalActions, inputCls } from './Modal';
import { supabase } from '../../lib/supabase';

const PRIORITIES = ['High', 'Med', 'Low'];
const STATUSES = ['Backlog', 'In Progress', 'Review', 'Done'];
const POINTS = [1, 2, 3, 5, 8, 13];

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  defaultStatus?: string;
  projectId?: string;
}

export const AddTaskModal = ({ onClose, onSuccess, defaultStatus = 'Backlog', projectId: forcedProjectId }: Props) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Med');
  const [status, setStatus] = useState(defaultStatus);
  const [points, setPoints] = useState(3);
  const [dueDate, setDueDate] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [projects, setProjects] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const [profRes, projRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, role'),
        forcedProjectId ? Promise.resolve({ data: [] }) : supabase.from('projects').select('id, name, color').eq('status', 'Active'),
      ]);
      if (profRes.data) setProfiles(profRes.data);
      if (!forcedProjectId && projRes.data) { 
        setProjects(projRes.data); 
        if (projRes.data[0]) setProjectId(projRes.data[0].id); 
      }
    };
    fetchData();
  }, [forcedProjectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) throw new Error('You must be logged in.');

      const { error: insertErr } = await supabase.from('tasks').insert({
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status,
        points,
        due_date: dueDate || null,
        project_id: forcedProjectId || projectId || null,
        assignee_id: assigneeId || null,
        created_by: user.id,
      });
      if (insertErr) throw insertErr;

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create task.');
    } finally {
      setLoading(false);
    }
  };

  const priorityColors: Record<string, string> = {
    High: 'bg-red-100 text-red-600 border-red-200',
    Med: 'bg-blue-100 text-blue-600 border-blue-200',
    Low: 'bg-gray-100 text-gray-500 border-gray-200',
  };

  return (
    <Modal title="New Task" onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-[13px] font-semibold rounded-2xl">
            {error}
          </div>
        )}

        <FormField label="Task Title *">
          <input
            required
            type="text"
            placeholder="e.g. Build checkout form with validation"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className={inputCls}
          />
        </FormField>

        <FormField label="Description">
          <textarea
            rows={3}
            placeholder="Add more context about this task..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            className={`${inputCls} resize-none`}
          />
        </FormField>

        <div className={`grid ${forcedProjectId ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
          {!forcedProjectId && (
            <FormField label="Project">
              <select value={projectId} onChange={e => setProjectId(e.target.value)} className={inputCls}>
                {projects.length === 0 && <option value="">No projects yet</option>}
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </FormField>
          )}

          <FormField label="Assignee">
            <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className={inputCls}>
              <option value="">Unassigned</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.full_name || 'Unknown'} — {p.role}</option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField label="Priority">
            <div className="flex gap-2 flex-wrap">
              {PRIORITIES.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-bold border transition-all ${priority === p ? priorityColors[p] : 'bg-bg border-border-light text-text-3 hover:border-brand hover:text-brand'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </FormField>

          <FormField label="Column">
            <select value={status} onChange={e => setStatus(e.target.value)} className={inputCls}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormField>

          <FormField label="Story Points">
            <div className="flex gap-1.5 flex-wrap">
              {POINTS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPoints(p)}
                  className={`w-9 h-9 rounded-xl text-[13px] font-bold border transition-all ${points === p ? 'bg-brand text-white border-brand' : 'bg-bg border-border-light text-text-3 hover:border-brand hover:text-brand'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </FormField>
        </div>

        <FormField label="Due Date">
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className={`${inputCls} max-w-[240px]`}
          />
        </FormField>

        <ModalActions onClose={onClose} loading={loading} submitLabel="Create Task" />
      </form>
    </Modal>
  );
};
