import React, { useRef, useEffect } from 'react';
import type { AppNotification } from '../../hooks/useNotifications';
import { timeAgo } from '../../hooks/useNotifications';

/* ── Type metadata ─────────────────────────────────────── */
const TYPE_META: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  task_assigned: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
      </svg>
    ),
    color: 'text-brand',
    bg: 'bg-brand-light',
  },
  task_updated: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    ),
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
  project_created: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  invitation_received: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  event_created: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    ),
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
  },
  message_received: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
};

const DEFAULT_META = {
  icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  color: 'text-text-3',
  bg: 'bg-gray-100',
};

/* ── NotificationItem ───────────────────────────────────── */
const NotificationItem = ({
  notification,
  onRead,
  onDelete,
  onClick,
}: {
  notification: AppNotification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick?: (notification: AppNotification) => void;
}) => {
  const meta = TYPE_META[notification.type] ?? DEFAULT_META;

  return (
    <div
      onClick={() => {
        if (!notification.is_read) onRead(notification.id);
        onClick?.(notification);
      }}
      className={`flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer group relative ${!notification.is_read ? 'bg-brand-light/30' : ''}`}
    >
      {/* Unread indicator */}
      {!notification.is_read && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand" />
      )}

      {/* Icon */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bg} ${meta.color}`}>
        {meta.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-6">
        <div className={`text-[13px] font-bold leading-snug mb-0.5 ${notification.is_read ? 'text-text-2' : 'text-text-main'}`}>
          {notification.title}
        </div>
        {notification.body && (
          <div className="text-[12px] text-text-3 font-medium leading-relaxed truncate">{notification.body}</div>
        )}
        <div className="text-[11px] text-text-3 font-medium mt-1.5">{timeAgo(notification.created_at)}</div>
      </div>

      {/* Delete button */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(notification.id); }}
        className="absolute right-4 top-4 w-6 h-6 rounded-lg flex items-center justify-center text-text-3 opacity-0 group-hover:opacity-100 hover:bg-gray-200 hover:text-red-500 transition-all"
        title="Dismiss"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
};

/* ── NotificationsPanel ─────────────────────────────────── */
interface Props {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onNotificationClick?: (notification: AppNotification) => void;
}

export const NotificationsPanel = ({
  notifications,
  unreadCount,
  loading,
  onMarkAsRead,
  onMarkAllRead,
  onDelete,
  onClose,
  onNotificationClick,
}: Props) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const unread = notifications.filter(n => !n.is_read);
  const read = notifications.filter(n => n.is_read);

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-[calc(100%+10px)] w-[380px] bg-white rounded-3xl border border-border-light shadow-[0_12px_48px_rgba(0,0,0,0.12)] z-50 overflow-hidden"
      style={{ animation: 'modalIn 0.18s cubic-bezier(0.34,1.56,0.64,1)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-light/50">
        <div className="flex items-center gap-2">
          <span className="text-[16px] font-extrabold text-text-main">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-brand text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-[12px] font-bold text-brand hover:text-brand-dark transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Body */}
      <div className="max-h-[420px] overflow-y-auto">
        {loading ? (
          <div className="py-12 text-center">
            <div className="text-brand font-extrabold text-[18px] animate-pulse tracking-tighter">Sprintly</div>
            <div className="text-text-3 text-[13px] font-medium mt-2">Loading...</div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center px-6">
            <div className="w-14 h-14 bg-brand-light rounded-2xl flex items-center justify-center mx-auto mb-4 text-brand">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
            </div>
            <div className="text-[15px] font-bold text-text-main mb-1">All caught up!</div>
            <div className="text-[13px] text-text-3 font-medium">No notifications yet. Actions like task assignments will appear here.</div>
          </div>
        ) : (
          <>
            {unread.length > 0 && (
              <div>
                <div className="px-5 pt-3 pb-1 text-[11px] font-bold text-text-3 uppercase tracking-widest">New</div>
                {unread.map(n => (
                  <NotificationItem key={n.id} notification={n} onRead={onMarkAsRead} onDelete={onDelete} onClick={onNotificationClick} />
                ))}
              </div>
            )}
            {read.length > 0 && (
              <div>
                {unread.length > 0 && <div className="border-t border-border-light/50 mt-1" />}
                <div className="px-5 pt-3 pb-1 text-[11px] font-bold text-text-3 uppercase tracking-widest">Earlier</div>
                {read.map(n => (
                  <NotificationItem key={n.id} notification={n} onRead={onMarkAsRead} onDelete={onDelete} onClick={onNotificationClick} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
