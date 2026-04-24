import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Icon } from '../components/Common';

export const InvitationsPage = () => {
  const { userId, email } = useAuth();
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchInvites = async () => {
    if (!email) return;
    setLoading(true);
    const { data } = await supabase
      .from('invitations')
      .select('*, projects(name)')
      .eq('email', email.toLowerCase())
      .in('status', ['Pending', 'Accepted', 'Declined'])
      .order('created_at', { ascending: false });
    if (data) setInvites(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchInvites();
  }, [email]);

  const handleAccept = async (id: string) => {
    setProcessingId(id);
    const { error } = await supabase.rpc('accept_invitation', { target_invite_id: id });
    if (error) {
      alert(error.message);
    } else {
      setInvites(prev => prev.filter(i => i.id !== id));
      // Reload to reflect new role if needed
      window.location.reload();
    }
    setProcessingId(null);
  };

  const handleDecline = async (id: string) => {
    setProcessingId(id);
    const { error } = await supabase
      .from('invitations')
      .update({ status: 'Declined' })
      .eq('id', id);
    if (error) {
      alert(error.message);
    } else {
      setInvites(prev => prev.filter(i => i.id !== id));
    }
    setProcessingId(null);
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto max-w-4xl mx-auto">
      <div className="mb-12">
        <h1 className="text-[32px] font-extrabold text-text-main tracking-tight leading-tight">Project Invitations</h1>
        <p className="text-[14px] text-text-3 mt-1 font-medium">Review and respond to invitations from your team.</p>
      </div>

      {loading ? (
        <div className="py-20 text-center animate-pulse">
          <div className="text-brand font-extrabold text-[24px]">Checking for invites...</div>
        </div>
      ) : invites.length === 0 ? (
        <div className="bg-white rounded-3xl border border-border-light p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-text-3 border border-border-light">
            <Icon name="team" size={24} />
          </div>
          <h2 className="text-[18px] font-bold text-text-main mb-2">No pending invitations</h2>
          <p className="text-[14px] text-text-3 font-medium">You're all caught up! When someone invites you to a project, it will show up here.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {invites.map(invite => (
            <div key={invite.id} className={`bg-white rounded-3xl border p-8 shadow-sm transition-all ${invite.status !== 'Pending' ? 'opacity-70 grayscale-[0.5]' : 'hover:shadow-md border-border-light'}`}>
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-3 py-1 rounded-full text-[12px] font-bold ${
                      invite.status === 'Accepted' ? 'bg-emerald-50 text-emerald-600' :
                      invite.status === 'Declined' ? 'bg-red-50 text-red-600' :
                      'bg-brand-light text-brand'
                    }`}>
                      {invite.status === 'Pending' ? `${invite.role} Invitation` : `Invitation ${invite.status}`}
                    </span>
                  </div>
                  <h3 className="text-[20px] font-extrabold text-text-main mb-2">
                    {invite.status === 'Accepted' ? 'Joined ' : ''}{invite.projects?.name || 'the project'}
                  </h3>
                  <p className="text-[14px] text-text-3 font-medium leading-relaxed">
                    {invite.status === 'Pending' 
                      ? `You have been invited to collaborate as a **${invite.role}**. Accepting this will give you the necessary permissions.`
                      : invite.status === 'Accepted'
                      ? `You have already accepted this invitation and are now a **${invite.role}** of this project.`
                      : `You declined this invitation.`}
                  </p>
                </div>
                
                {invite.status === 'Pending' ? (
                  <div className="flex flex-col gap-3 min-w-[140px]">
                    <button
                      disabled={!!processingId}
                      onClick={() => handleAccept(invite.id)}
                      className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg disabled:opacity-50"
                    >
                      {processingId === invite.id ? 'Joining...' : 'Accept Invite'}
                    </button>
                    <button
                      disabled={!!processingId}
                      onClick={() => handleDecline(invite.id)}
                      className="w-full bg-gray-50 hover:bg-gray-100 text-text-main border border-border-light font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-500 font-bold text-[14px]">
                    {invite.status === 'Accepted' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                    )}
                    {invite.status}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
