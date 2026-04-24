import React, { useState, useEffect } from 'react';
import { Modal, FormField, ModalActions, inputCls } from './Modal';
import { supabase } from '../../lib/supabase';

const ROLES = ['Member', 'Admin'];

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  forcedProjectId?: string;
}

export const AddMemberModal = ({ onClose, onSuccess, forcedProjectId }: Props) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Member');
  const [projectId, setProjectId] = useState(forcedProjectId || '');
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (forcedProjectId) {
      setProjectId(forcedProjectId);
      return;
    }
    supabase
      .from('projects')
      .select('id, name')
      .eq('status', 'Active')
      .then(({ data }) => {
        if (data) { setProjects(data); if (data[0]) setProjectId(data[0].id); }
      });
  }, [forcedProjectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) throw new Error('You must be logged in.');

      const inviteEmail = email.trim().toLowerCase();

      // Check for existing pending invitation to prevent duplicates
      let checkQuery = supabase
        .from('invitations')
        .select('id')
        .eq('email', inviteEmail)
        .eq('status', 'Pending');
      
      if (projectId) {
        checkQuery = checkQuery.eq('project_id', projectId);
      } else {
        checkQuery = checkQuery.is('project_id', null);
      }

      const { data: existing } = await checkQuery.maybeSingle();
      if (existing) {
        throw new Error('A pending invitation already exists for this email and project.');
      }

      const { error: insertErr } = await supabase.from('invitations').insert({
        email: inviteEmail,
        role,
        invited_by: user.id,
        project_id: projectId || null,
        status: 'Pending',
      });
      if (insertErr) throw insertErr;

      setSuccess(`Invitation sent to ${inviteEmail}! They'll see it when they log in.`);
      setEmail('');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation.');
    } finally {
      setLoading(false);
    }
  };

  const roleDescriptions: Record<string, string> = {
    Admin: 'Can manage projects, tasks, and members.',
    Member: 'Can create and update tasks.',
  };

  return (
    <Modal title="Invite Team Member" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-[13px] font-semibold rounded-2xl">
            {error}
          </div>
        )}
        {success && (
          <div className="px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-[13px] font-semibold rounded-2xl flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
            {success}
          </div>
        )}

        <FormField label="Email Address *">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <input
              required
              type="email"
              placeholder="teammate@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={`${inputCls} pl-11`}
            />
          </div>
        </FormField>

        {!forcedProjectId && (
          <FormField label="Project">
            <select value={projectId} onChange={e => setProjectId(e.target.value)} className={inputCls}>
              <option value="">No specific project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </FormField>
        )}

        <FormField label="Role">
          <div className="space-y-2">
            {ROLES.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${role === r ? 'border-brand bg-brand-light' : 'border-border-light hover:border-brand/30 bg-bg'}`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${role === r ? 'border-brand' : 'border-border-light'}`}>
                  {role === r && <div className="w-2.5 h-2.5 rounded-full bg-brand" />}
                </div>
                <div>
                  <div className={`text-[13px] font-bold ${role === r ? 'text-brand' : 'text-text-main'}`}>{r}</div>
                  <div className="text-[11px] text-text-3 font-medium">{roleDescriptions[r]}</div>
                </div>
              </button>
            ))}
          </div>
        </FormField>

        <ModalActions onClose={onClose} loading={loading} submitLabel="Send Invitation" />
      </form>
    </Modal>
  );
};
