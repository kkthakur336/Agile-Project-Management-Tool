import React, { useRef, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Props {
  onClose: () => void;
  onNavigate: (page: string) => void;
  userProfile?: { name: string; email: string; role: string; initials: string } | null;
}

export const ProfileDropdown = ({ onClose, onNavigate, userProfile }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [userInfo, setUserInfo] = useState({ name: '', email: '', role: '' });
  const [initials, setInitials] = useState('?');

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  useEffect(() => {
    if (userProfile) {
      setUserInfo({ name: userProfile.name, email: userProfile.email, role: userProfile.role });
      setInitials(userProfile.initials);
      return;
    }

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single();
      const name = profile?.full_name || user.email?.split('@')[0] || 'User';
      setUserInfo({ name, email: user.email ?? '', role: profile?.role ?? 'Member' });
      setInitials(name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase());
    };
    load();
  }, [userProfile]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onClose();
  };

  return (
    <div
      ref={ref}
      className="absolute right-0 top-[calc(100%+10px)] w-[260px] bg-white rounded-3xl border border-border-light shadow-[0_12px_48px_rgba(0,0,0,0.12)] z-50 overflow-hidden"
      style={{ animation: 'modalIn 0.18s cubic-bezier(0.34,1.56,0.64,1)' }}
    >
      {/* User info header */}
      <div className="px-5 py-5 border-b border-border-light/50">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-brand flex items-center justify-center text-white font-extrabold text-[15px] flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-[14px] font-extrabold text-text-main truncate">{userInfo.name}</div>
            <div className="text-[12px] text-text-3 font-medium truncate">{userInfo.email}</div>
            <div className="text-[11px] font-bold text-brand mt-0.5">{userInfo.role}</div>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div className="py-2">
        {[
          {
            icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
            label: 'My Profile',
            action: () => { onNavigate('settings'); onClose(); },
          },
          {
            icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
            label: 'Settings',
            action: () => { onNavigate('settings'); onClose(); },
          },
        ].map((item) => (
          <button
            key={item.label}
            onClick={item.action}
            className="w-full flex items-center gap-3 px-5 py-3 text-[14px] font-semibold text-text-2 hover:text-text-main hover:bg-gray-50 transition-colors text-left"
          >
            <span className="text-text-3">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      {/* Sign out */}
      <div className="px-3 pb-3 border-t border-border-light/50 pt-2">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[14px] font-bold text-red-500 hover:bg-red-50 transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  );
};
