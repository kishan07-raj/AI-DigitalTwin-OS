import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api';
import { Notification } from '../services/notification';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  preferences: {
    theme: 'light' | 'dark' | 'adaptive';
    language: string;
    notifications: boolean;
    adaptiveUI: boolean;
  };
  digitalTwin: {
    createdAt: string;
    lastActive: string;
    behaviorProfile: Record<string, any>;
  };
}

type Theme = 'light' | 'dark' | 'adaptive';

interface AppState {
  // Auth state
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authLoading: boolean; // Track initial auth loading state

  // UI state
  sidebarCollapsed: boolean;
  theme: Theme;
  actualTheme: 'light' | 'dark'; // The resolved theme (light or dark)

  // Notification state
  notifications: Notification[];
  unreadCount: number;
  isNotificationsOpen: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  loadUser: () => Promise<void>;
  setAuthLoading: (loading: boolean) => void;

  // UI Actions
  toggleSidebar: () => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  initializeTheme: () => void;

  // Notification Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  setUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  clearUnreadCount: () => void;
  setNotificationsOpen: (open: boolean) => void;
}

// Helper to get actual theme from preference
const getResolvedTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'adaptive') {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  }
  return theme;
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      authLoading: true, // Start with true, set to false after initial auth check
      sidebarCollapsed: false,
      theme: 'adaptive',
      actualTheme: 'dark',

      // Notification state
      notifications: [],
      unreadCount: 0,
      isNotificationsOpen: false,

      // Auth actions
      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await api.login({ email, password });
          
          // Handle both response formats: response.data.data or response.data
          const data = response.data.data || response.data;
          const user = data.user;
          const token = data.accessToken || data.token;
          const refreshToken = data.refreshToken;
          
          if (!token) {
            throw new Error('No token received from server');
          }
          
          // Store tokens via API client
          api.setToken(token, refreshToken);
          set({ user, token, isAuthenticated: true, isLoading: false, authLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (email: string, password: string, name: string) => {
        set({ isLoading: true });
        try {
          const response = await api.register({ email, password, name });
          
          // Handle both response formats: response.data.data or response.data
          const data = response.data.data || response.data;
          const user = data.user;
          const token = data.accessToken || data.token;
          const refreshToken = data.refreshToken;
          
          if (!token) {
            throw new Error('No token received from server');
          }
          
          // Store tokens via API client
          api.setToken(token, refreshToken);
          set({ user, token, isAuthenticated: true, isLoading: false, authLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        // Call logout API endpoint if authenticated
        const token = get().token;
        if (token) {
          api.logout().catch(() => {
            // Ignore logout API errors
          });
        }
        
        // Clear tokens
        api.removeToken();
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false,
          authLoading: false,
          notifications: [],
          unreadCount: 0,
        });
      },

      updateUser: (data: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...data } });
        }
      },

      loadUser: async () => {
        const token = get().token;
        if (!token) {
          // Check if API client has token
          const apiToken = api.getToken();
          if (!apiToken) {
            set({ authLoading: false });
            return;
          }
        }

        // Ensure API client has the token
        const storedToken = api.getToken();
        if (storedToken) {
          api.setToken(storedToken);
        }
        
        try {
          const response = await api.getMe();
          const user = response.data.data || response.data;
          set({ user, isAuthenticated: true, authLoading: false });
        } catch (error) {
          console.error('Failed to load user:', error);
          // Token is invalid, clear it
          get().logout();
        }
      },

      setAuthLoading: (loading: boolean) => {
        set({ authLoading: loading });
      },

      // UI actions
      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },

      setTheme: (theme: Theme) => {
        const actualTheme = getResolvedTheme(theme);
        set({ theme, actualTheme });
        
        // Update document class for Tailwind dark mode
        if (typeof window !== 'undefined') {
          if (actualTheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      },

      toggleTheme: () => {
        const currentActual = get().actualTheme;
        
        if (currentActual === 'dark') {
          get().setTheme('light');
        } else {
          get().setTheme('dark');
        }
      },

      initializeTheme: () => {
        const theme = get().theme;
        const actualTheme = getResolvedTheme(theme);
        set({ actualTheme });
        
        if (typeof window !== 'undefined') {
          if (actualTheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }

          // Listen for system theme changes
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          const handleChange = () => {
            if (get().theme === 'adaptive') {
              get().setTheme('adaptive');
            }
          };
          mediaQuery.addEventListener('change', handleChange);
        }
      },

      // Notification actions
      setNotifications: (notifications: Notification[]) => {
        set({ notifications });
      },

      addNotification: (notification: Notification) => {
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));
      },

      setUnreadCount: (count: number) => {
        set({ unreadCount: count });
      },

      incrementUnreadCount: () => {
        set((state) => ({ unreadCount: state.unreadCount + 1 }));
      },

      clearUnreadCount: () => {
        set({ unreadCount: 0 });
      },

      setNotificationsOpen: (open: boolean) => {
        set({ isNotificationsOpen: open });
      },
    }),
    {
      name: 'ai-digitaltwin-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
