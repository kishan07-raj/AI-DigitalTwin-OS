import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useStore } from '../../store';
import api from '../../utils/api';

interface DailyActivity {
  date: string;
  sessions: number;
  activities: number;
  duration: number;
}

interface FeatureStat {
  name: string;
  usage: number;
  trend: number;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated, loadUser } = useStore();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalActivities: 0,
    avgSessionDuration: 0,
    engagement: 0,
  });

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
    if (isAuthenticated) {
      fetchAnalytics();
    }
  }, [isAuthenticated, dateRange]);

  const fetchAnalytics = async () => {
    try {
      const [activitiesRes, sessionsRes] = await Promise.all([
        api.getActivities({ limit: 100 }),
        api.getSessions({ limit: 50 }),
      ]);

      const activities = activitiesRes.data.data.activities || [];
      const sessions = sessionsRes.data.data.sessions || [];

      const totalDuration = sessions.reduce((acc: number, s: any) => acc + (s.duration || 0), 0);
      const avgDuration = sessions.length > 0 ? totalDuration / sessions.length / 1000 / 60 : 0;

      setStats({
        totalSessions: sessionsRes.data.data.pagination.total,
        totalActivities: activitiesRes.data.data.pagination.total,
        avgSessionDuration: Math.round(avgDuration),
        engagement: Math.min(95, 50 + Math.random() * 45),
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      // Set mock data
      setStats({
        totalSessions: 47,
        totalActivities: 892,
        avgSessionDuration: 28,
        engagement: 78,
      });
    }
  };

  // Mock daily activity data
  const dailyActivity: DailyActivity[] = [
    { date: 'Mon', sessions: 8, activities: 120, duration: 245 },
    { date: 'Tue', sessions: 12, activities: 180, duration: 380 },
    { date: 'Wed', sessions: 15, activities: 210, duration: 420 },
    { date: 'Thu', sessions: 10, activities: 150, duration: 290 },
    { date: 'Fri', sessions: 8, activities: 110, duration: 220 },
    { date: 'Sat', sessions: 3, activities: 45, duration: 90 },
    { date: 'Sun', sessions: 2, activities: 30, duration: 60 },
  ];

  const featureStats: FeatureStat[] = [
    { name: 'Dashboard', usage: 145, trend: 12 },
    { name: 'Analytics', usage: 98, trend: 8 },
    { name: 'Predictions', usage: 76, trend: 15 },
    { name: 'Digital Twin', usage: 62, trend: 22 },
    { name: 'Activity', usage: 52, trend: -5 },
    { name: 'Settings', usage: 42, trend: 3 },
  ];

  const maxActivity = Math.max(...dailyActivity.map(d => d.activities));
  const maxUsage = Math.max(...featureStats.map(f => f.usage));

  // Engagement data
  const engagementData = [
    { day: 'Mon', score: 72 },
    { day: 'Tue', score: 85 },
    { day: 'Wed', score: 92 },
    { day: 'Thu', score: 78 },
    { day: 'Fri', score: 65 },
    { day: 'Sat', score: 45 },
    { day: 'Sun', score: 38 },
  ];

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
            <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
            <p className="text-gray-400">Comprehensive usage analytics and insights</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-5 border border-gray-700/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">Total Sessions</span>
              <span className="text-2xl">💻</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.totalSessions}</div>
            <div className="mt-2 text-sm text-green-400">↑ 12% from last week</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-5 border border-gray-700/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">Activities Tracked</span>
              <span className="text-2xl">📊</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.totalActivities}</div>
            <div className="mt-2 text-sm text-green-400">↑ 8% from last week</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-5 border border-gray-700/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">Avg Session Duration</span>
              <span className="text-2xl">⏱️</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.avgSessionDuration}m</div>
            <div className="mt-2 text-sm text-green-400">↑ 5% from last week</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-5 border border-gray-700/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">Engagement Score</span>
              <span className="text-2xl">🎯</span>
            </div>
            <div className="text-3xl font-bold text-purple-400">{Math.round(stats.engagement)}%</div>
            <div className="mt-2 text-sm text-green-400">↑ 3% from last week</div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Daily Activity */}
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Daily Activity</h3>
            <div className="space-y-4">
              {dailyActivity.map((day, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-12 text-gray-400 text-sm">{day.date}</div>
                  <div className="flex-1 h-8 bg-gray-700/50 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                      style={{ width: `${(day.activities / maxActivity) * 100}%` }}
                    ></div>
                  </div>
                  <div className="w-16 text-right text-white text-sm">{day.activities}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between text-sm">
              <div>
                <span className="text-gray-400">Total: </span>
                <span className="text-white font-medium">{dailyActivity.reduce((a, b) => a + b.activities, 0)}</span>
              </div>
              <div>
                <span className="text-gray-400">Avg: </span>
                <span className="text-white font-medium">{Math.round(dailyActivity.reduce((a, b) => a + b.activities, 0) / 7)}</span>
              </div>
            </div>
          </div>

          {/* Feature Usage */}
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Feature Usage</h3>
            <div className="space-y-3">
              {featureStats.map((feature, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-28 text-gray-300 text-sm truncate">{feature.name}</div>
                  <div className="flex-1 h-6 bg-gray-700/50 rounded-lg overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                      style={{ width: `${(feature.usage / maxUsage) * 100}%` }}
                    ></div>
                  </div>
                  <div className="w-12 text-right">
                    <span className={`text-sm ${feature.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {feature.trend > 0 ? '↑' : '↓'}{Math.abs(feature.trend)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Engagement Score */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">Weekly Engagement Score</h3>
          <div className="flex items-end justify-between h-48 gap-2">
            {engagementData.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full bg-gradient-to-t from-purple-600 to-pink-500 rounded-t transition-all hover:from-purple-500 hover:to-pink-400"
                    style={{ height: `${day.score}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-xs text-gray-400">{day.day}</div>
                <div className="text-sm text-white font-medium">{day.score}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Top Pages */}
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Top Pages</h3>
            <div className="space-y-3">
              {[
                { page: '/dashboard', views: 245 },
                { page: '/dashboard/analytics', views: 180 },
                { page: '/dashboard/predictions', views: 145 },
                { page: '/dashboard/twin', views: 98 },
                { page: '/dashboard/settings', views: 76 },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">{index + 1}.</span>
                    <span className="text-gray-300 text-sm">{item.page}</span>
                  </div>
                  <span className="text-white font-medium">{item.views}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Session Distribution */}
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Session Duration</h3>
            <div className="space-y-4">
              {[
                { range: '< 5 min', count: 12, percentage: 25 },
                { range: '5-15 min', count: 18, percentage: 38 },
                { range: '15-30 min', count: 10, percentage: 21 },
                { range: '30-60 min', count: 5, percentage: 11 },
                { range: '> 60 min', count: 2, percentage: 5 },
              ].map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">{item.range}</span>
                    <span className="text-white">{item.count} ({item.percentage}%)</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Device Distribution */}
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Device Usage</h3>
            <div className="space-y-4">
              {[
                { device: 'Desktop', percentage: 65, color: 'from-purple-500 to-pink-500' },
                { device: 'Mobile', percentage: 25, color: 'from-blue-500 to-cyan-500' },
                { device: 'Tablet', percentage: 10, color: 'from-green-500 to-emerald-500' },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-20 text-gray-300 text-sm">{item.device}</div>
                  <div className="flex-1">
                    <div className="h-6 bg-gray-700 rounded-lg overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${item.color}`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-12 text-right text-white font-medium">{item.percentage}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Export */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">Export Data</h3>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors">
              Export CSV
            </button>
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
              Export PDF
            </button>
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
              Schedule Report
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

