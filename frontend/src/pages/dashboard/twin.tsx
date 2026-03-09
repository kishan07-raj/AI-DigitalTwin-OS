import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useStore } from '../../store';
import api from '../../utils/api';

interface TwinProfile {
  createdAt: string;
  lastActive: string;
  behaviorProfile: Record<string, any>;
  accuracy?: number;
}

interface FeatureUsage {
  name: string;
  count: number;
  percentage: number;
}

interface TimePattern {
  hour: number;
  count: number;
}

export default function TwinPage() {
  const router = useRouter();
  const { user, isAuthenticated, loadUser } = useStore();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<TwinProfile | null>(null);

  useEffect(() => {
    const init = async () => {
      await loadUser();
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && user) {
      setProfile(user.digitalTwin as any);
    }
  }, [isAuthenticated, user]);

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.85) return 'text-green-400';
    if (accuracy >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getAccuracyBg = (accuracy: number) => {
    if (accuracy >= 0.85) return 'from-green-500 to-emerald-500';
    if (accuracy >= 0.6) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  // Mock data for visualization
  const featureUsage: FeatureUsage[] = [
    { name: 'Dashboard', count: 145, percentage: 35 },
    { name: 'Analytics', count: 98, percentage: 24 },
    { name: 'Predictions', count: 76, percentage: 18 },
    { name: 'Activity', count: 52, percentage: 13 },
    { name: 'Settings', count: 42, percentage: 10 },
  ];

  const timePatterns: TimePattern[] = [
    { hour: 0, count: 5 }, { hour: 1, count: 2 }, { hour: 2, count: 1 },
    { hour: 3, count: 1 }, { hour: 4, count: 2 }, { hour: 5, count: 3 },
    { hour: 6, count: 8 }, { hour: 7, count: 15 }, { hour: 8, count: 25 },
    { hour: 9, count: 35 }, { hour: 10, count: 42 }, { hour: 11, count: 38 },
    { hour: 12, count: 30 }, { hour: 13, count: 35 }, { hour: 14, count: 40 },
    { hour: 15, count: 45 }, { hour: 16, count: 38 }, { hour: 17, count: 30 },
    { hour: 18, count: 25 }, { hour: 19, count: 20 }, { hour: 20, count: 18 },
    { hour: 21, count: 15 }, { hour: 22, count: 10 }, { hour: 23, count: 7 },
  ];

  const peakHours = timePatterns
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(h => `${h.hour}:00`);

  const sessionPatterns = [
    { day: 'Monday', sessions: 12, avgDuration: 28 },
    { day: 'Tuesday', sessions: 15, avgDuration: 32 },
    { day: 'Wednesday', sessions: 18, avgDuration: 35 },
    { day: 'Thursday', sessions: 14, avgDuration: 30 },
    { day: 'Friday', sessions: 10, avgDuration: 25 },
    { day: 'Saturday', sessions: 5, avgDuration: 20 },
    { day: 'Sunday', sessions: 4, avgDuration: 18 },
  ];

  const maxTimeCount = Math.max(...timePatterns.map(t => t.count));

  const twinAccuracy = profile?.behaviorProfile?.positiveFeedback 
    ? Math.min(0.95, 0.5 + (profile.behaviorProfile.positiveFeedback / 100))
    : 0.82;

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Digital Twin Profile</h1>
            <p className="text-gray-400">Your AI-powered behavioral profile</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-green-400 text-sm">Learning Active</span>
          </div>
        </div>

        {/* Twin Overview Card */}
        <div className="bg-gradient-to-r from-purple-900/50 via-pink-900/50 to-gray-900/50 rounded-2xl p-6 border border-purple-500/20">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${getAccuracyBg(twinAccuracy)} flex items-center justify-center`}>
              <div className="w-24 h-24 rounded-full bg-gray-900/80 flex items-center justify-center">
                <span className="text-3xl font-bold text-white">{Math.round(twinAccuracy * 100)}%</span>
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-white mb-2">Twin Accuracy</h2>
              <p className="text-gray-400 mb-4">
                Your digital twin has learned {profile?.behaviorProfile?.positiveFeedback || 32} behavioral patterns 
                and is {Math.round(twinAccuracy * 100)}% accurate in predicting your next actions.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <div className="px-4 py-2 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400 text-sm">Created</span>
                  <p className="text-white font-medium">
                    {profile?.createdAt 
                      ? new Date(profile.createdAt).toLocaleDateString() 
                      : new Date().toLocaleDateString()}
                  </p>
                </div>
                <div className="px-4 py-2 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400 text-sm">Last Active</span>
                  <p className="text-white font-medium">
                    {profile?.lastActive 
                      ? new Date(profile.lastActive).toLocaleString() 
                      : 'Just now'}
                  </p>
                </div>
                <div className="px-4 py-2 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400 text-sm">Pattern Count</span>
                  <p className="text-white font-medium">{profile?.behaviorProfile?.positiveFeedback || 32}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Usage */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <span className="mr-2">📊</span> Feature Usage
            </h3>
            <div className="space-y-4">
              {featureUsage.map((feature, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">{feature.name}</span>
                    <span className="text-gray-400">{feature.count} uses ({feature.percentage}%)</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                      style={{ width: `${feature.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Time Patterns */}
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <span className="mr-2">⏰</span> Active Hours
            </h3>
            <div className="h-40 flex items-end justify-between gap-1">
              {timePatterns.map((time, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-gradient-to-t from-purple-500 to-pink-500 rounded-t transition-all hover:from-purple-400 hover:to-pink-400"
                    style={{ height: `${(time.count / maxTimeCount) * 100}%` }}
                    title={`${time.hour}:00 - ${time.count} sessions`}
                  ></div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>12AM</span>
              <span>6AM</span>
              <span>12PM</span>
              <span>6PM</span>
              <span>11PM</span>
            </div>
            <div className="mt-4 p-3 bg-gray-900/50 rounded-lg">
              <p className="text-sm text-gray-400">
                <span className="text-purple-400 font-medium">Peak Hours:</span>{' '}
                {peakHours.join(', ')}
              </p>
            </div>
          </div>
        </div>

        {/* Session Patterns */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <span className="mr-2">📅</span> Weekly Session Patterns
          </h3>
          <div className="grid grid-cols-7 gap-4">
            {sessionPatterns.map((day, index) => (
              <div key={index} className="text-center">
                <div className="text-xs text-gray-500 mb-2">{day.day.slice(0, 3)}</div>
                <div className="h-24 flex flex-col justify-end">
                  <div 
                    className="bg-gradient-to-t from-purple-600 to-pink-500 rounded-t mx-auto"
                    style={{ width: '80%', height: `${(day.sessions / 20) * 100}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-sm text-white font-medium">{day.sessions}</div>
                <div className="text-xs text-gray-500">{day.avgDuration}m</div>
              </div>
            ))}
          </div>
        </div>

        {/* Behavior Insights */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <span className="mr-2">💡</span> Behavior Insights
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
              <div className="text-2xl mb-2">🌅</div>
              <h4 className="text-white font-medium mb-1">Morning User</h4>
              <p className="text-sm text-gray-400">
                You're most active between 9 AM and 3 PM, with peak activity at 10 AM.
              </p>
            </div>
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <div className="text-2xl mb-2">📈</div>
              <h4 className="text-white font-medium mb-1">Power User</h4>
              <p className="text-sm text-gray-400">
                You have long sessions averaging 30+ minutes with high feature engagement.
              </p>
            </div>
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
              <div className="text-2xl mb-2">🎯</div>
              <h4 className="text-white font-medium mb-1">Goal Oriented</h4>
              <p className="text-sm text-gray-400">
                You typically start with Dashboard and move to Analytics for detailed insights.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">Twin Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors">
              Export Profile
            </button>
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
              Reset Learning
            </button>
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
              View History
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

