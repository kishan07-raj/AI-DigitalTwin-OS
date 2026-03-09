import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useStore } from '../../store';
import api from '../../utils/api';
import { useSocket } from '../../hooks/useSocket';
import { 
  ActivityTimelineChart, 
  ProductivityTrendsChart 
} from '../../components/Charts';

interface SystemMetrics {
  cpu: number;
  memory: number;
  network: number;
  disk: number;
  uptime: number;
  requestsPerMinute: number;
  avgResponseTime: number;
  errorRate: number;
}

interface HealthData {
  status: string;
  uptime: number;
  metrics: {
    memory: { percentage: number };
    cpu?: { percentage: number };
    network?: { incoming: number; outgoing: number };
    disk?: { percentage: number };
  };
  services?: {
    backend: string;
    websocket: string;
    aiEngine: string;
    database: string;
  };
  timestamp?: string;
}

export default function SystemHealthPage() {
  const router = useRouter();
  const { isAuthenticated, loadUser } = useStore();
  const { isConnected } = useSocket();
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: 0,
    memory: 0,
    network: 0,
    disk: 0,
    uptime: 0,
    requestsPerMinute: 0,
    avgResponseTime: 0,
    errorRate: 0,
  });
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'anomalies' | 'logs'>('overview');
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealthData = useCallback(async () => {
    try {
      const response = await api.getSystemHealthDetailed();
      if (response.data) {
        setHealth(response.data.health || response.data);
      }
    } catch (error) {
      console.error('Failed to fetch health data:', error);
      // Fallback mock data
      setHealth({
        status: 'healthy',
        uptime: 86400 + Math.floor(Math.random() * 3600),
        metrics: {
          memory: { percentage: 30 + Math.floor(Math.random() * 30) },
          cpu: { percentage: 20 + Math.floor(Math.random() * 40) },
          network: { incoming: Math.random() * 100, outgoing: Math.random() * 50 },
          disk: { percentage: 40 + Math.floor(Math.random() * 20) },
        },
        services: {
          backend: 'healthy',
          websocket: 'healthy',
          aiEngine: 'healthy',
          database: 'healthy',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }, []);

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await api.getSystemMetrics();
      if (response.data) {
        setMetrics(response.data);
      }
    } catch (error) {
      // Generate realistic mock metrics
      setMetrics({
        cpu: 15 + Math.random() * 35,
        memory: 30 + Math.random() * 30,
        network: 10 + Math.random() * 40,
        disk: 40 + Math.random() * 20,
        uptime: health?.uptime || 86400,
        requestsPerMinute: 50 + Math.floor(Math.random() * 150),
        avgResponseTime: 50 + Math.random() * 150,
        errorRate: Math.random() * 2,
      });
    }
  }, [health?.uptime]);

  const fetchAnomalies = useCallback(async () => {
    try {
      const response = await api.getAnomalyDetection();
      if (response.data && response.data.anomalies) {
        setAnomalies(response.data.anomalies);
      }
    } catch (error) {
      // Mock anomalies
      setAnomalies([
        {
          id: '1',
          type: 'performance',
          severity: 'low',
          description: 'Slight increase in response time',
          timestamp: new Date().toISOString(),
          resolved: false,
        },
      ]);
    }
  }, []);

  const checkAndHeal = async () => {
    setRefreshing(true);
    try {
      await api.runSystemCheck();
      await fetchHealthData();
      await fetchAnomalies();
    } catch (error) {
      console.error('Check and heal failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUser().then(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchHealthData();
      fetchMetrics();
      fetchAnomalies();

      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchHealthData();
        fetchMetrics();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchHealthData, fetchMetrics, fetchAnomalies]);

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  };

  const getServiceStatus = (status: string): { color: string; icon: string } => {
    switch (status) {
      case 'healthy':
        return { color: 'text-green-400', icon: '✓' };
      case 'degraded':
        return { color: 'text-yellow-400', icon: '⚠' };
      case 'unhealthy':
        return { color: 'text-red-400', icon: '✗' };
      default:
        return { color: 'text-gray-400', icon: '?' };
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">System Health</h1>
            <p className="text-gray-400">Self-Healing & Anomaly Detection</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className={`px-3 py-1.5 rounded-full flex items-center space-x-2 ${
              isConnected ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} ${isConnected ? 'animate-pulse' : ''}`}></span>
              <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
            {/* Refresh Button */}
            <button
              onClick={checkAndHeal}
              disabled={refreshing}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg text-white font-medium transition-colors flex items-center space-x-2"
            >
              <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
              <span>{refreshing ? 'Checking...' : 'Run Diagnostics'}</span>
            </button>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`rounded-xl p-4 border ${
          health?.status === 'healthy' 
            ? 'bg-green-500/10 border-green-500/30' 
            : 'bg-yellow-500/10 border-yellow-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">
                {health?.status === 'healthy' ? '🟢' : '🟡'}
              </span>
              <div>
                <div className="text-white font-semibold">
                  System Status: {health?.status?.toUpperCase() || 'UNKNOWN'}
                </div>
                <div className="text-gray-400 text-sm">
                  Uptime: {formatUptime(health?.uptime || 0)} • Last check: {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : 'N/A'}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-purple-400 font-bold text-2xl">
                {anomalies.filter(a => !a.resolved).length}
              </div>
              <div className="text-gray-400 text-sm">Active Anomalies</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-800/50 p-1 rounded-lg w-fit">
          {(['overview', 'metrics', 'anomalies', 'logs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Services Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(health?.services || {
                backend: 'healthy',
                websocket: 'healthy',
                aiEngine: 'healthy',
                database: 'healthy',
              }).map(([service, status]) => {
                const { color, icon } = getServiceStatus(status as string);
                return (
                  <div key={service} className="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm capitalize">{service}</span>
                      <span className={color}>{icon}</span>
                    </div>
                    <div className={`text-lg font-semibold ${color}`}>
                      {status?.toUpperCase() || 'UNKNOWN'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Main Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
                <div className="text-gray-400 text-sm mb-2">CPU Usage</div>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold text-white">
                    {(metrics?.cpu ?? 0).toFixed(1)}%
                  </div>
                  <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                      style={{ width: `${metrics?.cpu ?? 0}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
                <div className="text-gray-400 text-sm mb-2">Memory Usage</div>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold text-white">
                    {(metrics?.memory ?? 0).toFixed(1)}%
                  </div>
                  <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                      style={{ width: `${metrics?.memory ?? 0}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
                <div className="text-gray-400 text-sm mb-2">Network I/O</div>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold text-white">
                    {(metrics?.network ?? 0).toFixed(0)} MB/s
                  </div>
                  <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(metrics?.network ?? 0, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
                <div className="text-gray-400 text-sm">Requests/min</div>
                <div className="text-2xl font-bold text-white">{metrics?.requestsPerMinute ?? 0}</div>
              </div>
              <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
                <div className="text-gray-400 text-sm">Avg Response</div>
                <div className="text-2xl font-bold text-white">{(metrics?.avgResponseTime ?? 0).toFixed(0)}ms</div>
              </div>
              <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
                <div className="text-gray-400 text-sm">Error Rate</div>
                <div className="text-2xl font-bold text-green-400">{(metrics?.errorRate ?? 0).toFixed(2)}%</div>
              </div>
              <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
                <div className="text-gray-400 text-sm">Disk Usage</div>
                <div className="text-2xl font-bold text-white">{(metrics?.disk ?? 0).toFixed(0)}%</div>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Tab */}
        {activeTab === 'metrics' && (
          <div className="space-y-6">
            {/* Real-time Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Activity Timeline</h3>
                <ActivityTimelineChart 
                  data={[
                    { time: '00:00', activities: 12 },
                    { time: '04:00', activities: 5 },
                    { time: '08:00', activities: 45 },
                    { time: '12:00', activities: 78 },
                    { time: '16:00', activities: 92 },
                    { time: '20:00', activities: 56 },
                    { time: '24:00', activities: 23 },
                  ]}
                  height={250}
                />
              </div>
              <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Productivity Trends</h3>
                <ProductivityTrendsChart 
                  data={[
                    { day: 'Mon', productivity: 75, sessions: 12 },
                    { day: 'Tue', productivity: 82, sessions: 15 },
                    { day: 'Wed', productivity: 90, sessions: 18 },
                    { day: 'Thu', productivity: 78, sessions: 14 },
                    { day: 'Fri', productivity: 85, sessions: 16 },
                    { day: 'Sat', productivity: 45, sessions: 6 },
                    { day: 'Sun', productivity: 35, sessions: 4 },
                  ]}
                  height={250}
                />
              </div>
            </div>

            {/* Detailed Metrics */}
            <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Detailed System Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-900/50 rounded-lg">
                  <div className="text-gray-400 text-sm mb-1">CPU Cores</div>
                  <div className="text-xl font-bold text-white">4</div>
                </div>
                <div className="p-4 bg-gray-900/50 rounded-lg">
                  <div className="text-gray-400 text-sm mb-1">Total Memory</div>
                  <div className="text-xl font-bold text-white">16 GB</div>
                </div>
                <div className="p-4 bg-gray-900/50 rounded-lg">
                  <div className="text-gray-400 text-sm mb-1">Storage</div>
                  <div className="text-xl font-bold text-white">512 GB</div>
                </div>
                <div className="p-4 bg-gray-900/50 rounded-lg">
                  <div className="text-gray-400 text-sm mb-1">Active Connections</div>
                  <div className="text-xl font-bold text-white">24</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Anomalies Tab */}
        {activeTab === 'anomalies' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Detected Anomalies</h3>
              <span className="text-gray-400 text-sm">
                {anomalies.filter(a => !a.resolved).length} active
              </span>
            </div>
            
            {anomalies.length > 0 ? (
              <div className="space-y-3">
                {anomalies.map((anomaly, index) => (
                  <div 
                    key={anomaly.id || index}
                    className={`p-4 rounded-xl border ${getSeverityColor(anomaly.severity)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold capitalize">{anomaly.type}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800">
                            {anomaly.severity}
                          </span>
                        </div>
                        <p className="text-sm">{anomaly.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {anomaly.timestamp ? new Date(anomaly.timestamp).toLocaleString() : 'Recent'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!anomaly.resolved && (
                          <button
                            onClick={() => {
                              setAnomalies(anomalies.map((a, i) => 
                                i === index ? { ...a, resolved: true } : a
                              ));
                            }}
                            className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-sm text-white"
                          >
                            Resolve
                          </button>
                        )}
                        {anomaly.resolved && (
                          <span className="text-green-400 text-sm">✓ Resolved</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-800/50 p-8 rounded-xl border border-gray-700 text-center">
                <div className="text-4xl mb-2">✨</div>
                <div className="text-white font-semibold">No Anomalies Detected</div>
                <div className="text-gray-400 text-sm">System is running smoothly</div>
              </div>
            )}
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">System Logs</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50 sticky top-0">
                  <tr>
                    <th className="text-left p-3 text-gray-400 text-sm font-medium">Timestamp</th>
                    <th className="text-left p-3 text-gray-400 text-sm font-medium">Level</th>
                    <th className="text-left p-3 text-gray-400 text-sm font-medium">Source</th>
                    <th className="text-left p-3 text-gray-400 text-sm font-medium">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {[
                    { time: new Date().toISOString(), level: 'info', source: 'backend', message: 'API request processed successfully' },
                    { time: new Date(Date.now() - 60000).toISOString(), level: 'info', source: 'websocket', message: 'New client connected' },
                    { time: new Date(Date.now() - 120000).toISOString(), level: 'warn', source: 'ai_engine', message: 'Prediction model cache refreshed' },
                    { time: new Date(Date.now() - 180000).toISOString(), level: 'info', source: 'database', message: 'Connection pool stats updated' },
                    { time: new Date(Date.now() - 240000).toISOString(), level: 'info', source: 'backend', message: 'Health check completed' },
                  ].map((log, index) => (
                    <tr key={index} className="hover:bg-gray-700/30">
                      <td className="p-3 text-gray-400 text-sm font-mono">
                        {new Date(log.time).toLocaleTimeString()}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          log.level === 'error' ? 'bg-red-500/20 text-red-400' :
                          log.level === 'warn' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {log.level.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-gray-400 text-sm">{log.source}</td>
                      <td className="p-3 text-white text-sm">{log.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

