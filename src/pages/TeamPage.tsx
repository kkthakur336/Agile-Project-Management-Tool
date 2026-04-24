import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Icon } from '../components/Common';
import { AddMemberModal } from '../components/modals/AddMemberModal';
import { QuickMessageModal } from '../components/modals/QuickMessageModal';
import { supabase } from '../lib/supabase';

interface Member {
  id: string;
  full_name: string | null;
  role: string | null;
  email?: string;
  tasksDone: number;
  activeProjects: number;
}

const InitialAvatar = ({ name, size = 64 }: { name: string; size?: number }) => {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const colors = ['#5C4FE5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div
      className="rounded-full flex items-center justify-center font-extrabold text-white flex-shrink-0"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.3 }}
    >
      {initials}
    </div>
  );
};

export const TeamPage = () => {
  const [showAddMember, setShowAddMember]     = useState(false);
  const [messageTarget, setMessageTarget]     = useState<Member | null>(null);
  const [members, setMembers]                 = useState<Member[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [searchOpen, setSearchOpen]           = useState(false);
  const [searchQuery, setSearchQuery]         = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [currentUserId, setCurrentUserId]     = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id ?? null);

    const [profilesRes, tasksRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name, role').order('full_name'),
      supabase.from('tasks').select('assignee_id, status'),
    ]);

    const profiles = profilesRes.data ?? [];
    const tasks    = tasksRes.data ?? [];

    const enriched: Member[] = profiles.map(p => ({
      ...p,
      tasksDone:      tasks.filter(t => t.assignee_id === p.id && t.status === 'Done').length,
      activeProjects: tasks.filter(t => t.assignee_id === p.id && t.status === 'In Progress').length,
    }));

    setMembers(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  // Auto-focus search when opened
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const filtered = members.filter(m => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.full_name?.toLowerCase().includes(q) ||
      m.role?.toLowerCase().includes(q)
    );
  });

  return (
    <>
      {showAddMember && (
        <AddMemberModal
          onClose={() => setShowAddMember(false)}
          onSuccess={() => { setShowAddMember(false); fetchMembers(); }}
        />
      )}
      {messageTarget && (
        <QuickMessageModal
          recipient={{ id: messageTarget.id, name: messageTarget.full_name ?? 'Team Member', role: messageTarget.role }}
          onClose={() => setMessageTarget(null)}
        />
      )}

      <div className="flex-1 overflow-y-auto px-8 pb-8 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="text-[32px] font-extrabold text-text-main tracking-tight leading-tight">Team Members</div>
            <div className="text-[14px] text-text-3 mt-1 font-medium">
              {loading ? 'Loading…' : `${members.length} member${members.length !== 1 ? 's' : ''} in your workspace`}
            </div>
          </div>
          <div className="flex gap-3 items-center">
            {/* Search bar */}
            <div className={`flex items-center gap-2 bg-white border rounded-xl shadow-sm transition-all overflow-hidden ${searchOpen ? 'border-brand ring-2 ring-brand/20 px-4 py-3' : 'border-border-light px-4 py-3'}`}>
              <Icon name="search" size={16} />
              {searchOpen ? (
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by name or role…"
                  className="w-52 bg-transparent border-none outline-none text-[14px] font-semibold text-text-main placeholder-text-3"
                  onKeyDown={e => { if (e.key === 'Escape') { setSearchOpen(false); setSearchQuery(''); } }}
                />
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="text-[14px] font-bold text-text-main"
                >
                  Search
                </button>
              )}
              {searchOpen && searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}
                  className="text-text-3 hover:text-text-main transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>

            <button
              onClick={() => setShowAddMember(true)}
              className="bg-brand hover:bg-brand-dark text-white rounded-xl px-5 py-3 text-[14px] font-bold flex items-center gap-2 transition-all shadow-[0_8px_20px_rgba(92,79,229,0.25)] hover:-translate-y-0.5"
            >
              <Icon name="plus" size={16} /> Add Member
            </button>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-border-light/50 rounded-3xl p-6 animate-pulse">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full" />
                  <div className="w-8 h-8 bg-gray-100 rounded-xl" />
                </div>
                <div className="h-5 bg-gray-200 rounded-lg w-2/3 mb-2" />
                <div className="h-4 bg-gray-100 rounded-lg w-1/3 mb-6" />
                <div className="grid grid-cols-2 gap-4 pt-5 border-t border-border-light/50">
                  <div className="h-8 bg-gray-100 rounded-lg" />
                  <div className="h-8 bg-gray-100 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16">
            {searchQuery ? (
              <>
                <div className="w-16 h-16 bg-brand-light rounded-2xl flex items-center justify-center mb-4 text-brand">
                  <Icon name="search" size={28} />
                </div>
                <div className="text-[18px] font-extrabold text-text-main mb-1">No results for "{searchQuery}"</div>
                <div className="text-[14px] text-text-3 font-medium">Try a different name or role</div>
                <button onClick={() => setSearchQuery('')} className="mt-3 text-brand font-bold text-[14px] hover:underline">Clear search</button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-brand-light rounded-2xl flex items-center justify-center mb-4 text-brand">
                  <Icon name="team" size={28} />
                </div>
                <div className="text-[18px] font-extrabold text-text-main mb-1">No team members yet</div>
                <div className="text-[14px] text-text-3 font-medium mb-4">Invite your first team member to get started</div>
                <button
                  onClick={() => setShowAddMember(true)}
                  className="bg-brand text-white px-6 py-3 rounded-xl text-[14px] font-bold hover:bg-brand-dark transition-all shadow-[0_8px_20px_rgba(92,79,229,0.25)]"
                >
                  + Add Member
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            {searchQuery && (
              <div className="mb-4 text-[13px] font-medium text-text-3">
                Showing <span className="font-bold text-text-main">{filtered.length}</span> result{filtered.length !== 1 ? 's' : ''} for "<span className="text-brand font-bold">{searchQuery}</span>"
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(member => (
                <div
                  key={member.id}
                  className="bg-white border border-border-light/50 rounded-3xl p-6 flex flex-col shadow-sm hover:shadow-md hover:border-brand/30 transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="relative">
                      <InitialAvatar name={member.full_name ?? '?'} size={64} />
                      {/* Online indicator — green for current user, gray for others */}
                      <div className={`absolute bottom-0 right-0 w-4 h-4 border-2 border-white rounded-full ${member.id === currentUserId ? 'bg-green-500' : 'bg-gray-300'}`} />
                    </div>
                    <button
                      onClick={() => setMessageTarget(member)}
                      disabled={member.id === currentUserId}
                      title={member.id === currentUserId ? "Can't message yourself" : `Message ${member.full_name}`}
                      className="text-text-3 hover:text-brand transition-colors p-2 rounded-xl hover:bg-brand-light disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Icon name="mail" size={18} />
                    </button>
                  </div>

                  <div className="mb-4">
                    <div className="text-[18px] font-bold text-text-main mb-1 group-hover:text-brand transition-colors">
                      {member.full_name ?? 'Unknown User'}
                      {member.id === currentUserId && (
                        <span className="ml-2 text-[11px] font-bold text-brand bg-brand-light px-2 py-0.5 rounded-full">You</span>
                      )}
                    </div>
                    <div className="text-[13px] font-bold text-brand bg-brand-light inline-block px-3 py-1 rounded-lg">
                      {member.role ?? 'Member'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-auto pt-5 border-t border-border-light/50">
                    <div>
                      <div className="text-[11px] font-bold text-text-3 uppercase tracking-wider mb-1">Tasks Done</div>
                      <div className="text-[16px] font-extrabold text-text-main">{member.tasksDone}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-text-3 uppercase tracking-wider mb-1">In Progress</div>
                      <div className="text-[16px] font-extrabold text-text-main">{member.activeProjects}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
};
