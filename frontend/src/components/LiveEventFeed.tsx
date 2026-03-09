/**
 * Live Event Feed Component
 * Displays real-time activity updates
 */

import { useEffect, useState } from 'react';
import { useActivityUpdates } from '../hooks/useSocket';

interface ActivityEvent {
  type: string;
  element: string;
  page: string;
  timestamp: string;
  simulated?: boolean;
}

export default function LiveEventFeed() {
  const { activities, clearActivities } = useActivityUpdates();
  const [isPaused, setIsPaused] = useState(false);
  const [displayedActivities, setDisplayedActivities] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    if (!isPaused) {
      setDisplayedActivities(activities);
    }
  }, [activities, isPaused]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'click': return '👆';
      case 'navigation': return '➡️';
      case 'scroll': return '📜';
      case 'typing': return '⌨️';
      default: return '📌';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'click': return 'bg-blue-500/20 border-blue-500/30';
      case 'navigation': return 'bg-green-500/20 border-green-500/30';
      case 'scroll': return 'bg-purple-500/20 border-purple-500/30';
      case 'typing': return 'bg-orange-500/20 border-orange-500/30';
      default: return 'bg-gray-500/20 border-gray-500/30';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-4 border border-gray-700/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></span>
            <h3 className="text-lg font-semibold text-white">Live Activity</h3>
          </div>
          <span className="text-xs text-gray-500">({displayedActivities.length} events)</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
              isPaused 
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                : 'bg-gray-700/50 text-gray-400 hover:text-white'
            }`}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={clearActivities}
            className="px-3 py-1 text-xs bg-gray-700/50 text-gray-400 hover:text-white rounded-lg transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {displayedActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <span className="text-3xl mb-2 block">🔄</span>
            <p className="text-sm">Waiting for activity...</p>
          </div>
        ) : (
          displayedActivities.slice(0, 20).map((activity, index) => (
            <div
              key={`${activity.timestamp}-${index}`}
              className={`p-3 rounded-lg border ${getActivityColor(activity.type)} flex items-center justify-between`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{getActivityIcon(activity.type)}</span>
                <div>
                  <p className="text-white text-sm font-medium capitalize">{activity.type}</p>
                  <p className="text-gray-400 text-xs">
                    {activity.element} • {activity.page}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-xs">{formatTime(activity.timestamp)}</p>
                {activity.simulated && (
                  <span className="text-xs text-purple-400">Simulated</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isPaused && displayedActivities.length > 0 && (
        <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center">
          <p className="text-yellow-400 text-sm">Feed paused - {displayedActivities.length} new events waiting</p>
        </div>
      )}
    </div>
  );
}

