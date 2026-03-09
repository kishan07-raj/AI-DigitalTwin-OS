/**
 * AI Reports Dashboard
 * Displays comprehensive AI-generated reports with charts and insights
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useStore } from '../../store';
import { reportsService, Report, ReportData, AIInsight, SystemAlert, BehaviorPattern } from '../../services/reports';
import { 
  FileText, Download, Calendar, Clock, TrendingUp, BarChart3, 
  Loader2, RefreshCw, AlertTriangle, Zap, Brain, 
  Activity, Users, Eye, ArrowUp, ArrowDown, Minus,
  X, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Chart components
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Legend
} from 'recharts';

const COLORS = ['#8b5cf6', '#ec4899', '#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export default function ReportsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loadUser } = useStore();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [report, setReport] = useState<Report | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  // Initialize
  useEffect(() => {
    const init = async () => {
      await loadUser();
      setLoading(false);
    };
    init();
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  // Load report when tab changes
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchReport(activeTab);
    }
  }, [isAuthenticated, user, activeTab]);

  const fetchReport = async (type: 'daily' | 'weekly' | 'monthly') => {
    setGenerating(true);
    setError(null);
    try {
      let reportData: Report;
      switch (type) {
        case 'daily':
          reportData = await reportsService.getDailyReport();
          break;
        case 'weekly':
          reportData = await reportsService.getWeeklyReport();
          break;
        case 'monthly':
          reportData = await reportsService.getMonthlyReport();
          break;
      }
      setReport(reportData);
    } catch (err: any) {
      console.error('Failed to fetch report:', err);
      setError(err.message || 'Failed to generate report. Please try again.');
      // Set mock data for demo
      setReport(getMockReport(type));
    } finally {
      setGenerating(false);
    }
  };

  const handleRefresh = () => {
    fetchReport(activeTab);
  };

  const handleDownload = async (format: 'pdf' | 'json') => {
    if (!report) return;
    try {
      if (format === 'pdf') {
        await reportsService.downloadReportAsPDF(report.id);
      } else {
        await reportsService.downloadReportAsJSON(report.id);
      }
    } catch (err) {
      console.error('Download failed:', err);
    }
    setShowDownloadMenu(false);
  };

  // Format hour for display
  const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 || 12;
    return `${h}${ampm}`;
  };

  // Get productivity trend icon
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-4 h-4 text-green-400" />;
      case 'down': return <ArrowDown className="w-4 h-4 text-red-400" />;
      default: return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  // Get alert color
  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  // Get insight icon
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'productivity': return <Zap className="w-4 h-4" />;
      case 'usage': return <Eye className="w-4 h-4" />;
      case 'pattern': return <Activity className="w-4 h-4" />;
      case 'recommendation': return <Brain className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const reportData: ReportData = report?.data || getMockReport(activeTab).data;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">AI Reports</h1>
            <p className="text-gray-400">Comprehensive AI-powered productivity analysis</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={generating}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh Report"
            >
              <RefreshCw className={`w-5 h-5 text-gray-400 ${generating ? 'animate-spin' : ''}`} />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              <AnimatePresence>
                {showDownloadMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50"
                  >
                    <button
                      onClick={() => handleDownload('pdf')}
                      className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 rounded-t-lg"
                    >
                      Download PDF
                    </button>
                    <button
                      onClick={() => handleDownload('json')}
                      className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 rounded-b-lg"
                    >
                      Export JSON
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-gray-800/50 p-1 rounded-xl">
          {(['daily', 'weekly', 'monthly'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                activeTab === tab
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} Report
            </button>
          ))}
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span className="text-red-300">{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="p-1 hover:bg-red-500/30 rounded"
              >
                <X className="w-4 h-4 text-red-400" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {generating && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Generating AI-powered report...</p>
            </div>
          </div>
        )}

        {/* Report Content */}
        {!generating && report && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryCard
                title="Sessions"
                value={reportData.totalSessions}
                icon={<Users className="w-5 h-5" />}
                color="from-blue-500 to-cyan-500"
              />
              <SummaryCard
                title="Activities"
                value={reportData.totalActivities}
                icon={<Activity className="w-5 h-5" />}
                color="from-purple-500 to-pink-500"
              />
              <SummaryCard
                title="Activity Time"
                value={`${reportData.totalActivityTime}m`}
                icon={<Clock className="w-5 h-5" />}
                color="from-green-500 to-emerald-500"
              />
              <SummaryCard
                title="Productivity"
                value={`${reportData.productivityScore}%`}
                icon={<TrendingUp className="w-5 h-5" />}
                color="from-orange-500 to-red-500"
                trend={reportData.productivityTrend}
              />
            </div>

            {/* Charts Row 1 */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Activity by Hour */}
              <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-semibold text-white mb-4">Activity by Hour</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={reportData.activityByHour || []}>
                    <defs>
                      <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="hour" 
                      stroke="#9ca3af" 
                      fontSize={10}
                      tickFormatter={(val) => formatHour(val)}
                    />
                    <YAxis stroke="#9ca3af" fontSize={10} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      labelFormatter={(val) => formatHour(val)}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#8b5cf6" 
                      fillOpacity={1} 
                      fill="url(#colorActivity)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Activity by Day */}
              <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-semibold text-white mb-4">Activity by Day</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={reportData.activityByDay || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="day" stroke="#9ca3af" fontSize={10} />
                    <YAxis stroke="#9ca3af" fontSize={10} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Most Visited Pages */}
              <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-semibold text-white mb-4">Most Visited Pages</h3>
                <div className="space-y-3">
                  {(reportData.mostVisitedPages || []).slice(0, 5).map((page, index) => (
                    <div key={page.page} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-medium text-purple-400">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-300 text-sm">{page.page}</span>
                          <span className="text-gray-400 text-xs">{page.count} visits</span>
                        </div>
                        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${page.percentage}%` }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Productivity Metrics */}
              <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-semibold text-white mb-4">Productivity Analysis</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <div className="text-gray-400 text-xs mb-1">Peak Hours</div>
                    <div className="text-white text-lg font-semibold">
                      {reportData.peakProductivityHours?.slice(0, 2).map(h => formatHour(h)).join(' - ') || 'N/A'}
                    </div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <div className="text-gray-400 text-xs mb-1">Best Day</div>
                    <div className="text-white text-lg font-semibold">
                      {reportData.mostProductiveDay || 'N/A'}
                    </div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <div className="text-gray-400 text-xs mb-1">Avg Session</div>
                    <div className="text-white text-lg font-semibold">
                      {reportData.avgSessionDuration || 0}m
                    </div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <div className="text-gray-400 text-xs mb-1">Trend</div>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(reportData.productivityTrend || 'stable')}
                      <span className="text-white text-lg font-semibold capitalize">
                        {reportData.productivityTrend || 'stable'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Insights Section */}
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">AI Insights</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {(reportData.aiInsights || []).map((insight, index) => (
                  <motion.div
                    key={insight.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        insight.type === 'productivity' ? 'bg-green-500/20 text-green-400' :
                        insight.type === 'usage' ? 'bg-blue-500/20 text-blue-400' :
                        insight.type === 'pattern' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-orange-500/20 text-orange-400'
                      }`}>
                        {getInsightIcon(insight.type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{insight.title}</h4>
                        <p className="text-gray-400 text-sm mt-1">{insight.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="h-1 flex-1 bg-gray-700 rounded-full overflow-hidden max-w-[100px]">
                            <div 
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${(insight.confidence || 0) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {Math.round((insight.confidence || 0) * 100)}% confidence
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            {(reportData.recommendations?.length || 0) > 0 && (
              <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-lg font-semibold text-white">AI Recommendations</h3>
                </div>
                <div className="space-y-2">
                  {(reportData.recommendations || []).map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 text-gray-300">
                      <ChevronDown className="w-4 h-4 text-yellow-400 mt-1 flex-shrink-0" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Behavior Patterns */}
            {(reportData.behaviorPatterns?.length || 0) > 0 && (
              <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-semibold text-white">Behavior Patterns</h3>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {(reportData.behaviorPatterns || []).map((pattern, index) => (
                    <div key={index} className="bg-gray-900/50 rounded-lg p-4">
                      <div className="text-purple-400 text-sm font-medium capitalize mb-1">
                        {pattern.type.replace('_', ' ')}
                      </div>
                      <p className="text-gray-300 text-sm">{pattern.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* System Alerts */}
            {(reportData.systemAlerts?.length || 0) > 0 && (
              <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-lg font-semibold text-white">System Alerts</h3>
                </div>
                <div className="space-y-3">
                  {(reportData.systemAlerts || []).map((alert, index) => (
                    <div 
                      key={alert.id || index} 
                      className={`rounded-lg p-4 border ${getAlertColor(alert.type)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{alert.title}</h4>
                          <p className="text-sm opacity-80 mt-1">{alert.message}</p>
                        </div>
                        <span className="text-xs opacity-60">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prediction Summary */}
            {reportData.predictionSummary && (
              <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-pink-400" />
                  <h3 className="text-lg font-semibold text-white">AI Prediction Summary</h3>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-white">
                      {reportData.predictionSummary.total || 0}
                    </div>
                    <div className="text-gray-400 text-sm">Total Predictions</div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-green-400">
                      {reportData.predictionSummary.accuracy || 0}%
                    </div>
                    <div className="text-gray-400 text-sm">Accuracy</div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-purple-400">
                      {reportData.predictionSummary.topPredictions?.length || 0}
                    </div>
                    <div className="text-gray-400 text-sm">Active Predictions</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

// Summary Card Component
function SummaryCard({ 
  title, 
  value, 
  icon, 
  color, 
  trend 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  color: string;
  trend?: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-4 border border-gray-700/50"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white`}>
          {icon}
        </div>
        {trend && (
          <div className={`p-1 rounded ${
            trend === 'up' ? 'bg-green-500/20' : 
            trend === 'down' ? 'bg-red-500/20' : 
            'bg-gray-500/20'
          }`}>
            {trend === 'up' && <ArrowUp className="w-3 h-3 text-green-400" />}
            {trend === 'down' && <ArrowDown className="w-3 h-3 text-red-400" />}
            {trend === 'stable' && <Minus className="w-3 h-3 text-gray-400" />}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-gray-400 text-sm">{title}</div>
    </motion.div>
  );
}

// Mock data for demo
function getMockReport(type: 'daily' | 'weekly' | 'monthly'): Report {
  const days = type === 'daily' ? 1 : type === 'weekly' ? 7 : 30;
  const multiplier = days;
  
  return {
    id: `report_${type}_${Date.now()}`,
    userId: 'user1',
    type,
    title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
    summary: `AI-powered analysis of your ${type} productivity patterns`,
    data: {
      totalSessions: Math.floor(12 * multiplier),
      totalActivities: Math.floor(156 * multiplier),
      totalActivityTime: Math.floor(280 * multiplier),
      avgSessionDuration: 28,
      productivityScore: 75 + Math.floor(Math.random() * 20),
      productivityTrend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
      peakProductivityHours: [9, 10, 11],
      mostProductiveDay: 'Wednesday',
      mostVisitedPages: [
        { page: 'Dashboard', count: Math.floor(145 * multiplier), percentage: 35 },
        { page: 'Analytics', count: Math.floor(98 * multiplier), percentage: 24 },
        { page: 'Predictions', count: Math.floor(76 * multiplier), percentage: 18 },
        { page: 'Activity', count: Math.floor(52 * multiplier), percentage: 13 },
        { page: 'Settings', count: Math.floor(42 * multiplier), percentage: 10 },
      ],
      activityByHour: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: Math.floor(Math.random() * 30 * (i >= 9 && i <= 17 ? 2 : 1))
      })),
      activityByDay: [
        { day: 'Sun', count: Math.floor(45 * multiplier / 7) },
        { day: 'Mon', count: Math.floor(78 * multiplier / 7) },
        { day: 'Tue', count: Math.floor(92 * multiplier / 7) },
        { day: 'Wed', count: Math.floor(105 * multiplier / 7) },
        { day: 'Thu', count: Math.floor(88 * multiplier / 7) },
        { day: 'Fri', count: Math.floor(72 * multiplier / 7) },
        { day: 'Sat', count: Math.floor(38 * multiplier / 7) },
      ],
      pageViewsOverTime: [],
      aiInsights: [
        {
          id: 'insight_1',
          type: 'productivity' as const,
          title: 'Peak Productivity Hours',
          description: 'You are most productive between 9 AM and 11 AM. Consider scheduling important tasks during this time.',
          confidence: 0.85,
          category: 'time'
        },
        {
          id: 'insight_2',
          type: 'usage' as const,
          title: 'Top Feature Usage',
          description: 'You spend 42% of your time on the Analytics dashboard - your most-used feature.',
          confidence: 0.90,
          category: 'usage'
        },
        {
          id: 'insight_3',
          type: 'pattern' as const,
          title: 'Navigation Pattern',
          description: 'You typically start with Dashboard, then move to Analytics for detailed analysis.',
          confidence: 0.75,
          category: 'pattern'
        },
        {
          id: 'insight_4',
          type: 'recommendation' as const,
          title: 'Optimization Suggestion',
          description: 'Enable keyboard shortcuts for faster navigation between frequently used pages.',
          confidence: 0.68,
          category: 'recommendation'
        },
      ],
      recommendations: [
        'Schedule important tasks between 9 AM - 11 AM when your productivity peaks',
        'Consider using the analytics dashboard shortcut for quicker access',
        'Your Wednesday activity is highest - plan complex tasks for mid-week',
        'Take short breaks every 25 minutes to maintain focus',
      ],
      predictionSummary: {
        total: Math.floor(45 * multiplier),
        accuracy: 82,
        topPredictions: [
          { type: 'ui_layout', confidence: 0.85, prediction: { layout: 'sidebar' } },
          { type: 'next_page', confidence: 0.78, prediction: { page: 'analytics' } },
          { type: 'behavior', confidence: 0.72, prediction: { pattern: 'morning_focus' } },
        ],
      },
      systemAlerts: [
        {
          id: 'alert_1',
          type: 'info' as const,
          title: 'New Feature Available',
          message: 'Try the AI-powered automation suggestions in the settings panel.',
          timestamp: new Date().toISOString()
        }
      ],
      behaviorPatterns: [
        {
          type: 'high_frequency',
          description: 'You use the system frequently throughout the day with multiple sessions',
          frequency: Math.floor(12 * multiplier)
        },
        {
          type: 'navigation_pattern',
          description: 'Common path: Dashboard → Analytics → Predictions',
          frequency: 45
        },
        {
          type: 'time_preference',
          description: 'Primary usage time: 9:00 - 12:00',
          frequency: Math.floor(156 * multiplier)
        },
      ],
      topFeatures: ['Dashboard', 'Analytics', 'Predictions'],
      insights: ['Peak productivity at 10 AM', 'Most used dashboard'],
      predictions: [],
    },
    createdAt: new Date().toISOString(),
    status: 'completed'
  };
}

