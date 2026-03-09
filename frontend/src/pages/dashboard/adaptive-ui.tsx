import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useStore } from '../../store';
import api from '../../utils/api';
import { useSocket, useSocketEvent } from '../../hooks/useSocket';
import { motion } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

interface UIPreference {
  layout: string;
  theme: string;
  colorScheme: string;
  widgetOrder: string[];
  sidebarCollapsed: boolean;
}

interface PersonalizationData {
  preferences: UIPreference;
  confidence: number;
  adaptationLevel: number;
  recentChanges: Array<{
    type: string;
    timestamp: string;
    details: string;
  }>;
  timeBasedPatterns: Array<{
    timeRange: string;
    preferredLayout: string;
  }>;
  devicePreferences: Array<{
    device: string;
    usage: number;
    preferredLayout: string;
  }>;
}

const COLORS = ['#8b5cf6', '#ec4899', '#10b981', '#3b82f6', '#f59e0b'];

export default function AdaptiveUIPage() {
  const router = useRouter();
  const { user, isAuthenticated, loadUser } = useStore();
  const { isConnected } = useSocket();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [personalization, setPersonalization] = useState<PersonalizationData | null>(null);

  // Subscribe to prediction updates
  const [latestPrediction, setLatestPrediction] = useState<any>(null);
  useSocketEvent('prediction_update', (data) => {
    // Handle prediction updates - data has layout, nextPage, analytics, timestamp
    setLatestPrediction(data);
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
    if (isAuthenticated && user?.id) {
      fetchPersonalizationData();
    }
  }, [isAuthenticated, user?.id]);

  const fetchPersonalizationData = async () => {
    try {
      setError(null);
      // Try to fetch from API
      const response = await api.getPredictions('ui_layout');
      if (response.data?.data) {
        setPersonalization(response.data.data);
      }
    } catch (err) {
      console.log('Using mock data for Adaptive UI');
      // Use mock data for demo
      setPersonalization({
        preferences: {
          layout: 'sidebar',
          theme: 'dark',
          colorScheme: 'purple',
          widgetOrder: ['dashboard', 'analytics', 'notifications', 'tasks', 'reports'],
          sidebarCollapsed: false,
        },
        confidence: 0.87,
        adaptationLevel: 78,
        recentChanges: [
          { type: 'layout', timestamp: new Date().toISOString(), details: 'Sidebar expanded based on time of day' },
          { type: 'widget', timestamp: new Date(Date.now() - 3600000).toISOString(), details: 'Reports widget moved to primary position' },
          { type: 'theme', timestamp: new Date(Date.now() - 86400000).toISOString(), details: 'Color scheme adjusted for evening hours' },
        ],
        timeBasedPatterns: [
          { timeRange: 'Morning (6AM-12PM)', preferredLayout: 'expanded' },
          { timeRange: 'Afternoon (12PM-6PM)', preferredLayout: 'sidebar' },
          { timeRange: 'Evening (6PM-12AM)', preferredLayout: 'compact' },
          { timeRange: 'Night (12AM-6AM)', preferredLayout: 'minimal' },
        ],
        devicePreferences: [
          { device: 'Desktop', usage: 65, preferredLayout: 'expanded' },
          { device: 'Tablet', usage: 25, preferredLayout: 'sidebar' },
          { device: 'Mobile', usage: 10, preferredLayout: 'minimal' },
        ],
      });
    }
  };

  // Chart data
  const adaptationHistory = [
    { date: 'Mon', adaptation: 65, confidence: 72 },
    { date: 'Tue', adaptation: 68, confidence: 75 },
    { date: 'Wed', adaptation: 72, confidence: 78 },
    { date: 'Thu', adaptation: 70, confidence: 80 },
    { date: 'Fri', adaptation: 74, confidence: 82 },
    { date: 'Sat', adaptation: 76, confidence: 84 },
    { date: 'Sun', adaptation: 78, confidence: 87 },
  ];

  const timeDistribution = [
    { name: 'Morning', value: 35 },
    { name: 'Afternoon', value: 30 },
    { name: 'Evening', value: 25 },
    { name: 'Night', value: 10 },
  ];

  const widgetUsage = [
    { name: 'Dashboard', usage: 145 },
    { name: 'Analytics', usage: 98 },
    { name: 'Notifications', usage: 87 },
    { name: 'Tasks', usage: 65 },
    { name: 'Reports', usage: 52 },
  ];

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

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
            <h1 className="text-2xl font-bold text-white">Adaptive UI</h1>
            <p className="text-gray-400">AI-powered UI personalization</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full ${
              isConnected ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></span>
              <span className={`text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
            <button
              onClick={fetchPersonalizationData}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl p-5 border border-purple-500/30"
          >
            <div className="text-gray-400 text-sm mb-1">Adaptation Level</div>
            <div className="text-3xl font-bold text-white">{personalization?.adaptationLevel || 0}%</div>
            <div className="text-xs text-purple-400 mt-1">AI learning progress</div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-5 border border-gray-700/50"
          >
            <div className="text-gray-400 text-sm mb-1">Confidence</div>
            <div className={`text-3xl font-bold ${getConfidenceColor((personalization?.confidence || 0.87))}`}>
              {Math.round((personalization?.confidence || 0.87) * 100)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">Prediction accuracy</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-5 border border-gray-700/50"
          >
            <div className="text-gray-400 text-sm mb-1">Layout</div>
            <div className="text-2xl font-bold text-white capitalize">{personalization?.preferences.layout || 'sidebar'}</div>
            <div className="text-xs text-gray-500 mt-1">Current layout</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-5 border border-gray-700/50"
          >
            <div className="text-gray-400 text-sm mb-1">Theme</div>
            <div className="text-2xl font-bold text-white capitalize">{personalization?.preferences.theme || 'dark'}</div>
            <div className="text-xs text-gray-500 mt-1">Active theme</div>
          </motion.div>
        </div>

        {/* Current Preferences */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50"
        >
          <h3 className="text-xl font-semibold text-white mb-4">Current Preferences</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 bg-gray-900/50 rounded-lg">
              <div className="text-gray-400 text-sm mb-1">Layout</div>
              <div className="text-white font-medium capitalize">{personalization?.preferences.layout || 'sidebar'}</div>
            </div>
            <div className="p-4 bg-gray-900/50 rounded-lg">
              <div className="text-gray-400 text-sm mb-1">Theme</div>
              <div className="text-white font-medium capitalize">{personalization?.preferences.theme || 'dark'}</div>
            </div>
            <div className="p-4 bg-gray-900/50 rounded-lg">
              <div className="text-gray-400 text-sm mb-1">Color Scheme</div>
              <div className="text-white font-medium capitalize">{personalization?.preferences.colorScheme || 'purple'}</div>
            </div>
            <div className="p-4 bg-gray-900/50 rounded-lg">
              <div className="text-gray-400 text-sm mb-1">Sidebar</div>
              <div className="text-white font-medium">{personalization?.preferences.sidebarCollapsed ? 'Collapsed' : 'Expanded'}</div>
            </div>
            <div className="p-4 bg-gray-900/50 rounded-lg">
              <div className="text-gray-400 text-sm mb-1">Widgets</div>
              <div className="text-white font-medium">{personalization?.preferences.widgetOrder?.length || 5}</div>
            </div>
          </div>

          {/* Widget Order */}
          <div className="mt-4">
            <div className="text-gray-400 text-sm mb-2">Widget Order</div>
            <div className="flex flex-wrap gap-2">
              {personalization?.preferences.widgetOrder?.map((widget, index) => (
                <span key={index} className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                  {index + 1}. {widget}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Adaptation History */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Adaptation History</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={adaptationHistory}>
                <defs>
                  <linearGradient id="colorAdaptation" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="adaptation" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorAdaptation)" />
                <Area type="monotone" dataKey="confidence" stroke="#10b981" fillOpacity={0.1} fill="#10b981" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Time Distribution */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Time-Based Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={timeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {timeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Time-Based Patterns */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Time-Based Patterns</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {personalization?.timeBasedPatterns?.map((pattern, index) => (
              <div key={index} className="p-4 bg-gray-900/50 rounded-lg">
                <div className="text-gray-400 text-sm">{pattern.timeRange}</div>
                <div className="text-white font-medium capitalize mt-1">{pattern.preferredLayout}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Widget Usage & Recent Changes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Widget Usage */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Widget Usage</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={widgetUsage}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="usage" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Recent Changes */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Recent Changes</h3>
            <div className="space-y-3">
              {personalization?.recentChanges?.map((change, index) => (
                <div key={index} className="p-3 bg-gray-900/50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-medium capitalize">{change.type}</span>
                    <span className="text-gray-500 text-xs">
                      {new Date(change.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">{change.details}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Device Preferences */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Device Preferences</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {personalization?.devicePreferences?.map((device, index) => (
              <div key={index} className="p-4 bg-gray-900/50 rounded-lg">
                <div className="text-gray-400 text-sm mb-2">{device.device}</div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold text-white">{device.usage}%</span>
                  <span className="text-gray-500 text-sm">usage</span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    style={{ width: `${device.usage}%` }}
                  />
                </div>
                <div className="text-purple-400 text-sm mt-2 capitalize">{device.preferredLayout} layout</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}

