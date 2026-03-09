import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute component
 * Ensures that only authenticated users can access the wrapped content
 * Shows loading screen while checking authentication
 * Redirects to login only after auth check is complete and user is not authenticated
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, authLoading, token } = useAuth();

  useEffect(() => {
    // Only redirect after auth loading is complete
    if (!authLoading && !isAuthenticated && !token) {
      // Save the intended destination
      const returnUrl = router.asPath;
      router.push(`/login?redirectedFrom=${encodeURIComponent(returnUrl)}`);
    }
  }, [authLoading, isAuthenticated, token, router]);

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated and no token, redirect is handled in useEffect
  if (!isAuthenticated && !token) {
    return null;
  }

  return <>{children}</>;
}

