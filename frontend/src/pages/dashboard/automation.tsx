import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useStore } from '../../store';
import api from '../../utils/api';
import { useSocket } from '../../hooks/useSocket';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface AutomationTask {
  id: string;
  title: string;
  description: string;
  confidence: number;
  enabled: boolean;
  category: string;
}

interface AutomationData {
  tasks: AutomationTask[];
  summary: {
    totalTasks: number;
    enabledTasks: number;
    potentialSavings: number;
  };
}

export default function AutomationPage() {
  const router = useRouter();
  const { isAuthenticated, loadUser } = useStore();
  const { isConnected } = useSocket();
  
  const [loading, setLoading] = useState(true);
  const [automationData, setAutomationData] = useState<AutomationData | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      fetchAutomationData();
    }
  }, [isAuthenticated]);

  const fetchAutomationData = async () => {
    try {
      setError(null);
      const response = await api.getPredictions();
      if (response.data?.data?.automation) {
        setAutomationData({
          tasks: response.data.data.automation.prediction?.suggestions || [],
          summary: {
            totalTasks: 5,
            enabledTasks: 2,
            potentialSavings: 45,
          },
        });
      }
    } catch (err) {
      console.error('Failed to fetch automation data:', err);
    }
    
    // Set mock data for demo
    setAutomationData({
      tasks: [
        { id: 'auto_schedule', title: 'Auto-schedule meetings', description: 'Based on your calendar patterns', confidence: 0.85, enabled: true, category: 'scheduling' },
        { id: 'quick_reply', title: 'Quick reply templates', description: 'Create quick replies for common messages', confidence: 0.78, enabled: true, category: 'communication' },
        { id: 'data_backup', title: 'Automatic data backup', description: 'Backup important data daily', confidence: 0.92, enabled: false, category: 'data' },
        { id: 'report_gen', title: 'Weekly report generation', description: 'Generate reports every Friday', confidence: 0.88, enabled: false, category: 'reporting' },
        { id: 'notify_alerts', title: 'Smart notification filtering', description: 'Filter non-important notifications', confidence: 0.75, enabled: true, category: 'notifications' },
      ],
      summary: {
        totalTasks: 5,
        enabledTasks: 3,
        potentialSavings: 45,
      },
    });
  };

  const toggleTask = (taskId: string) => {
    if (automationData) {
      setAutomationData({
        ...automationData,
        tasks: automationData.tasks.map(task => 
          task.id === taskId ? { ...task, enabled: !task.enabled } : task
        ),
        summary: {
          ...automationData.summary,
          enabledTasks: automationData.tasks.filter(t => t.id === taskId ? !t.enabled : t.enabled).length,
        },
      });
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Mock data for charts
  const taskCategoryData = [
    { name: 'Scheduling', value: 1, color: '#8b5cf6' },
    { name: 'Communication', value: 1, color: '#ec4899' },
    { name: 'Data', value: 1, color: '#10b981' },
    { name: 'Reporting', value: 1, color: '#3b82f6' },
    { name: 'Notifications', value: 1, color: '#f59e0b' },
  ];

  const savingsData = [
    { day: 'Mon', savings: 12 },
    { day: 'Tue', savings: 19 },
    { day: 'Wed', savings: 8 },
    { day: 'Thu', savings: 15 },
    { day: 'Fri', savings: 22 },
    { day: 'Sat', savings: 5 },
    { day: 'Sun', savings: 3 },
  ];

  const automationActivityData = [
    { time: '00:00', tasks: 2 },
    { time: '04:00', tasks: 1 },
    { time: '08:00', tasks: 8 },
    { time: '12:00', tasks: 12 },
    { time: '16:00', tasks: 15 },
    { time: '20:00', tasks: 10 },
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
            <h1 className="text-2xl font-bold text-white">Automation</h1>
            <p className="text-gray-400">Smart task automation based on your patterns</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full ${
              isConnected ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></span>
              <span className={`text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
            <button
              onClick={fetchAutomationData}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-5 border border-gray-700/50">
            <div className="text-gray-400 text-sm mb-1">Total Tasks</div>
            <div className="text-2xl font-bold text-white">{automationData?.summary.totalTasks || 0}</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-5 border border-gray-700/50">
            <div className="text-gray-400 text-sm mb-1">Enabled</div>
            <div className="text-2xl font-bold text-green-400">{automationData?.summary.enabledTasks || 0}</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-5 border border-gray-700/50">
            <div className="text-gray-400 text-sm mb-1">Potential Savings</div>
            <div className="text-2xl font-bold text-purple-400">{automationData?.summary.potentialSavings || 0} min/day</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-5 border border-gray-700/50">
            <div className="text-gray-400 text-sm mb-1">Avg Confidence</div>
            <div className="text-2xl font-bold text-blue-400">
              {automationData ? Math.round(automationData.tasks.reduce((acc, t) => acc + t.confidence, 0) / automationData.tasks.length * 100) : 0}%
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Task Categories */}
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Task Categories</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskCategoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {taskCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Time Savings */}
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Daily Time Savings</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={savingsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} labelStyle={{ color: '#fff' }} />
                  <Bar dataKey="savings" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Automation Activity */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">Automation Activity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={automationActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} labelStyle={{ color: '#fff' }} />
                <Line type="monotone" dataKey="tasks" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Automation Tasks */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">Automation Tasks</h3>
          <div className="space-y-3">
            {automationData?.tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="text-white font-medium">{task.title}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      task.category === 'scheduling' ? 'bg-purple-500/20 text-purple-400' :
                      task.category === 'communication' ? 'bg-pink-500/20 text-pink-400' :
                      task.category === 'data' ? 'bg-green-500/20 text-green-400' :
                      task.category === 'reporting' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {task.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{task.description}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className={`text-sm font-bold ${getConfidenceColor(task.confidence)}`}>
                      {Math.round(task.confidence * 100)}%
                    </div>
                    <div className="text-xs text-gray-500">confidence</div>
                  </div>
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      task.enabled ? 'bg-purple-600' : 'bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      task.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">AI Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">💡</span>
                <span className="text-white font-medium">Enable Auto-schedule</span>
              </div>
              <p className="text-sm text-gray-400">
                Your calendar patterns suggest you prefer morning meetings. Enable auto-scheduling to optimize your day.
              </p>
            </div>
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">📊</span>
                <span className="text-white font-medium">Weekly Reports</span>
              </div>
              <p className="text-sm text-gray-400">
                You view analytics every Friday. Consider enabling automatic report generation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

