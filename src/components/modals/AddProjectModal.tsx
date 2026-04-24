import React, { useState } from 'react';
import { Modal, FormField, ModalActions, inputCls } from './Modal';
import { supabase } from '../../lib/supabase';

const COLOR_OPTIONS = [
  '#5C4FE5', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6', '#EC4899', '#1A1D2E',
];

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export const AddProjectModal = ({ onClose, onSuccess }: Props) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) throw new Error('You must be logged in.');

      const { error: insertErr } = await supabase.from('projects').insert({
        name: name.trim(),
        description: description.trim() || null,
        due_date: dueDate || null,
        color,
        owner_id: user.id,
        status: 'Active',
      });
      if (insertErr) throw insertErr;

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="New Project" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-[13px] font-semibold rounded-2xl">
            {error}
          </div>
        )}

        <FormField label="Project Name *">
          <input
            required
            type="text"
            placeholder="e.g. Onboarding Redesign"
            value={name}
            onChange={e => setName(e.target.value)}
            className={inputCls}
          />
        </FormField>

        <FormField label="Description">
          <textarea
            rows={3}
            placeholder="What is this project about?"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className={`${inputCls} resize-none`}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Due Date">
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className={inputCls}
            />
          </FormField>

          <FormField label="Project Color">
            <div className="flex flex-wrap gap-2 pt-1">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-xl transition-all ${color === c ? 'ring-2 ring-offset-2 ring-brand scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </FormField>
        </div>

        {/* Preview */}
        <div
          className="rounded-2xl p-4 flex items-center gap-3 text-white text-[14px] font-bold"
          style={{ backgroundColor: color }}
        >
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-lg">📁</div>
          <div>
            <div>{name || 'Project Name'}</div>
            {dueDate && <div className="text-[12px] font-medium opacity-80 mt-0.5">Due {new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>}
          </div>
        </div>

        <ModalActions onClose={onClose} loading={loading} submitLabel="Create Project" />
      </form>
    </Modal>
  );
};
