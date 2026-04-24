import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string | null;
  body: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
}

interface Profile { id: string; full_name: string | null; role: string | null; }

const timeAgo = (iso: string) => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

interface Props {
  onClose: () => void;
}

export const MessagesPanel = ({ onClose }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<'inbox' | 'compose'>('inbox');
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Compose state
  const [recipientId, setRecipientId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState('');

  // Selected message
  const [selected, setSelected] = useState<Message | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const fetchMessages = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*, profiles!messages_sender_id_fkey(full_name)')
      .eq('recipient_id', uid)
      .order('created_at', { ascending: false })
      .limit(30);

    if (data) {
      setMessages(data.map((m: any) => ({
        ...m,
        sender_name: m.profiles?.full_name ?? 'Unknown',
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);
      fetchMessages(user.id);

      const { data: prof } = await supabase.from('profiles').select('id, full_name, role');
      if (prof) setProfiles(prof.filter(p => p.id !== user.id));

      // Realtime: new messages
      const channel = supabase
        .channel(`messages:${user.id}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'messages',
          filter: `recipient_id=eq.${user.id}`,
        }, () => fetchMessages(user.id))
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    };
    init();
  }, [fetchMessages]);

  const markRead = async (msg: Message) => {
    setSelected(msg);
    if (!msg.is_read) {
      await supabase.from('messages').update({ is_read: true }).eq('id', msg.id);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !recipientId || !body.trim()) return;
    setSending(true);
    setSendMsg('');
    const { error } = await supabase.from('messages').insert({
      sender_id: currentUserId,
      recipient_id: recipientId,
      subject: subject.trim() || null,
      body: body.trim(),
    });
    if (error) { setSendMsg('Failed to send. Please try again.'); }
    else {
      setSendMsg('Message sent!');
      setSubject(''); setBody(''); setRecipientId('');
      setTimeout(() => { setSendMsg(''); setView('inbox'); }, 1500);
    }
    setSending(false);
  };

  const unread = messages.filter(m => !m.is_read).length;
  const inputCls = "w-full bg-bg border border-border-light rounded-2xl py-2.5 px-4 text-[13px] font-semibold text-text-main focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all";

  return (
    <div
      ref={ref}
      className="absolute right-0 top-[calc(100%+10px)] w-[400px] bg-white rounded-3xl border border-border-light shadow-[0_12px_48px_rgba(0,0,0,0.12)] z-50 overflow-hidden flex flex-col"
      style={{ animation: 'modalIn 0.18s cubic-bezier(0.34,1.56,0.64,1)', maxHeight: '520px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-light/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[16px] font-extrabold text-text-main">Messages</span>
          {unread > 0 && (
            <span className="bg-brand text-white text-[11px] font-bold px-2 py-0.5 rounded-full">{unread}</span>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => { setView('inbox'); setSelected(null); }}
            className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all ${view === 'inbox' ? 'bg-brand-light text-brand' : 'text-text-3 hover:text-text-main hover:bg-gray-50'}`}
          >
            Inbox
          </button>
          <button
            onClick={() => { setView('compose'); setSelected(null); }}
            className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all ${view === 'compose' ? 'bg-brand-light text-brand' : 'text-text-3 hover:text-text-main hover:bg-gray-50'}`}
          >
            + Compose
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="overflow-y-auto flex-1">

        {/* ── INBOX ── */}
        {view === 'inbox' && (
          <>
            {selected ? (
              /* Message detail */
              <div className="p-5">
                <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-[12px] font-bold text-text-3 hover:text-brand transition-colors mb-4">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                  Back
                </button>
                <div className="text-[15px] font-extrabold text-text-main mb-1">{selected.subject || '(no subject)'}</div>
                <div className="text-[12px] text-text-3 font-medium mb-4">From <span className="text-brand font-bold">{selected.sender_name}</span> · {timeAgo(selected.created_at)}</div>
                <div className="text-[14px] text-text-2 font-medium leading-relaxed whitespace-pre-wrap">{selected.body}</div>
              </div>
            ) : loading ? (
              <div className="py-10 text-center text-text-3 text-[13px] font-medium animate-pulse">Loading…</div>
            ) : messages.length === 0 ? (
              <div className="py-12 text-center px-6">
                <div className="w-14 h-14 bg-brand-light rounded-2xl flex items-center justify-center mx-auto mb-3 text-brand">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <div className="text-[15px] font-bold text-text-main mb-1">No messages yet</div>
                <div className="text-[13px] text-text-3 font-medium">Send your first message to a team member.</div>
                <button onClick={() => setView('compose')} className="mt-3 text-[13px] font-bold text-brand hover:underline">Compose →</button>
              </div>
            ) : (
              messages.map(msg => (
                <button
                  key={msg.id}
                  onClick={() => markRead(msg)}
                  className={`w-full flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left border-b border-border-light/30 last:border-0 ${!msg.is_read ? 'bg-brand-light/20' : ''}`}
                >
                  {!msg.is_read && <div className="absolute left-2 w-1.5 h-1.5 rounded-full bg-brand mt-2" />}
                  <div className="w-9 h-9 rounded-xl bg-brand text-white font-extrabold text-[13px] flex items-center justify-center flex-shrink-0">
                    {(msg.sender_name ?? '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[13px] leading-snug truncate ${!msg.is_read ? 'font-bold text-text-main' : 'font-semibold text-text-2'}`}>
                      {msg.sender_name}
                    </div>
                    <div className="text-[12px] font-bold text-text-main truncate">{msg.subject || '(no subject)'}</div>
                    <div className="text-[11px] text-text-3 font-medium truncate">{msg.body}</div>
                  </div>
                  <div className="text-[11px] text-text-3 font-medium flex-shrink-0">{timeAgo(msg.created_at)}</div>
                </button>
              ))
            )}
          </>
        )}

        {/* ── COMPOSE ── */}
        {view === 'compose' && (
          <form onSubmit={sendMessage} className="p-5 space-y-4">
            {sendMsg && (
              <div className={`px-4 py-3 rounded-2xl text-[13px] font-semibold ${sendMsg.includes('sent') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                {sendMsg}
              </div>
            )}
            <div>
              <label className="block text-[12px] font-bold text-text-3 mb-1.5">To</label>
              <select required value={recipientId} onChange={e => setRecipientId(e.target.value)} className={inputCls}>
                <option value="">Select a team member…</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name ?? 'Unknown'} — {p.role ?? 'Member'}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-bold text-text-3 mb-1.5">Subject</label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Optional subject…" className={inputCls} />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-text-3 mb-1.5">Message *</label>
              <textarea required rows={5} value={body} onChange={e => setBody(e.target.value)} placeholder="Write your message…" className={`${inputCls} resize-none`} />
            </div>
            <button
              type="submit"
              disabled={sending || !recipientId || !body.trim()}
              className="w-full bg-brand hover:bg-brand-dark text-white rounded-2xl py-3 text-[14px] font-bold transition-all hover:-translate-y-0.5 shadow-[0_8px_20px_rgba(92,79,229,0.25)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {sending ? 'Sending…' : 'Send Message'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
