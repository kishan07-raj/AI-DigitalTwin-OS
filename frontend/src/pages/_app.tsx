import { useEffect, useState } from 'react';
import type { AppProps } from 'next/app';
import { useSocketInit } from '../hooks/useSocketInit';
import { useStore } from '../store';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import '../styles/globals.css';

function AuthLoader({ children }: { children: React.ReactNode }) {
  const { authLoading, isAuthenticated, token } = useAuth();
  const { initializeTheme } = useStore();
  const [mounted, setMounted] = useState(false);
  
  // Initialize socket connection
  useSocketInit();
  
  // Initialize theme on mount
  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);
  
  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Show loading screen while:
  // 1. App is not mounted (hydration)
  // 2. Auth is still loading (checking token validity)
  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            AI-DigitalTwin
          </h1>
          <p className="text-gray-400 mt-2">Loading your workspace...</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}

function AppContent({ Component, pageProps }: AppProps) {
  return (
    <AuthLoader>
      <Component {...pageProps} />
    </AuthLoader>
  );
}

export default function App(props: AppProps) {
  return (
    <AuthProvider>
      <AppContent {...props} />
    </AuthProvider>
  );
}

