/**
 * AI Insights Panel Component
 * Displays AI-generated insights about user behavior
 */

import { useEffect, useState } from 'react';
import { useStore } from '../store';
import api from '../utils/api';
import { useInsightUpdates } from '../hooks/useSocket';

interface Insight {
  id: string;
  type: string;
  title: string;
  description: string;
  confidence: number;
  category: string;
}

interface ProductivityInsights {
  peakHours: number[];
  mostProductiveDay: string;
  avgSessionDuration: number;
  productivityScore: number;
}

export default function AIInsightsPanel() {
  const { user, isAuthenticated } = useStore();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [productivity, setProductivity] = useState<ProductivityInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to real-time insight updates
  const insightUpdates = useInsightUpdates();

  useEffect(() => {
    if (insightUpdates) {
      setInsights(insightUpdates.insights);
      setProductivity(insightUpdates.productivity);
    }
  }, [insightUpdates]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchInsights();
    }
  }, [isAuthenticated, user?.id]);

  const fetchInsights = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);

    try {
      const [insightsRes, productivityRes] = await Promise.all([
        api.getInsights(user.id),
        api.getProductivityInsights(user.id),
      ]);

      setInsights(insightsRes.data.insights || []);
      setProductivity(productivityRes.data.productivity || null);
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError('Failed to load insights');
      // Set default insights
      setInsights(getDefaultInsights());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultInsights = (): Insight[] => [
    {
      id: 'insight_1',
      type: 'productivity',
      title: 'Peak Productivity Hours',
      description: 'You are most productive between 9 AM and 11 AM',
      confidence: 0.85,
      category: 'time',
    },
    {
      id: 'insight_2',
      type: 'usage',
      title: 'Top Feature Usage',
      description: 'You spend 42% of your time analyzing data on the analytics dashboard',
      confidence: 0.90,
      category: 'usage',
    },
    {
      id: 'insight_3',
      type: 'pattern',
      title: 'Navigation Pattern',
      description: 'You usually open the analytics dashboard after activity monitoring',
      confidence: 0.75,
      category: 'pattern',
    },
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'time': return '⏰';
      case 'usage': return '📊';
      case 'pattern': return '🔄';
      case 'prediction': return '🎯';
      case 'recommendation': return '💡';
      default: return '✨';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'time': return 'from-blue-500 to-cyan-500';
      case 'usage': return 'from-purple-500 to-pink-500';
      case 'pattern': return 'from-green-500 to-emerald-500';
      case 'prediction': return 'from-orange-500 to-red-500';
      case 'recommendation': return 'from-yellow-500 to-amber-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.85) return 'text-green-400';
    if (confidence >= 0.7) return 'text-yellow-400';
    return 'text-orange-400';
  };

  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <span className="mr-2">💡</span> AI Insights
          </h3>
          <div className="animate-pulse bg-gray-700 h-4 w-20 rounded"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-gray-900/50 h-24 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <span className="mr-2">💡</span> AI Insights
        </h3>
        <button
          onClick={fetchInsights}
          className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Productivity Score */}
      {productivity && (
        <div className="mb-4 p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Productivity Score</span>
            <span className={`text-2xl font-bold ${getConfidenceColor(productivity.productivityScore / 100)}`}>
              {productivity.productivityScore}%
            </span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Best Day: {productivity.mostProductiveDay}</span>
            <span>Avg Session: {productivity.avgSessionDuration}m</span>
          </div>
        </div>
      )}

      {/* Insights List */}
      <div className="space-y-3">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className="p-4 bg-gray-900/30 rounded-lg border border-gray-700/30 hover:border-gray-600/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getCategoryColor(insight.category)} flex items-center justify-center text-lg flex-shrink-0`}>
                {getCategoryIcon(insight.category)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-white font-medium truncate">{insight.title}</h4>
                  <span className={`text-xs font-medium ${getConfidenceColor(insight.confidence)} ml-2`}>
                    {Math.round(insight.confidence * 100)}%
                  </span>
                </div>
                <p className="text-gray-400 text-sm">{insight.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {insights.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          <span className="text-4xl mb-2 block">🔍</span>
          <p>No insights available yet</p>
          <p className="text-sm">Keep using the platform to generate insights</p>
        </div>
      )}
    </div>
  );
}

