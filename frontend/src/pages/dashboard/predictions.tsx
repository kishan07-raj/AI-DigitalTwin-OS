import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useStore } from '../../store';
import api from '../../utils/api';

interface Prediction {
  type: string;
  modelName: string;
  prediction: any;
  confidence: number;
  features: string[];
}

interface PredictionsData {
  ui?: Prediction;
  behavior?: Prediction;
  automation?: Prediction;
}

interface PagePrediction {
  page: string;
  probability: number;
}

interface BehaviorInsight {
  action: string;
  confidence: number;
  reason: string;
}

export default function PredictionsPage() {
  const router = useRouter();
  const { isAuthenticated, loadUser } = useStore();
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState<PredictionsData | null>(null);
  const [history, setHistory] = useState<Prediction[]>([]);
  const [feedback, setFeedback] = useState('');
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');

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
      fetchPredictions();
      fetchHistory();
    }
  }, [isAuthenticated]);

  const fetchPredictions = async () => {
    try {
      const response = await api.getPredictions();
      setPredictions(response.data.data);
    } catch (error) {
      console.error('Failed to fetch predictions:', error);
      // Set mock data for demo
      setPredictions({
        ui: {
          type: 'ui_layout',
          modelName: 'adaptive-ui-v1',
          prediction: {
            preferredLayout: 'sidebar',
            collapsedSidebar: false,
            theme: 'adaptive',
            widgetOrder: ['dashboard', 'analytics', 'tasks', 'notifications'],
          },
          confidence: 0.87,
          features: ['user_history', 'time_of_day', 'device_type'],
        },
        behavior: {
          type: 'user_behavior',
          modelName: 'behavior-v1',
          prediction: {
            likelyActions: ['open_dashboard', 'check_notifications', 'view_reports'],
            peakActivityTime: 'morning',
            preferredFeatures: ['analytics', 'reports'],
            sessionDuration: 30,
          },
          confidence: 0.78,
          features: ['historical_patterns', 'day_of_week', 'recent_activity'],
        },
        automation: {
          type: 'task_automation',
          modelName: 'automation-v1',
          prediction: {
            suggestions: [
              { id: 'auto_schedule', title: 'Auto-schedule meetings', description: 'Based on your calendar patterns', confidence: 0.82 },
              { id: 'quick_reply', title: 'Quick reply templates', description: 'Create quick replies for common messages', confidence: 0.75 },
            ],
          },
          confidence: 0.79,
          features: ['user_patterns', 'message_frequency'],
        },
      });
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await api.getPredictionHistory({ limit: 10 });
      setHistory(response.data.data);
    } catch (error) {
      console.error('Failed to fetch prediction history:', error);
    }
  };

  const submitFeedback = async (predictionId: string, type: 'positive' | 'negative') => {
    try {
      await api.submitFeedback(predictionId, type);
      setFeedback('Feedback submitted successfully!');
      setTimeout(() => setFeedback(''), 3000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConfidenceBar = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Mock page predictions for visualization
  const pagePredictions: PagePrediction[] = [
    { page: '/dashboard', probability: 0.85 },
    { page: '/dashboard/analytics', probability: 0.65 },
    { page: '/dashboard/twin', probability: 0.45 },
    { page: '/dashboard/settings', probability: 0.30 },
    { page: '/dashboard/activity', probability: 0.25 },
  ];

  // Mock behavior insights
  const behaviorInsights: BehaviorInsight[] = [
    { action: 'Open Dashboard', confidence: 0.92, reason: 'Most frequent starting point' },
    { action: 'Check Analytics', confidence: 0.78, reason: 'Usually after login' },
    { action: 'View Reports', confidence: 0.65, reason: 'Peak activity time' },
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
            <h1 className="text-2xl font-bold text-white">AI Predictions</h1>
            <p className="text-gray-400">AI-powered predictions and behavior analysis</p>
          </div>
          <button
            onClick={fetchPredictions}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <span>🔄</span>
            <span>Refresh Predictions</span>
          </button>
        </div>

        {/* Feedback Toast */}
        {feedback && (
          <div className="bg-green-500/20 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg">
            {feedback}
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-2 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'current'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Current Predictions
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            History
          </button>
        </div>

        {activeTab === 'current' ? (
          <>
            {/* Next Page Prediction */}
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <span className="mr-2">🎯</span> Next Page Prediction
              </h3>
              <div className="space-y-4">
                {pagePredictions.map((pred, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-400 w-8">{index + 1}.</span>
                      <span className="text-white">{pred.page}</span>
                    </div>
                    <div className="flex items-center space-x-3 w-48">
                      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getConfidenceBar(pred.probability)} transition-all`}
                          style={{ width: `${pred.probability * 100}%` }}
                        ></div>
                      </div>
                      <span className={`text-sm font-medium w-12 text-right ${getConfidenceColor(pred.probability)}`}>
                        {Math.round(pred.probability * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Models */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* UI Layout Prediction */}
              <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">🎨 UI Layout</h3>
                  <span className={`text-2xl font-bold ${getConfidenceColor(predictions?.ui?.confidence || 0.85)}`}>
                    {Math.round((predictions?.ui?.confidence || 0.85) * 100)}%
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Layout</span>
                    <span className="text-white">{predictions?.ui?.prediction?.preferredLayout || 'Sidebar'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Theme</span>
                    <span className="text-white">{predictions?.ui?.prediction?.theme || 'Adaptive'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Sidebar</span>
                    <span className="text-white">{predictions?.ui?.prediction?.collapsedSidebar ? 'Collapsed' : 'Expanded'}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-500">Model: {predictions?.ui?.modelName || 'adaptive-ui-v1'}</p>
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={() => submitFeedback('ui', 'positive')}
                      className="flex-1 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm transition-colors"
                    >
                      👍 Accurate
                    </button>
                    <button
                      onClick={() => submitFeedback('ui', 'negative')}
                      className="flex-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors"
                    >
                      👎 Wrong
                    </button>
                  </div>
                </div>
              </div>

              {/* Behavior Prediction */}
              <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">📊 Behavior</h3>
                  <span className={`text-2xl font-bold ${getConfidenceColor(predictions?.behavior?.confidence || 0.78)}`}>
                    {Math.round((predictions?.behavior?.confidence || 0.78) * 100)}%
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Peak Time</span>
                    <span className="text-white">{predictions?.behavior?.prediction?.peakActivityTime || 'Morning'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Avg Session</span>
                    <span className="text-white">{predictions?.behavior?.prediction?.sessionDuration || 30} min</span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Likely Actions</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(predictions?.behavior?.prediction?.likelyActions || ['open_dashboard', 'check_notifications', 'view_reports']).map((action: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                          {action.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-500">Model: {predictions?.behavior?.modelName || 'behavior-v1'}</p>
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={() => submitFeedback('behavior', 'positive')}
                      className="flex-1 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm transition-colors"
                    >
                      👍 Accurate
                    </button>
                    <button
                      onClick={() => submitFeedback('behavior', 'negative')}
                      className="flex-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors"
                    >
                      👎 Wrong
                    </button>
                  </div>
                </div>
              </div>

              {/* Automation Suggestions */}
              <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">⚡ Automation</h3>
                  <span className={`text-2xl font-bold ${getConfidenceColor(predictions?.automation?.confidence || 0.79)}`}>
                    {Math.round((predictions?.automation?.confidence || 0.79) * 100)}%
                  </span>
                </div>
                <div className="space-y-3">
                  {(predictions?.automation?.prediction?.suggestions || [
                    { id: 'auto_schedule', title: 'Auto-schedule meetings', description: 'Based on your calendar patterns' },
                    { id: 'quick_reply', title: 'Quick reply templates', description: 'Create quick replies' },
                  ]).map((suggestion: any, i: number) => (
                    <div key={i} className="p-3 bg-gray-900/50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <span className="text-white text-sm font-medium">{suggestion.title}</span>
                        <span className="text-xs text-gray-400">{Math.round(suggestion.confidence * 100)}%</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{suggestion.description}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-500">Model: {predictions?.automation?.modelName || 'automation-v1'}</p>
                  <button className="w-full mt-2 px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg text-sm transition-colors">
                    Enable Automations
                  </button>
                </div>
              </div>
            </div>

            {/* Behavior Insights */}
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <span className="mr-2">💡</span> Behavior Insights
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {behaviorInsights.map((insight, index) => (
                  <div key={index} className="p-4 bg-gray-900/50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{insight.action}</span>
                      <span className={`text-sm font-bold ${getConfidenceColor(insight.confidence)}`}>
                        {Math.round(insight.confidence * 100)}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{insight.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* History Tab */
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 overflow-hidden">
            {history.length > 0 ? (
              <div className="divide-y divide-gray-700/50">
                {history.map((item, index) => (
                  <div key={index} className="p-4 hover:bg-gray-700/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-white font-medium capitalize">{item.type.replace('_', ' ')}</span>
                        <p className="text-sm text-gray-400">Model: {item.modelName}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-lg font-bold ${getConfidenceColor(item.confidence)}`}>
                          {Math.round(item.confidence * 100)}%
                        </span>
                        <p className="text-xs text-gray-500">
                          {new Date().toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-400">
                No prediction history available yet.
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

