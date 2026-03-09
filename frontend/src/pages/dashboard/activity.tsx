import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useStore } from '../../store';
import api from '../../utils/api';

interface Activity {
  _id: string;
  type: string;
  action: string;
  page: string;
  element?: string;
  duration?: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface Session {
  _id: string;
  sessionId: string;
  device: string;
  location: string;
  startedAt: string;
  lastActive: string;
  status: string;
  duration?: number;
}

export default function ActivityPage() {
  const router = useRouter();
  const { isAuthenticated, loadUser } = useStore();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTab, setActiveTab] = useState<'activities' | 'sessions'>('activities');
  const [filter, setFilter] = useState('all');
  const [pagination, setPagination] = useState({ total: 0, limit: 20, skip: 0 });

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
      fetchActivities();
      fetchSessions();
    }
  }, [isAuthenticated, filter]);

  const fetchActivities = async () => {
    try {
      const params: any = { limit: pagination.limit, skip: pagination.skip };
      if (filter !== 'all') params.type = filter;
      
      const response = await api.getActivities(params);
      setActivities(response.data.data.activities);
      setPagination(prev => ({ ...prev, ...response.data.data.pagination }));
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await api.getSessions({ limit: pagination.limit, skip: pagination.skip });
      setSessions(response.data.data.sessions);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'click': return '👆';
      case 'page_view': return '👁️';
      case 'scroll': return '📜';
      case 'input': return '⌨️';
      case 'navigation': return '🧭';
      default: return '📝';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'ended': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Activity Monitoring</h1>
            <p className="text-gray-400">Track and analyze user behavior patterns</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Activities</option>
              <option value="click">Clicks</option>
              <option value="page_view">Page Views</option>
              <option value="scroll">Scrolls</option>
              <option value="input">Inputs</option>
              <option value="navigation">Navigation</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-5 border border-gray-700/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">Total Activities</span>
              <span className="text-2xl">📊</span>
            </div>
            <div className="text-2xl font-bold text-white">{pagination.total}</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-5 border border-gray-700/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">Total Sessions</span>
              <span className="text-2xl">💻</span>
            </div>
            <div className="text-2xl font-bold text-white">{sessions.length}</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-5 border border-gray-700/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">Avg Session</span>
              <span className="text-2xl">⏱️</span>
            </div>
            <div className="text-2xl font-bold text-white">12m 30s</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-5 border border-gray-700/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">Active Now</span>
              <span className="text-2xl">⚡</span>
            </div>
            <div className="text-2xl font-bold text-green-400">
              {sessions.filter(s => s.status === 'active').length}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('activities')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'activities'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Activities
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'sessions'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Sessions
          </button>
        </div>

        {/* Content */}
        {activeTab === 'activities' ? (
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Page</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Element</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {activities.length > 0 ? (
                    activities.map((activity) => (
                      <tr key={activity._id} className="hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span>{getActivityIcon(activity.type)}</span>
                            <span className="text-white capitalize">{activity.type.replace('_', ' ')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">{activity.action}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">{activity.page}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-400">{activity.element || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                          {activity.duration ? formatDuration(activity.duration) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">
                          {formatDate(activity.timestamp)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                        No activities found. Start using the dashboard to generate data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Session ID</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Device</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Started</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {sessions.length > 0 ? (
                    sessions.map((session) => (
                      <tr key={session._id} className="hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-white font-mono text-sm">{session.sessionId.slice(0, 8)}...</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">{session.device || 'Unknown'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">{session.location || 'Unknown'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">
                          {formatDate(session.startedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                          {session.duration ? formatDuration(session.duration) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(session.status)}`}>
                            {session.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                        No sessions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setPagination(prev => ({ ...prev, skip: Math.max(0, prev.skip - prev.limit) }))}
              disabled={pagination.skip === 0}
              className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700/50"
            >
              Previous
            </button>
            <span className="text-gray-400">
              Showing {pagination.skip + 1} - {Math.min(pagination.skip + pagination.limit, pagination.total)} of {pagination.total}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, skip: prev.skip + prev.limit }))}
              disabled={pagination.skip + pagination.limit >= pagination.total}
              className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700/50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}

