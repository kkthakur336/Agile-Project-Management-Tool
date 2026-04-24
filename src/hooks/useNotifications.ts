import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface AppNotification {
  id: string;
  user_id: string;
  type: 'task_assigned' | 'task_updated' | 'project_created' | 'invitation_received' | string;
  title: string;
  body: string | null;
  is_read: boolean;
  related_id: string | null;
  related_type: string | null;
  created_at: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Resolve current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch + subscribe once we have a userId
  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    let mounted = true;

    const fetchNotifications = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(40);
      if (mounted && data) setNotifications(data);
      if (mounted) setLoading(false);
    };

    fetchNotifications();

    // Supabase Realtime — listen for new notifications for this user
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (mounted) {
            setNotifications(prev => [payload.new as AppNotification, ...prev]);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (mounted) {
            setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new as AppNotification : n));
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    if (userId) {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
    }
  }, [userId]);

  const deleteNotification = useCallback(async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    await supabase.from('notifications').delete().eq('id', id);
  }, []);

  return { notifications, unreadCount, loading, markAsRead, markAllRead, deleteNotification };
};

/** Format a UTC ISO string as a human-readable time-ago string */
export const timeAgo = (iso: string): string => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
