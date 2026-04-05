import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Menu, X, LayoutDashboard, Brain, LineChart, Clock, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/predict', label: 'Predict', icon: Brain },
  { to: '/insights', label: 'Insights', icon: LineChart },
  { to: '/history', label: 'History', icon: Clock },
  { to: '/profile', label: 'Profile', icon: User },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    if (isSigningOut) return;

    try {
      setIsSigningOut(true);
      await signOut();
      navigate('/');
    } catch (error) {
      const description = error instanceof Error ? error.message : 'Unable to sign out right now.';
      toast({
        title: 'Sign out failed',
        description,
        variant: 'destructive',
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            <span className="text-lg font-bold text-gradient">HypoShield AI</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  location.pathname === to
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
            <button
              onClick={() => void handleSignOut()}
              disabled={isSigningOut}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors ml-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>

          <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden glass-strong border-t border-border">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  location.pathname === to
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
            <button
              onClick={async () => {
                await handleSignOut();
                setOpen(false);
              }}
              disabled={isSigningOut}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground w-full disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
