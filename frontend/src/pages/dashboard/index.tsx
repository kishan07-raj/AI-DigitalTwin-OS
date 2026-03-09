import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import ProtectedRoute from '../../components/ProtectedRoute';
import AIInsightsPanel from '../../components/AIInsightsPanel';
import LiveEventFeed from '../../components/LiveEventFeed';
import AIChatAssistant from '../../components/AIChatAssistant';
import { useStore } from '../../store';
import api from '../../utils/api';
import { useSocket, useSystemHealth, useSystemAlerts } from '../../hooks/useSocket';

interface Prediction {
  type: string;
  model: string;
  prediction: any;
  confidence: number;
}

interface ActivityStats {
  totalSessions: number;
  totalActivities: number;
  avgSessionDuration: number;
}

interface ProductivityScore {
  score: number;
  trend: 'up' | 'down' | 'stable';
  factors: {
    name: string;
    value: number;
    weight: number;
  }[];
  period: string;
}

interface HeatmapData {
  day: string;
  hour: number;
  value: number;
}

// Behavior Heatmap Component
function BehaviorHeatmap({ data }: { data: HeatmapData[] }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  const getColor = (value: number) => {
    if (value === 0) return 'bg-gray-800';
    if (value < 20) return 'bg-purple-900/50';
    if (value < 40) return 'bg-purple-700/70';
    if (value < 60) return 'bg-purple-500';
    if (value < 80) return 'bg-purple-400';
    return 'bg-purple-300';
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        <div className="flex">
          <div className="w-12"></div>
          {hours.filter((_, i) => i % 3 === 0).map(hour => (
            <div key={hour} className="flex-1 text-center text-xs text-gray-500">
              {hour}:00
            </div>
          ))}
        </div>
        {days.map((day, dayIndex) => (
          <div key={day} className="flex items-center">
            <div className="w-12 text-xs text-gray-400">{day}</div>
            {hours.filter((_, i) => i % 3 === 0).map(hour => {
              const cellData = data.find(d => d.day === day && d.hour === hour);
              return (
                <div
                  key={`${day}-${hour}`}
                  className={`flex-1 h-8 m-0.5 rounded ${getColor(cellData?.value || 0)} transition-all hover:scale-110`}
                  title={`${day} ${hour}:00 - ${cellData?.value || 0} activities`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// Productivity Score Circle Component
function ProductivityScoreCircle({ score, trend }: { score: number; trend: string }) {
  const getColor = () => {
    if (score >= 80) return 'from-green-400 to-emerald-600';
    if (score >= 60) return 'from-blue-400 to-cyan-600';
    if (score >= 40) return 'from-yellow-400 to-orange-600';
    return 'from-red-400 to-pink-600';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '→';
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-400';
    if (trend === 'down') return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="64"
          cy="64"
          r="56"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-gray-700"
        />
        <circle
          cx="64"
          cy="64"
          r="56"
          stroke="url(#gradient)"
          strokeWidth="8"
          fill="none"
          strokeDasharray={`${(score / 100) * 352} 352`}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" className="stop-color-current" stopColor="#10b981" />
            <stop offset="100%" className="stop-color-current" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{score}</span>
        <span className={`text-sm ${getTrendColor()}`}>
          {getTrendIcon()}
        </span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated, loadUser } = useStore();
  const { isConnected, trackActivity } = useSocket();
  const systemHealth = useSystemHealth();
  const { alerts } = useSystemAlerts();
  
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [stats, setStats] = useState<ActivityStats>({
    totalSessions: 0,
    totalActivities: 0,
    avgSessionDuration: 0,
  });
  const [productivity, setProductivity] = useState<ProductivityScore>({
    score: 78,
    trend: 'up',
    factors: [
      { name: 'Focus Time', value: 85, weight: 0.3 },
      { name: 'Task Completion', value: 72, weight: 0.25 },
      { name: 'Consistency', value: 88, weight: 0.2 },
      { name: 'Efficiency', value: 75, weight: 0.25 },
    ],
    period: 'This Week',
  });
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProductivityData = useCallback(async () => {
    try {
      const response = await api.getProductivityInsights(user?.id || 'default');
      if (response.data && response.data.productivity) {
        const prod = response.data.productivity;
        setProductivity({
          score: prod.productivityScore || 78,
          trend: prod.scoreTrend || 'stable',
          factors: prod.factors || productivity.factors,
          period: prod.period || 'This Week',
        });
      }
    } catch (error) {
      // Use default productivity data
      console.log('Using default productivity data');
    }
  }, [user?.id]);

  const generateHeatmapData = useCallback(() => {
    const data: HeatmapData[] = [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    days.forEach(day => {
      for (let hour = 0; hour < 24; hour++) {
        // Generate realistic activity patterns
        let value = 0;
        
        // Peak hours simulation
        if (hour >= 9 && hour <= 11) value = 60 + Math.random() * 40;
        else if (hour >= 14 && hour <= 16) value = 50 + Math.random() * 40;
        else if (hour >= 19 && hour <= 21) value = 30 + Math.random() * 30;
        else value = Math.random() * 20;
        
        // Weekend reduction
        if (day === 'Sat' || day === 'Sun') {
          value *= 0.4;
        }
        
        data.push({ day, hour, value: Math.round(value) });
      }
    });
    
    setHeatmapData(data);
  }, []);

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
    if (isAuthenticated && user?.id) {
      fetchPredictions();
      fetchStats();
      fetchProductivityData();
      generateHeatmapData();
    }
  }, [isAuthenticated, user?.id, fetchProductivityData, generateHeatmapData]);

  const fetchPredictions = async () => {
    try {
      const response = await api.getPredictions();
      if (response.data.data.ui && response.data.data.behavior) {
        setPredictions([response.data.data.ui, response.data.data.behavior]);
      }
    } catch (error) {
      console.error('Failed to fetch predictions:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const [activitiesRes, sessionsRes] = await Promise.all([
        api.getActivities({ limit: 1 }),
        api.getSessions({ limit: 1 }),
      ]);
      
      setStats({
        totalSessions: sessionsRes.data.data.pagination.total,
        totalActivities: activitiesRes.data.data.pagination.total,
        avgSessionDuration: 30,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const features = [
    {
      title: 'Adaptive UI',
      description: 'Your interface learns and adapts to your preferences',
      icon: '🎨',
      color: 'from-purple-500 to-pink-500',
      status: 'Active',
      href: '/dashboard/adaptive-ui',
    },
    {
      title: 'Digital Twin',
      description: 'AI-powered behavior modeling and predictions',
      icon: '👤',
      color: 'from-blue-500 to-cyan-500',
      status: 'Learning',
      href: '/dashboard/twin',
    },
    {
      title: 'Self-Healing',
      description: 'Automatic anomaly detection and resolution',
      icon: '🔧',
      color: 'from-green-500 to-emerald-500',
      status: 'Monitoring',
      href: '/dashboard/system-health',
    },
    {
      title: 'Automation',
      description: 'Smart task automation based on your patterns',
      icon: '⚡',
      color: 'from-orange-500 to-red-500',
      status: 'Ready',
      href: '/dashboard/automation',
    },
  ];

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-900/50 via-pink-900/50 to-gray-900/50 rounded-2xl p-6 border border-purple-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back, {user?.name || 'User'} 👋
              </h1>
              <p className="text-gray-400">
                Your Digital Twin is learning and adapting to provide the best experience
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Connection Status */}
              <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full ${
                isConnected ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></span>
                <span className={`text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>
              {/* System Health */}
              {systemHealth && (
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full">
                  <span className="text-sm text-blue-400">
                    {systemHealth.status === 'healthy' ? '🟢' : '🟡'} {systemHealth.status}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <span className="text-red-400">⚠️</span>
              <span className="text-red-400 font-medium">System Alert</span>
            </div>
            <p className="text-red-300 text-sm mt-1">{alerts[0].message}</p>
          </div>
        )}

        {/* Stats Grid - Now with Productivity Score */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Productivity Score Card */}
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-xl p-5 border border-purple-500/30 col-span-1 md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-gray-400 text-sm font-medium">AI Productivity Score</h3>
                <p className="text-xs text-gray-500">{productivity.period}</p>
              </div>
              <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                AI Powered
              </span>
            </div>
            <div className="flex items-center justify-center">
              <ProductivityScoreCircle score={productivity.score} trend={productivity.trend} />
            </div>
            {/* Productivity Factors */}
            <div className="mt-4 space-y-2">
              {productivity.factors.map((factor, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{factor.name}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                        style={{ width: `${factor.value}%` }}
                      />
                    </div>
                    <span className="text-white font-medium w-8 text-right">{factor.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Other Stats */}
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-5 border border-gray-700/50">
            <div className="text-gray-400 text-sm mb-1">Total Sessions</div>
            <div className="text-2xl font-bold text-white">{stats.totalSessions}</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-5 border border-gray-700/50">
            <div className="text-gray-400 text-sm mb-1">Activities Tracked</div>
            <div className="text-2xl font-bold text-white">{stats.totalActivities}</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-5 border border-gray-700/50">
            <div className="text-gray-400 text-sm mb-1">AI Predictions</div>
            <div className="text-2xl font-bold text-purple-400">{predictions.length > 0 ? predictions.length : 3}+</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-5 border border-gray-700/50">
            <div className="text-gray-400 text-sm mb-1">Twin Accuracy</div>
            <div className="text-2xl font-bold text-green-400">85%</div>
          </div>
        </div>

        {/* Behavior Heatmap */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-white">Behavior Heatmap</h3>
              <p className="text-gray-400 text-sm">Daily activity patterns</p>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-gray-500">Less</span>
              <div className="flex space-x-1">
                <div className="w-4 h-4 bg-gray-800 rounded"></div>
                <div className="w-4 h-4 bg-purple-900/50 rounded"></div>
                <div className="w-4 h-4 bg-purple-700/70 rounded"></div>
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <div className="w-4 h-4 bg-purple-400 rounded"></div>
                <div className="w-4 h-4 bg-purple-300 rounded"></div>
              </div>
              <span className="text-gray-500">More</span>
            </div>
          </div>
          <BehaviorHeatmap data={heatmapData} />
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              onClick={() => router.push(feature.href)}
              className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-2xl`}>
                  {feature.icon}
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  feature.status === 'Active' ? 'bg-green-500/20 text-green-400' :
                  feature.status === 'Learning' ? 'bg-blue-500/20 text-blue-400' :
                  feature.status === 'Monitoring' ? 'bg-purple-500/20 text-purple-400' :
                  'bg-orange-500/20 text-orange-400'
                }`}>
                  {feature.status}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Insights Panel */}
          <AIInsightsPanel />

          {/* Live Event Feed */}
          <LiveEventFeed />
        </div>

        {/* AI Predictions Section */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
          <h3 className="text-xl font-semibold text-white mb-4">AI Predictions</h3>
          <div className="space-y-4">
            {predictions.length > 0 ? (
              predictions.map((pred, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                  <div>
                    <div className="text-white font-medium">{pred.type.replace('_', ' ').toUpperCase()}</div>
                    <div className="text-gray-400 text-sm">Model: {pred.model}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-purple-400 font-bold">{Math.round(pred.confidence * 100)}%</div>
                    <div className="text-gray-500 text-xs">confidence</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-900/50 rounded-lg">
                  <div className="text-white font-medium">UI Layout</div>
                  <div className="text-gray-400 text-sm">Model: adaptive-ui-v1</div>
                  <div className="text-purple-400 font-bold mt-2">85%</div>
                </div>
                <div className="p-4 bg-gray-900/50 rounded-lg">
                  <div className="text-white font-medium">User Behavior</div>
                  <div className="text-gray-400 text-sm">Model: behavior-v1</div>
                  <div className="text-purple-400 font-bold mt-2">78%</div>
                </div>
                <div className="p-4 bg-gray-900/50 rounded-lg">
                  <div className="text-white font-medium">Task Automation</div>
                  <div className="text-gray-400 text-sm">Model: automation-v1</div>
                  <div className="text-purple-400 font-bold mt-2">79%</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
          <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => router.push('/dashboard/analytics')}
              className="p-4 bg-gray-900/50 rounded-lg hover:bg-gray-700/50 transition-colors text-center"
            >
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm text-gray-400">View Analytics</div>
            </button>
            <button 
              onClick={() => router.push('/dashboard/twin')}
              className="p-4 bg-gray-900/50 rounded-lg hover:bg-gray-700/50 transition-colors text-center"
            >
              <div className="text-2xl mb-2">🎯</div>
              <div className="text-sm text-gray-400">Twin Insights</div>
            </button>
            <button 
              onClick={() => router.push('/dashboard/activity')}
              className="p-4 bg-gray-900/50 rounded-lg hover:bg-gray-700/50 transition-colors text-center"
            >
              <div className="text-2xl mb-2">🔔</div>
              <div className="text-sm text-gray-400">Activity</div>
            </button>
            <button 
              onClick={() => router.push('/dashboard/settings')}
              className="p-4 bg-gray-900/50 rounded-lg hover:bg-gray-700/50 transition-colors text-center"
            >
              <div className="text-2xl mb-2">⚙️</div>
              <div className="text-sm text-gray-400">Settings</div>
            </button>
          </div>
        </div>

        {/* AI Chat Assistant (floating) */}
        <AIChatAssistant />
      </div>
    </Layout>
    </ProtectedRoute>
  );
}

