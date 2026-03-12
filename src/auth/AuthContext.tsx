import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  signInAnonymously,
  signInWithPopup,
  linkWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';

interface AuthContextValue {
  user: User | null;
  idToken: string | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInAnonymous: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Link current anonymous user to a Google account; preserves UID. */
  linkWithGoogle: () => Promise<void>;
  /** Get ID token for backend. Pass true to force refresh (recommended when sending to server). */
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const token = await u.getIdToken();
        setIdToken(token);
      } else {
        setIdToken(null);
      }
      setLoading(false);
    });
  }, []);

  const signIn = useCallback(async () => {
    await signInWithPopup(auth, new GoogleAuthProvider());
  }, []);

  const signInAnonymous = useCallback(async () => {
    await signInAnonymously(auth);
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  const linkWithGoogle = useCallback(async () => {
    const u = auth.currentUser;
    if (!u || !u.isAnonymous) {
      throw new Error('Only anonymous users can link to Google');
    }
    try {
      await linkWithPopup(u, new GoogleAuthProvider());
    } catch (err: unknown) {
      const code = err && typeof err === 'object' && 'code' in err ? (err as { code: string }).code : '';
      if (code === 'auth/credential-already-in-use') {
        throw new Error('That Google account is already used. Sign out and sign in with Google to use it.');
      }
      if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was blocked or cancelled. Allow popups and try again.');
      }
      throw err instanceof Error ? err : new Error('Could not link to Google account');
    }
  }, []);

  const getIdToken = useCallback(async (forceRefresh = false) => {
    const u = auth.currentUser;
    if (!u) return null;
    return u.getIdToken(forceRefresh);
  }, []);

  const value: AuthContextValue = {
    user,
    idToken,
    loading,
    signIn,
    signInAnonymous,
    signOut,
    linkWithGoogle,
    getIdToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
