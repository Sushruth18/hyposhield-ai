import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, onboardingComplete, onboardingLoading } = useAuth();
  const location = useLocation();

  // Show loading while checking auth
  if (loading || onboardingLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // On onboarding page - allow access
  if (location.pathname === '/onboarding') {
    return <>{children}</>;
  }

  // Onboarding not complete - redirect to onboarding
  if (!onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  // Can access protected routes
  return <>{children}</>;
}
