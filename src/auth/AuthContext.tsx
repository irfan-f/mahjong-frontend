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
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';
import { MOCK_USER_ID } from '../api/mock';

const useMockApi =
  typeof import.meta.env.VITE_USE_MOCK_API !== 'undefined' &&
  import.meta.env.VITE_USE_MOCK_API !== '';

const mockUser: User = {
  uid: MOCK_USER_ID,
  email: null,
  emailVerified: false,
  isAnonymous: true,
  metadata: {},
  providerData: [],
  refreshToken: '',
  tenantId: null,
  delete: () => Promise.resolve(),
  getIdToken: () => Promise.resolve('mock-token'),
  getIdTokenResult: () => Promise.resolve({} as never),
  reload: () => Promise.resolve(),
  toJSON: () => ({}),
  displayName: null,
  phoneNumber: null,
  photoURL: null,
  providerId: 'mock',
};

interface AuthContextValue {
  user: User | null;
  idToken: string | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInAnonymous: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Get ID token for backend. Pass true to force refresh (recommended when sending to server). */
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (useMockApi) {
      setUser(mockUser);
      setIdToken('mock-token');
      setLoading(false);
      return () => {};
    }
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

  const getIdToken = useCallback(async (forceRefresh = false) => {
    if (useMockApi) return 'mock-token';
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
    getIdToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
