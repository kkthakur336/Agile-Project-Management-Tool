import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useDarkMode } from '../hooks/useDarkMode';

/* ── helpers ─────────────────────────────────────────── */
type Msg = { type: 'success' | 'error' | ''; text: string };

const Banner = ({ msg }: { msg: Msg }) => {
  if (!msg.text) return null;
  const isOk = msg.type === 'success';
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-[13px] font-semibold mb-5 ${isOk ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
      {isOk
        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      }
      {msg.text}
    </div>
  );
};

const inputCls = "w-full bg-bg border border-border-light rounded-2xl py-3 px-4 text-[14px] font-semibold text-text-main focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all placeholder-text-3";

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    type="button"
    onClick={onChange}
    className={`relative w-12 h-6 rounded-full transition-colors ${checked ? 'bg-brand' : 'bg-gray-200'}`}
    role="switch"
    aria-checked={checked}
  >
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
  </button>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[18px] font-extrabold text-text-main mb-6">{children}</div>
);

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-[13px] font-bold text-text-3 mb-2">{label}</label>
    {children}
    {hint && <p className="text-[12px] text-text-3 font-medium mt-1.5">{hint}</p>}
  </div>
);

const SaveBtn = ({ loading, label = 'Save Changes' }: { loading: boolean; label?: string }) => (
  <button
    type="submit"
    disabled={loading}
    className="bg-brand hover:bg-brand-dark text-white rounded-2xl px-6 py-3 text-[14px] font-bold transition-all shadow-[0_8px_20px_rgba(92,79,229,0.25)] hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
  >
    {loading ? 'Saving…' : label}
  </button>
);

/* ── TABS ─────────────────────────────────────────────── */
const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'account', label: 'Account' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'notifications', label: 'Notifications' },
];

/* ── MAIN PAGE ────────────────────────────────────────── */
export const SettingsPage = () => {
  const [tab, setTab] = useState('profile');
  const { isDark, toggle: toggleDark } = useDarkMode();

  /* ── Profile state ── */
  const [fullName, setFullName]   = useState('');
  const [email, setEmail]         = useState('');
  const [role, setRole]           = useState('');
  const [bio, setBio]             = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving]   = useState(false);
  const [profileMsg, setProfileMsg]         = useState<Msg>({ type: '', text: '' });

  /* ── Password state ── */
  const [currentPwd, setCurrentPwd]   = useState('');
  const [newPwd, setNewPwd]           = useState('');
  const [confirmPwd, setConfirmPwd]   = useState('');
  const [pwdSaving, setPwdSaving]     = useState(false);
  const [pwdMsg, setPwdMsg]           = useState<Msg>({ type: '', text: '' });

  /* ── Prefs state ── */
  const [prefsSaved, setPrefsSaved] = useState(false);

  /* ── Notification prefs state ── */
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({});
  const defaults: Record<string, boolean> = {
    email_notifications: true,
    task_assignments: true,
    team_mentions: true,
    project_updates: false,
  };
  const getNotif = (key: string) => notifPrefs[key] ?? defaults[key] ?? false;
  const toggleNotif = async (key: string) => {
    const newVal = !getNotif(key);
    const updated = { ...notifPrefs, [key]: newVal };
    setNotifPrefs(updated);
    
    // Save to DB
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ notification_settings: updated }).eq('id', user.id);
    }
  };

  /* ── Load profile ── */
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('full_name, role, bio, notification_settings').eq('id', user.id).single();
      setFullName(data?.full_name ?? '');
      setRole(data?.role ?? '');
      setBio(data?.bio ?? '');
      setEmail(user.email ?? '');
      if (data?.notification_settings) setNotifPrefs(data.notification_settings);
      setProfileLoading(false);
    };
    load();
  }, []);

  /* ── Save profile ── */
  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });
    setProfileSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in.');

      const { error: profErr } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim(), role: role.trim(), bio: bio.trim() })
        .eq('id', user.id);
      if (profErr) throw profErr;

      if (email.trim() !== user.email) {
        const { error: emailErr } = await supabase.auth.updateUser({ email: email.trim() });
        if (emailErr) throw emailErr;
        setProfileMsg({ type: 'success', text: 'Profile saved! Check your new email address to confirm the change.' });
      } else {
        setProfileMsg({ type: 'success', text: 'Profile saved successfully!' });
      }
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to save profile.' });
    } finally {
      setProfileSaving(false);
    }
  };

  /* ── Change password ── */
  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg({ type: '', text: '' });

    if (newPwd !== confirmPwd) {
      setPwdMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPwd.length < 6) {
      setPwdMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setPwdSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('User not found.');

      // Re-authenticate to verify current password
      const { error: reAuthErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPwd,
      });
      if (reAuthErr) throw new Error('Current password is incorrect.');

      const { error: updateErr } = await supabase.auth.updateUser({ password: newPwd });
      if (updateErr) throw updateErr;

      setPwdMsg({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (err: any) {
      setPwdMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setPwdSaving(false);
    }
  };

  /* ── Save preferences ── */
  const savePrefs = (e: React.FormEvent) => {
    e.preventDefault();
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2500);
  };

  /* ── Render ── */
  return (
    <div className="flex-1 overflow-y-auto px-8 pb-8">
      {/* Header */}
      <div className="mb-8">
        <div className="text-[32px] font-extrabold text-text-main tracking-tight leading-tight">Settings</div>
        <div className="text-[14px] text-text-3 mt-1 font-medium">Manage your account, preferences and notifications.</div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar nav */}
        <div className="w-52 flex-shrink-0">
          <nav className="space-y-1">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full text-left px-4 py-3 rounded-2xl text-[14px] font-bold transition-all ${tab === t.id ? 'bg-brand text-white shadow-[0_8px_20px_rgba(92,79,229,0.25)]' : 'text-text-3 hover:text-text-main hover:bg-white'}`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content panel */}
        <div className="flex-1 max-w-2xl">

          {/* ── PROFILE ─────────────────────────────── */}
          {tab === 'profile' && (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-border-light/50">
              <SectionTitle>Profile Information</SectionTitle>
              {profileLoading ? (
                <div className="text-text-3 text-[14px] font-medium animate-pulse">Loading profile…</div>
              ) : (
                <form onSubmit={saveProfile} className="space-y-5">
                  <Banner msg={profileMsg} />
                  <Field label="Full Name">
                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Doe" className={inputCls} />
                  </Field>
                  <Field label="Email Address" hint="A confirmation link will be sent if you change your email.">
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@example.com" className={inputCls} />
                  </Field>
                  <Field label="Job Title / Role">
                    <input type="text" value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Product Manager" className={inputCls} />
                  </Field>
                  <Field label="Bio">
                    <textarea rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell your team a little about yourself…" className={`${inputCls} resize-none`} />
                  </Field>
                  <div className="pt-2">
                    <SaveBtn loading={profileSaving} />
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ── ACCOUNT / PASSWORD ───────────────────── */}
          {tab === 'account' && (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-border-light/50">
              <SectionTitle>Change Password</SectionTitle>
              <form onSubmit={changePassword} className="space-y-5">
                <Banner msg={pwdMsg} />
                <Field label="Current Password">
                  <input required type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} placeholder="Enter your current password" className={inputCls} />
                </Field>
                <div className="border-t border-border-light/50 pt-5">
                  <Field label="New Password">
                    <input required type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="At least 6 characters" className={inputCls} />
                  </Field>
                </div>
                <Field label="Confirm New Password">
                  <input required type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Repeat new password" className={inputCls} />
                </Field>
                {/* Strength indicator */}
                {newPwd.length > 0 && (
                  <div>
                    <div className="flex gap-1.5 mb-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${newPwd.length >= i * 3 ? i <= 1 ? 'bg-red-400' : i <= 2 ? 'bg-amber-400' : i <= 3 ? 'bg-blue-400' : 'bg-green-500' : 'bg-gray-200'}`} />
                      ))}
                    </div>
                    <div className="text-[12px] text-text-3 font-medium">
                      {newPwd.length < 4 ? 'Too short' : newPwd.length < 7 ? 'Fair' : newPwd.length < 10 ? 'Good' : 'Strong'}
                    </div>
                  </div>
                )}
                <div className="pt-2">
                  <SaveBtn loading={pwdSaving} label="Update Password" />
                </div>
              </form>
            </div>
          )}

          {/* ── PREFERENCES ─────────────────────────── */}
          {tab === 'preferences' && (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-border-light/50">
              <SectionTitle>Preferences</SectionTitle>
              <form onSubmit={savePrefs} className="space-y-6">
                {prefsSaved && <Banner msg={{ type: 'success', text: 'Preferences saved!' }} />}

                {/* Dark Mode */}
                <div className="flex items-center justify-between py-4">
                  <div>
                    <div className="text-[15px] font-bold text-text-main">Dark Mode</div>
                    <div className="text-[13px] text-text-3 font-medium mt-0.5">Switch to a darker interface theme</div>
                  </div>
                  <Toggle checked={isDark} onChange={toggleDark} />
                </div>
              </form>
            </div>
          )}

          {/* ── NOTIFICATIONS ────────────────────────── */}
          {tab === 'notifications' && (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-border-light/50">
              <SectionTitle>Notification Settings</SectionTitle>
              <div className="space-y-0">
                {[
                  { key: 'email_notifications', title: 'Email Notifications', desc: 'Receive a daily digest of activity via email' },
                  { key: 'task_assignments',     title: 'Task Assignments',   desc: 'Notify me when a task is assigned to me' },
                  { key: 'team_mentions',        title: 'Team Mentions',      desc: 'Notify me when someone mentions me in a comment' },
                  { key: 'project_updates',      title: 'Project Updates',    desc: 'Notify me when project status or due dates change' },
                ].map((item, idx, arr) => (
                  <div key={item.key} className={`flex items-center justify-between py-5 ${idx < arr.length - 1 ? 'border-b border-border-light/50' : ''}`}>
                    <div>
                      <div className="text-[15px] font-bold text-text-main">{item.title}</div>
                      <div className="text-[13px] text-text-3 font-medium mt-0.5">{item.desc}</div>
                    </div>
                    <Toggle checked={getNotif(item.key)} onChange={() => toggleNotif(item.key)} />
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-border-light/50">
                <div className="flex items-center gap-2 text-[13px] text-text-3 font-medium">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Notification preferences are saved permanently to your profile.
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
