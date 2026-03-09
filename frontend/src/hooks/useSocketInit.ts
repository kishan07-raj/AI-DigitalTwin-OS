/**
 * useSocketInit Hook
 * Initializes socket connection when user is authenticated
 */

import { useEffect } from 'react';
import { useStore } from '../store';
import { socketService } from '../utils/socket';

export function useSocketInit() {
  const { isAuthenticated, token, user } = useStore();

  useEffect(() => {
    if (isAuthenticated && token) {
      // Initialize socket connection
      const socket = socketService.connect(token);
      
      // Authenticate with user ID
      if (user?.id) {
        socketService.authenticate(user.id);
      }

      // Cleanup on unmount
      return () => {
        // Don't disconnect on unmount, keep connection alive
      };
    } else {
      // Disconnect when logged out
      socketService.disconnect();
    }
  }, [isAuthenticated, token, user?.id]);
}

export default useSocketInit;

