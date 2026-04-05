import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  onboardingComplete: boolean;
  onboardingLoading: boolean;
  signOut: () => Promise<void>;
  checkOnboardingStatus: (userId?: string) => Promise<boolean>;
  setOnboardingComplete: (complete: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  onboardingComplete: false,
  onboardingLoading: true,
  signOut: async () => {},
  checkOnboardingStatus: async () => false,
  setOnboardingComplete: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [onboardingLoading, setOnboardingLoading] = useState(false);

  const checkOnboardingStatus = async (userId?: string) => {
    const id = userId || user?.id;
    if (!id) {
      setOnboardingComplete(false);
      setOnboardingLoading(false);
      return false;
    }

    setOnboardingLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, age, diabetes_type')
        .eq('id', id)
        .single();

      if (error || !data) {
        setOnboardingComplete(false);
        return false;
      }

      const isComplete = Boolean(data.full_name && data.age && data.diabetes_type);
      setOnboardingComplete(isComplete);
      return isComplete;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setOnboardingComplete(false);
      return false;
    } finally {
      setOnboardingLoading(false);
    }
  };

  useEffect(() => {
    const failSafeTimer = setTimeout(() => {
      setLoading(false);
      setOnboardingLoading(false);
    }, 8000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            await checkOnboardingStatus(session.user.id);
          } else {
            setOnboardingComplete(false);
            setOnboardingLoading(false);
          }
        } finally {
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await checkOnboardingStatus(session.user.id);
        } else {
          setOnboardingComplete(false);
          setOnboardingLoading(false);
        }
      } finally {
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(failSafeTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        onboardingComplete,
        onboardingLoading,
        signOut,
        checkOnboardingStatus,
        setOnboardingComplete,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
