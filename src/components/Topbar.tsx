import React, { useState, useRef, useEffect } from 'react';
import { Icon, Avatar, USERS } from './Common';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationsPanel } from './notifications/NotificationsPanel';
import { MessagesPanel } from './messages/MessagesPanel';
import { ProfileDropdown } from './profile/ProfileDropdown';
import { supabase } from '../lib/supabase';



const TYPE_ICON: Record<string, string> = { task: 'tasks', project: 'analytics', member: 'team' };
const TYPE_LABEL: Record<string, string> = { task: 'Task', project: 'Project', member: 'Member' };

export const Topbar = ({ setPage }: { setPage: (p: string) => void }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [notifOpen, setNotifOpen]     = useState(false);
  const [mailOpen, setMailOpen]       = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const bellRef    = useRef<HTMLDivElement>(null);
  const mailRef    = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, loading: notifLoading, markAsRead, markAllRead, deleteNotification } = useNotifications();

  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    const fetchSearchData = async () => {
      const q = query.trim();
      if (!q) { setResults([]); return; }
      
      const [tasksRes, projectsRes, profilesRes] = await Promise.all([
        supabase.from('tasks').select('id, title, priority').ilike('title', `%${q}%`).limit(5),
        supabase.from('projects').select('id, name, status').ilike('name', `%${q}%`).limit(5),
        supabase.from('profiles').select('id, full_name, role').ilike('full_name', `%${q}%`).limit(5)
      ]);
      
      const newResults: any[] = [];
      if (tasksRes.data) {
        tasksRes.data.forEach(t => newResults.push({ type: 'task', label: t.title, sub: `Priority: ${t.priority}`, page: 'projects' }));
      }
      if (projectsRes.data) {
        projectsRes.data.forEach(p => newResults.push({ type: 'project', label: p.name, sub: p.status, page: 'projects' }));
      }
      if (profilesRes.data) {
        profilesRes.data.forEach(p => newResults.push({ type: 'member', label: p.full_name || 'User', sub: p.role, page: 'team' }));
      }
      
      setResults(newResults);
    };
    
    const debounce = setTimeout(fetchSearchData, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const [userProfile, setUserProfile] = useState<{name: string, email: string, role: string, initials: string} | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single();
      const name = profile?.full_name || user.email?.split('@')[0] || 'User';
      const initials = name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
      setUserProfile({ name, email: user.email ?? '', role: profile?.role ?? 'Member', initials });
    };
    loadProfile();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (item: any) => {
    setPage(item.page);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-4 py-6 px-8 flex-shrink-0">
      <div ref={wrapperRef} className="flex-1 max-w-[480px] relative">
        <div className="flex items-center gap-3 bg-white rounded-2xl px-5 py-3.5 border border-transparent focus-within:border-brand shadow-sm transition-colors">
          <span className="text-text-3"><Icon name="search" size={18} /></span>
          <input
            className="flex-1 bg-transparent border-none outline-none text-[14px] text-text-main placeholder-text-3"
            placeholder="Search tasks, projects, members..."
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
          />
          {query && (
            <button onClick={() => { setQuery(''); setOpen(false); }} className="text-text-3 hover:text-text-main transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>

        {/* Dropdown */}
        {open && results.length > 0 && (
          <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white rounded-2xl border border-border-light shadow-[0_12px_40px_rgba(0,0,0,0.1)] z-50 overflow-hidden">
            {['task', 'project', 'member'].map(type => {
              const group = results.filter(r => r.type === type);
              if (!group.length) return null;
              return (
                <div key={type}>
                  <div className="px-4 pt-3 pb-1 text-[11px] font-bold text-text-3 uppercase tracking-widest">{TYPE_LABEL[type]}s</div>
                  {group.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelect(item)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-light transition-colors text-left group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-brand-light text-brand flex items-center justify-center flex-shrink-0 group-hover:bg-brand group-hover:text-white transition-colors">
                        <Icon name={TYPE_ICON[type]} size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-bold text-text-main truncate group-hover:text-brand transition-colors">{item.label}</div>
                        <div className="text-[12px] text-text-3 font-medium truncate">{item.sub}</div>
                      </div>
                      <Icon name="arrow" size={14} />
                    </button>
                  ))}
                </div>
              );
            })}
            <div className="px-4 py-3 border-t border-border-light/50">
              <span className="text-[12px] text-text-3 font-medium">{results.length} result{results.length !== 1 ? 's' : ''} for "<span className="text-brand font-bold">{query}</span>"</span>
            </div>
          </div>
        )}

        {/* No results */}
        {open && query.trim().length > 0 && results.length === 0 && (
          <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white rounded-2xl border border-border-light shadow-[0_12px_40px_rgba(0,0,0,0.1)] z-50 px-5 py-8 text-center">
            <div className="text-text-3 font-bold text-[14px]">No results for "<span className="text-text-main">{query}</span>"</div>
            <div className="text-text-3 text-[13px] font-medium mt-1">Try searching for tasks, projects, or team members.</div>
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Mail + Messages Panel */}
        <div ref={mailRef} className="relative">
          <button
            onClick={() => { setMailOpen(prev => !prev); setNotifOpen(false); setProfileOpen(false); }}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center bg-white shadow-sm transition-colors ${mailOpen ? 'text-brand bg-brand-light' : 'text-text-2 hover:text-brand'}`}
          >
            <Icon name="mail" size={20} />
          </button>
          {mailOpen && <MessagesPanel onClose={() => setMailOpen(false)} />}
        </div>

        {/* Bell + Notifications Panel */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => setNotifOpen(prev => !prev)}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center bg-white shadow-sm transition-colors relative ${notifOpen ? 'text-brand bg-brand-light' : 'text-text-2 hover:text-brand'}`}
          >
            <Icon name="bell" size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center px-0.5">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <NotificationsPanel
              notifications={notifications}
              unreadCount={unreadCount}
              loading={notifLoading}
              onMarkAsRead={markAsRead}
              onMarkAllRead={markAllRead}
              onDelete={deleteNotification}
              onClose={() => setNotifOpen(false)}
              onNotificationClick={(n) => {
                if (n.type === 'invitation_received') {
                  setPage('invitations');
                  setNotifOpen(false);
                }
              }}
            />
          )}
        </div>
        {/* Profile Pill + Dropdown */}
        <div ref={profileRef} className="relative ml-2">
          <button
            onClick={() => { setProfileOpen(prev => !prev); setNotifOpen(false); setMailOpen(false); }}
            className={`flex items-center gap-3 pl-3 pr-4 py-2 rounded-full cursor-pointer transition-all shadow-sm ${
              profileOpen ? 'bg-brand-light ring-2 ring-brand/20' : 'bg-white hover:bg-gray-50'
            }`}
          >
            {userProfile ? (
              <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-white font-extrabold text-[12px] flex-shrink-0">
                {userProfile.initials}
              </div>
            ) : (
              <Avatar user={USERS[0]} size={36} />
            )}
            <div className="hidden sm:block">
              <div className="text-[14px] font-bold text-text-main leading-tight">My Account</div>
              <div className="text-[12px] text-text-3 font-medium">Profile &amp; Settings</div>
            </div>
            <span className={`text-text-3 ml-2 transition-transform ${profileOpen ? 'rotate-180' : ''}`}>
              <Icon name="chevron" size={16} />
            </span>
          </button>
          {profileOpen && (
            <ProfileDropdown
              onClose={() => setProfileOpen(false)}
              onNavigate={setPage}
              userProfile={userProfile}
            />
          )}
        </div>
      </div>
    </div>
  );
};
