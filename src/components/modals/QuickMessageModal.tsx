import React, { useState } from 'react';
import { Modal, FormField, ModalActions, inputCls } from './Modal';
import { supabase } from '../../lib/supabase';

interface Props {
  recipient: { id: string; name: string; role?: string | null };
  onClose: () => void;
}

export const QuickMessageModal = ({ recipient, onClose }: Props) => {
  const [subject, setSubject] = useState('');
  const [body, setBody]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [sent, setSent]       = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) throw new Error('Not logged in.');

      const { error: insertErr } = await supabase.from('messages').insert({
        sender_id:    user.id,
        recipient_id: recipient.id,
        subject:      subject.trim() || null,
        body:         body.trim(),
      });
      if (insertErr) throw insertErr;

      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={`Message ${recipient.name}`} onClose={onClose} size="sm">
      {sent ? (
        <div className="flex flex-col items-center py-6 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
          <div className="text-[16px] font-extrabold text-text-main">Message sent!</div>
          <div className="text-[13px] text-text-3 font-medium text-center">
            Your message was delivered to <span className="text-brand font-bold">{recipient.name}</span>.
          </div>
          <button
            onClick={onClose}
            className="bg-brand text-white rounded-2xl px-6 py-2.5 text-[14px] font-bold hover:bg-brand-dark transition-all"
          >
            Close
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Recipient chip */}
          <div className="flex items-center gap-3 px-4 py-3 bg-brand-light rounded-2xl">
            <div className="w-8 h-8 rounded-xl bg-brand text-white font-extrabold text-[13px] flex items-center justify-center flex-shrink-0">
              {recipient.name[0]?.toUpperCase()}
            </div>
            <div>
              <div className="text-[13px] font-bold text-brand">{recipient.name}</div>
              {recipient.role && <div className="text-[11px] font-medium text-text-3">{recipient.role}</div>}
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-[13px] font-semibold rounded-2xl">
              {error}
            </div>
          )}

          <FormField label="Subject">
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Optional subject…"
              className={inputCls}
            />
          </FormField>

          <FormField label="Message *">
            <textarea
              required
              rows={4}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write your message…"
              className={`${inputCls} resize-none`}
            />
          </FormField>

          <ModalActions onClose={onClose} loading={loading} submitLabel="Send Message" />
        </form>
      )}
    </Modal>
  );
};
