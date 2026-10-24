import { useCallback, useEffect, useState } from 'react';
import type { AuthUser } from '@workspace/api-client-react';

export type { AuthUser };

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

function getBasePath() {
  return document.querySelector('meta[name="app-base-path"]')?.getAttribute('content') || '/';
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    // A network blip or a restarting server is not the same as being signed
    // out, so retry a few times before showing the signed-out screen.
    const load = (attempt: number) => {
      fetch('/api/auth/user', { credentials: 'include' })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json() as Promise<{ user: AuthUser | null }>;
        })
        .then((data) => {
          if (!cancelled) {
            setUser(data.user ?? null);
            setIsLoading(false);
          }
        })
        .catch(() => {
          if (cancelled) return;
          if (attempt < 3) {
            timer = setTimeout(() => load(attempt + 1), 800 * 2 ** attempt);
            return;
          }
          setUser(null);
          setIsLoading(false);
        });
    };
    load(0);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const login = useCallback(() => {
    const base = getBasePath();
    window.location.href = `/api/login?returnTo=${encodeURIComponent(base)}`;
  }, []);

  const logout = useCallback(() => {
    const base = getBasePath();
    // Unsaved onboarding drafts are tab-scoped; drop them on the way out.
    try {
      Object.keys(window.sessionStorage).filter((key) => key.startsWith('rolevo:')).forEach((key) => window.sessionStorage.removeItem(key));
    } catch { /* storage unavailable */ }
    void fetch(`/api/logout?returnTo=${encodeURIComponent(base)}`, { method: 'POST', credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error('Sign-out failed.');
        const data = await res.json() as { redirectTo: string };
        window.location.assign(data.redirectTo);
      }).catch(() => window.alert('Sign-out could not finish. Please try again.'));
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}
