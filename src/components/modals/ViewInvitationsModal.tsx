import React from 'react';
import { Modal } from './Modal';

interface Props {
  onClose: () => void;
  invitations: any[];
  loading: boolean;
}

export const ViewInvitationsModal = ({ onClose, invitations, loading }: Props) => {
  return (
    <Modal title="Team Invitations" onClose={onClose}>
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="py-12 text-center">
            <div className="text-brand font-extrabold text-[18px] animate-pulse">Sprintly</div>
            <div className="text-text-3 text-[13px] font-medium mt-2">Fetching invitations...</div>
          </div>
        ) : invitations.length === 0 ? (
          <div className="py-12 text-center px-6 bg-gray-50 rounded-3xl border border-dashed border-border-light">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-text-3 shadow-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>
              </svg>
            </div>
            <div className="text-[15px] font-bold text-text-main mb-1">No invitations found</div>
            <div className="text-[13px] text-text-3 font-medium">When you invite team members, they will appear here.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {invitations.map(invite => (
              <div key={invite.id} className="flex items-center justify-between p-4 bg-white border border-border-light/50 rounded-2xl hover:border-brand/30 transition-all group">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[14px] ${invite.role === 'Admin' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                    {invite.role[0]}
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-text-main leading-tight">{invite.email}</div>
                    <div className="text-[11px] text-text-3 font-medium mt-1 uppercase tracking-wider">
                      {invite.role} {invite.projects?.name ? `· ${invite.projects.name}` : ''} · Sent {new Date(invite.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
                    invite.status === 'Pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                    invite.status === 'Accepted' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                    'bg-red-50 text-red-600 border border-red-100'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${invite.status === 'Pending' ? 'bg-amber-600 animate-pulse' : invite.status === 'Accepted' ? 'bg-emerald-600' : 'bg-red-600'}`} />
                    {invite.status}
                  </span>

                  <button
                    onClick={async () => {
                      if (window.confirm(`Are you sure you want to revoke the invitation for ${invite.email}? This will immediately remove their access.`)) {
                        const { error } = await supabase.rpc('revoke_invitation', { target_invite_id: invite.id });
                        if (error) alert(error.message);
                        else window.location.reload(); // Refresh to show changes
                      }
                    }}
                    className="p-2 rounded-lg text-text-3 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                    title="Revoke Invitation"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-8 flex justify-end">
        <button 
          onClick={onClose}
          className="px-6 py-2.5 rounded-xl text-[14px] font-bold text-white bg-brand hover:bg-brand-dark transition-all shadow-sm"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};
