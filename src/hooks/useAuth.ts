import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ADMIN_EMAIL = 'kkthakur0110@gmail.com';

export interface AuthState {
  userId: string | null;
  email: string | null;
  isAdmin: boolean;
  loading: boolean;
}

export const useAuth = (): AuthState => {
  const [state, setState] = useState<AuthState>({
    userId: null,
    email: null,
    isAdmin: false,
    loading: true,
  });

  useEffect(() => {
    const resolveSession = (session: any) => {
      const email = session?.user?.email ?? null;
      setState({
        userId: session?.user?.id ?? null,
        email,
        isAdmin: email?.toLowerCase() === ADMIN_EMAIL.toLowerCase(),
        loading: false,
      });
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      resolveSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      resolveSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return state;
};
